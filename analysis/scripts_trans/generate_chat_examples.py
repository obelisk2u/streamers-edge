#!/usr/bin/env python3
from __future__ import annotations

"""
Generate Twitch-style chat lines with:
- Episodic generation (generate N lines, then reseed from real chat)
- Sanitized seeding (real usernames -> synthetic, mask mentions/urls/emails)
- Message-only generation (script assigns synthetic usernames)
- Length-gated exact-match blocking for long messages (prevents verbatim leakage)

Run:
  python analysis/scripts_trans/generate_300_example_chats.py

Output JSONL:
  {"id": 1, "type": "seed"|"gen", "text": "user_0007: ..."}
"""

import json
import os
import random
import re
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Iterable, Optional, List, Tuple, Set, Dict

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from tqdm import trange

try:
    from peft import PeftModel
except ImportError:
    PeftModel = None

# Input/output
INPUT_JSONL = Path("analysis/scripts_trans/all_chat.jsonl")
OUTPUT_JSONL = Path("analysis/data/processed/example_chats_300.jsonl")

# Model
BASE_MODEL = "microsoft/Phi-3-mini-4k-instruct"

# Adapter (set to None to disable)
ADAPTER_DIR = Path("analysis/scripts_trans/outputs/phi3-chat-lora-eom")
USE_ADAPTER = True  # set False to ignore ADAPTER_DIR even if it exists

# Special tokens
EOM_TOKEN = "<|eom|>"          # must exist in adapter tokenizer if STOP_AT_EOM=True
STOP_AT_EOM = True

# Output lines
NUM_LINES = 300

# Episodic generation
EPISODE_GEN = 30             
CONTEXT_LINES = 40             
SEED_LINES = 25              

# Real chat sampling
BIN_SIZE = 200                 # larger bins -> more variety per seed pick
INCLUDE_VID = False

# Generation controls
MAX_NEW_TOKENS = 64
TEMPERATURE = 1.05
TOP_P = 0.92
REPETITION_PENALTY = 1.08

# Filtering / safeguards
MAX_CHARS = 160
MIN_CHARS = 2
MAX_TRIES_PER_LINE = 50

# Allow repeated emotes/short spam, but prevent verbatim long lines
LONG_LEN = 35                  # only block exact matches if len(message) >= LONG_LEN
BLOCK_LONG_EXACT_MATCHES = True

# Identifier masking
MASK_IDENTIFIERS_IN_CONTEXT = True
MASK_IDENTIFIERS_IN_OUTPUT = True

# Synthetic usernames
SYNTH_USER_COUNT = 300
SYNTH_USER_PREFIX = "user_"
SYNTH_USER_PAD = 4

# Misc
SEED = 42
FLUSH_EVERY = 50


@dataclass
class ChatMessage:
    vid: str
    username: str
    message: str
    timestamp: datetime


def parse_timestamp(value: str) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def iter_messages(path: Path) -> Iterable[ChatMessage]:
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                p = json.loads(line)
            except json.JSONDecodeError:
                continue

            vid = str(p.get("vid", "")).strip()
            ts = str(p.get("ts", "")).strip()
            u = str(p.get("u", "")).strip()
            m = str(p.get("m", "")).strip()
            dt = parse_timestamp(ts)

            if not u or dt is None or not m:
                continue

            yield ChatMessage(vid=vid, username=u, message=m, timestamp=dt)


def build_bins(messages: List[ChatMessage], bin_size: int) -> List[List[str]]:
    if bin_size <= 0:
        return []
    total = len(messages) - (len(messages) % bin_size)
    if total <= 0:
        return []

    bins: List[List[str]] = []
    for i in range(0, total, bin_size):
        chunk = messages[i : i + bin_size]
        if INCLUDE_VID:
            lines = [
                f"[{msg.vid}] {msg.username}: {msg.message}" if msg.vid else f"{msg.username}: {msg.message}"
                for msg in chunk
            ]
        else:
            lines = [f"{msg.username}: {msg.message}" for msg in chunk]
        bins.append(lines)
    return bins


_ws = re.compile(r"\s+")
_re_mention = re.compile(r"(?<!\w)@[\w\d_]{2,}", flags=re.UNICODE)
_re_url = re.compile(r"(https?://\S+|www\.\S+)", flags=re.IGNORECASE)
_re_discord = re.compile(r"(discord\.gg/\S+)", flags=re.IGNORECASE)
_re_email = re.compile(r"[\w\.-]+@[\w\.-]+\.\w+", flags=re.IGNORECASE)


def clamp_one_line(text: str) -> str:
    t = (text or "").strip()
    t = t.splitlines()[0].strip() if t else ""
    t = _ws.sub(" ", t).strip()
    if len(t) > MAX_CHARS:
        t = t[:MAX_CHARS].rstrip()
    return t


def normalize_for_match(text: str) -> str:
    t = (text or "").strip().lower()
    t = _ws.sub(" ", t).strip()
    t = t.strip(" \t\r\n\"'`.,!?;:()[]{}")
    return t


def mask_identifiers(text: str) -> str:
    t = text or ""
    t = _re_url.sub("<url>", t)
    t = _re_discord.sub("<url>", t)
    t = _re_email.sub("<email>", t)
    t = _re_mention.sub("<mention>", t)
    return t


def extract_message_from_line(line: str) -> Tuple[str, str]:
    if ":" not in line:
        return ("", line.strip())
    u, m = line.split(":", 1)
    return (u.strip(), m.strip())


def looks_like_message(msg: str) -> bool:
    msg = clamp_one_line(msg)
    if len(msg) < MIN_CHARS:
        return False
    alnum = sum(ch.isalnum() for ch in msg)
    if alnum == 0:
        return False
    return True


def load_model_and_tokenizer():
    random.seed(SEED)
    torch.manual_seed(SEED)

    dtype = torch.bfloat16 if torch.cuda.is_available() and torch.cuda.is_bf16_supported() else torch.float16

    tok_src = str(ADAPTER_DIR) if (USE_ADAPTER and ADAPTER_DIR is not None and ADAPTER_DIR.exists()) else BASE_MODEL
    tokenizer = AutoTokenizer.from_pretrained(tok_src)

    if tokenizer.eos_token is None:
        tokenizer.eos_token = "</s>"
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    tokenizer.padding_side = "left"

    model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL,
        device_map="auto",
        torch_dtype=dtype,
        trust_remote_code=True,
    )

    if USE_ADAPTER and ADAPTER_DIR is not None and ADAPTER_DIR.exists():
        if PeftModel is None:
            raise SystemExit("peft is not installed, but USE_ADAPTER=True.")

        base_vocab = model.get_input_embeddings().weight.shape[0]
        tok_vocab = len(tokenizer)
        if base_vocab == tok_vocab:
            model = PeftModel.from_pretrained(model, str(ADAPTER_DIR))
        else:
            print(
                "[WARN] Vocab mismatch between BASE_MODEL and adapter/tokenizer; skipping adapter load.\n"
                f"       BASE_MODEL embedding vocab = {base_vocab}\n"
                f"       Adapter tokenizer vocab    = {tok_vocab}\n"
            )

    model.config.use_cache = False
    try:
        model.config.attn_implementation = "eager"
    except Exception:
        pass

    model.eval()
    return model, tokenizer


def get_eom_id(tokenizer: AutoTokenizer) -> Optional[int]:
    if not EOM_TOKEN:
        return None
    eom_id = tokenizer.convert_tokens_to_ids(EOM_TOKEN)
    if eom_id is None or eom_id == tokenizer.unk_token_id:
        return None
    return int(eom_id)


@torch.no_grad()
def generate_one_message(model, tokenizer, prompt: str) -> str:
    """
    Generate ONE message body (no username). End with <|eom|>.
    """
    prompt2 = (
        prompt
        + "\n"
        + "Write ONE next Twitch chat MESSAGE ONLY (no username), as a single line. "
          "Do not include @mentions or URLs. End with <|eom|>.\n"
    )

    inputs = tokenizer(prompt2, return_tensors="pt").to(model.device)

    eom_id = get_eom_id(tokenizer)
    if STOP_AT_EOM and EOM_TOKEN and eom_id is None:
        raise RuntimeError(f"EOM token {EOM_TOKEN} not in tokenizer vocab.")

    out_ids = model.generate(
        **inputs,
        max_new_tokens=MAX_NEW_TOKENS,
        do_sample=True,
        temperature=TEMPERATURE,
        top_p=TOP_P,
        repetition_penalty=REPETITION_PENALTY,
        pad_token_id=tokenizer.eos_token_id,
        eos_token_id=eom_id if (STOP_AT_EOM and eom_id is not None) else None,
        use_cache=False,
    )

    decoded = tokenizer.decode(out_ids[0], skip_special_tokens=False)

    if "NEXT:" in decoded:
        decoded = decoded.split("NEXT:", 1)[-1]

    if decoded.startswith(prompt2):
        decoded = decoded[len(prompt2):]

    if EOM_TOKEN and EOM_TOKEN in decoded:
        decoded = decoded.split(EOM_TOKEN, 1)[0]

    return clamp_one_line(decoded)


def build_long_message_sets(messages: List[ChatMessage]) -> Tuple[Set[str], Set[str]]:
    """
    Build raw+masked exact-match sets for LONG messages only.
    This avoids fighting emote spam, but blocks verbatim longer lines.
    """
    raw: Set[str] = set()
    masked: Set[str] = set()
    for m in messages:
        msg = clamp_one_line(m.message)
        if len(msg) < LONG_LEN:
            continue
        n_raw = normalize_for_match(msg)
        if n_raw:
            raw.add(n_raw)
        n_masked = normalize_for_match(clamp_one_line(mask_identifiers(msg)))
        if n_masked:
            masked.add(n_masked)
    return raw, masked


def make_synth_username_pool(n: int) -> List[str]:
    return [f"{SYNTH_USER_PREFIX}{i:0{SYNTH_USER_PAD}d}" for i in range(1, n + 1)]


def make_seed_context(seed_bin: List[str], synth_pool: List[str]) -> List[str]:
    """
    Convert real seed lines -> synthetic usernames, masked identifiers.
    """
    user_map: Dict[str, str] = {}
    out: List[str] = []

    for line in seed_bin[:SEED_LINES]:
        line = clamp_one_line(line)
        u, m = extract_message_from_line(line)
        if not u or not m:
            continue

        if u not in user_map:
            user_map[u] = random.choice(synth_pool)
        su = user_map[u]

        msg = clamp_one_line(m)
        if MASK_IDENTIFIERS_IN_CONTEXT:
            msg = clamp_one_line(mask_identifiers(msg))

        out.append(f"{su}: {msg}")

    if len(out) > CONTEXT_LINES:
        out = out[-CONTEXT_LINES:]
    return out

def main() -> None:
    if not INPUT_JSONL.exists():
        raise FileNotFoundError(f"Missing input: {INPUT_JSONL}")

    OUTPUT_JSONL.parent.mkdir(parents=True, exist_ok=True)

    messages = list(iter_messages(INPUT_JSONL))
    if not messages:
        raise SystemExit("Parsed 0 messages from all_chat.jsonl")
    messages.sort(key=lambda x: x.timestamp)

    bins = build_bins(messages, BIN_SIZE)
    if not bins:
        raise SystemExit(f"Not enough messages for BIN_SIZE={BIN_SIZE}")

    # Build long-message blocklists
    long_raw_set: Set[str] = set()
    long_masked_set: Set[str] = set()
    if BLOCK_LONG_EXACT_MATCHES:
        long_raw_set, long_masked_set = build_long_message_sets(messages)
        print(f"[INFO] long exact-match raw blocklist:    {len(long_raw_set):,} (len>={LONG_LEN})")
        print(f"[INFO] long exact-match masked blocklist: {len(long_masked_set):,} (len>={LONG_LEN})")

    synth_pool = make_synth_username_pool(SYNTH_USER_COUNT)

    model, tokenizer = load_model_and_tokenizer()

    # Open output
    line_id = 1
    with OUTPUT_JSONL.open("w", encoding="utf-8") as f:
        # Initialize first episode seed
        seed_bin = random.choice(bins)
        context = make_seed_context(seed_bin, synth_pool)
        if not context:
            raise SystemExit("Seed context became empty after sanitization.")

        # Write initial seed lines
        for s in context[-SEED_LINES:]:
            f.write(json.dumps({"id": line_id, "type": "seed", "text": s}, ensure_ascii=False) + "\n")
            line_id += 1

        remaining = max(0, NUM_LINES - (line_id - 1))
        print(f"[INFO] wrote initial seed={(line_id - 1)} | generating={remaining} -> {OUTPUT_JSONL}")

        gen_count = 0
        for _ in trange(remaining, desc="Generating", unit="line"):
            # Reseed every EPISODE_GEN generated lines
            if gen_count > 0 and (gen_count % EPISODE_GEN == 0):
                seed_bin = random.choice(bins)
                context = make_seed_context(seed_bin, synth_pool)
                # Write episode boundary as a seed block (keeps output readable)
                for s in context[-SEED_LINES:]:
                    f.write(json.dumps({"id": line_id, "type": "seed", "text": s}, ensure_ascii=False) + "\n")
                    line_id += 1
                # Update remaining loop accounting by continuing (we already wrote extra lines)
                # If we exceed NUM_LINES slightly due to reseed blocks, that's fine for debugging,
                # but keep it strict: stop if we hit NUM_LINES.
                if line_id > NUM_LINES:
                    break

            prompt = (
                "You are generating Twitch chat.\n"
                "Do NOT copy any longer messages verbatim from the dataset.\n"
                "Avoid @mentions and URLs.\n\n"
                "CHAT SO FAR:\n"
                + "\n".join(context).strip()
                + "\n\nNEXT:"
            )

            su = random.choice(synth_pool)

            gen_line = ""
            for _try in range(MAX_TRIES_PER_LINE):
                cand_raw = generate_one_message(model, tokenizer, prompt)
                cand_raw = clamp_one_line(cand_raw)

                if not looks_like_message(cand_raw):
                    continue

                # Mask identifiers in output if requested
                cand = cand_raw
                if MASK_IDENTIFIERS_IN_OUTPUT:
                    cand = clamp_one_line(mask_identifiers(cand))

                # Long-message exact blocking (raw + masked)
                if BLOCK_LONG_EXACT_MATCHES and len(cand) >= LONG_LEN:
                    if normalize_for_match(cand_raw) in long_raw_set:
                        continue
                    if normalize_for_match(cand) in long_masked_set:
                        continue

                gen_line = f"{su}: {cand}"
                break

            if not gen_line:
                # fallback that won't create "lol spam"
                safe_fallbacks = ["LUL", "no shot", "damn", "yo", "ok", "true", "what", "bruh"]
                gen_line = f"{random.choice(synth_pool)}: {random.choice(safe_fallbacks)}"

            f.write(json.dumps({"id": line_id, "type": "gen", "text": gen_line}, ensure_ascii=False) + "\n")
            line_id += 1
            gen_count += 1

            context.append(gen_line)
            if len(context) > CONTEXT_LINES:
                context = context[-CONTEXT_LINES:]

            if FLUSH_EVERY > 0 and (line_id % FLUSH_EVERY == 0):
                f.flush()
                try:
                    os.fsync(f.fileno())
                except Exception:
                    pass

    print(f"[DONE] wrote up to id={line_id - 1} -> {OUTPUT_JSONL}")


if __name__ == "__main__":
    main()