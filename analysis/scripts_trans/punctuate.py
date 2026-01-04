#!/usr/bin/env python3
"""
Option A pipeline (best quality, timestamp-safe):

1) For each VOD transcript:
   - concatenate all segment texts into one big string
2) Run punctuation restoration on the big string
   - chunked to max_length (default 512) with overlap (default 64)
   - predictions are merged back into a single token-label sequence
3) Sentence-split the punctuated text
4) Map each sentence back to time by matching sentence words (normalized)
   against the original Whisper words (which preserve order).
   - sentence start/end time is taken from the first/last matched word's segment
   - sentence stores segment_indices it spans

Input format (list):
[
  { "vod_id": "...", "transcript": { "segments": [ {"start":..,"end":..,"text":..}, ... ] } },
  ...
]

Output:
- writes a new JSON file
- adds to each transcript:
    transcript["text_punctuated"]  (full punctuated transcript text)
    transcript["sentences"]        (list of sentence objects with start/end + segment_indices)
"""

from __future__ import annotations

import argparse
import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import torch
from tqdm import tqdm
from transformers import AutoModelForTokenClassification, AutoTokenizer


# ----------------------------
# Utilities
# ----------------------------

def load_segments(transcript: dict) -> list[dict]:
    return transcript.get("segments", [])


def label_to_punct(label: str) -> str | None:
    key = (label or "").lower()
    if "comma" in key:
        return ","
    if "period" in key or "dot" in key:
        return "."
    if "question" in key:
        return "?"
    if "exclamation" in key:
        return "!"
    if "colon" in key:
        return ":"
    if "semicolon" in key:
        return ";"
    if "ellipsis" in key:
        return "..."
    if key in {"o", "none", "no_punct"}:
        return None
    return None


def _clean_spaces(text: str) -> str:
    text = re.sub(r"\s+(\.\.\.)", r"\1", text)
    text = re.sub(r"\s+([,.;:!?])", r"\1", text)
    text = re.sub(r"\s{2,}", " ", text)
    return text.strip()


def _is_new_word(token: str) -> bool:
    """
    Heuristic across common subword schemes:
    - SentencePiece: ▁word
    - RoBERTa/GPT-2 BPE: Ġword
    - WordPiece: ##suffix means continuation (NOT new word)
    """
    if token.startswith("▁") or token.startswith("Ġ"):
        return True
    if token.startswith("##"):
        return False
    return True


def sentence_split(text: str) -> List[str]:
    """
    Sentence split that works reasonably for casual speech punctuation.
    Splits on [.?!] followed by whitespace or end-of-string.
    Keeps punctuation on the sentence.
    """
    s = text.strip()
    if not s:
        return []

    out: List[str] = []
    start = 0
    for i, ch in enumerate(s):
        if ch in ".?!" and (i == len(s) - 1 or s[i + 1].isspace()):
            sent = s[start : i + 1].strip()
            if sent:
                out.append(sent)
            start = i + 1
    tail = s[start:].strip()
    if tail:
        out.append(tail)
    return out


_word_norm_re = re.compile(r"[^a-z0-9']+", re.IGNORECASE)

def normalize_word(w: str) -> str:
    w = w.lower()
    w = _word_norm_re.sub("", w)
    return w.strip()


def extract_words_for_matching(text: str) -> List[str]:
    # Split on whitespace and normalize (strip punctuation).
    raw = text.split()
    return [nw for nw in (normalize_word(x) for x in raw) if nw]


@dataclass
class WordRef:
    word: str            # normalized word
    seg_index: int       # which original segment
    seg_start: float     # segment start time
    seg_end: float       # segment end time


def build_word_refs(segments: List[dict]) -> List[WordRef]:
    """
    Build a word-level sequence from Whisper segments.
    We don't have word timestamps, so we attach each word to its segment.
    """
    refs: List[WordRef] = []
    for si, seg in enumerate(segments):
        txt = (seg.get("text") or "").strip()
        if not txt:
            continue
        words = extract_words_for_matching(txt)
        for w in words:
            refs.append(
                WordRef(
                    word=w,
                    seg_index=si,
                    seg_start=float(seg.get("start", 0.0)),
                    seg_end=float(seg.get("end", 0.0)),
                )
            )
    return refs


def find_sentence_span(
    sentence_words: List[str],
    refs: List[WordRef],
    start_hint: int,
    max_lookahead: int = 4000,
) -> Tuple[int, int]:
    """
    Find a contiguous span of refs that matches sentence_words.
    We assume punctuation restoration does not change word order.

    Returns (start_idx, end_idx) inclusive indices into refs.
    If no good match, falls back to a best-effort span of the same length
    starting at start_hint (clamped).
    """
    if not sentence_words:
        return start_hint, max(start_hint, start_hint)

    # Clamp hint.
    start_hint = max(0, min(start_hint, len(refs)))

    # Search forward for a place where the sequence matches.
    # We limit lookahead to keep runtime reasonable.
    search_end = min(len(refs), start_hint + max_lookahead)

    first = sentence_words[0]
    n = len(sentence_words)

    for i in range(start_hint, search_end):
        if refs[i].word != first:
            continue
        # check contiguous match
        j = 0
        while j < n and (i + j) < len(refs) and refs[i + j].word == sentence_words[j]:
            j += 1
        if j == n:
            return i, i + n - 1

    # Fallback: take next n words as best effort
    i = start_hint
    j = min(len(refs) - 1, i + n - 1)
    if len(refs) == 0:
        return 0, 0
    return min(i, len(refs) - 1), max(min(j, len(refs) - 1), min(i, len(refs) - 1))


# ----------------------------
# Punctuation over long text (chunked + overlap)
# ----------------------------

def predict_labels_over_long_text(
    text: str,
    tokenizer,
    model,
    device: torch.device,
    max_length: int = 512,
    overlap: int = 64,
) -> Tuple[List[str], List[Optional[str]]]:
    """
    Tokenize full text (no specials), then run token classification in windows.
    Merge predictions into a single label per token position.
    Returns (tokens, punct_labels_per_token_position).

    punct_labels_per_token_position holds the raw label string (e.g. "COMMA")
    or None if no punctuation predicted.
    """
    if not text.strip():
        return [], []

    # Full tokenization without special tokens (can be long).
    enc_full = tokenizer(
        text,
        add_special_tokens=False,
        return_attention_mask=False,
        return_tensors=None,
    )
    full_ids: List[int] = enc_full["input_ids"]
    full_tokens: List[str] = tokenizer.convert_ids_to_tokens(full_ids)

    labels: List[Optional[str]] = [None] * len(full_ids)
    filled: List[bool] = [False] * len(full_ids)

    # Window size budget: we will add special tokens for the model input.
    # Many tokenizers add 2 specials; to be safe, keep slice <= max_length-2.
    slice_len = max(8, max_length - 2)
    stride = max(1, slice_len - overlap)

    special_tokens = set(tokenizer.all_special_tokens)

    for start in range(0, len(full_ids), stride):
        end = min(len(full_ids), start + slice_len)
        window_ids = full_ids[start:end]

        # Build input with special tokens
        input_ids = tokenizer.build_inputs_with_special_tokens(window_ids)
        attention_mask = [1] * len(input_ids)

        input_ids_t = torch.tensor([input_ids], device=device)
        attn_t = torch.tensor([attention_mask], device=device)

        with torch.no_grad():
            logits = model(input_ids=input_ids_t, attention_mask=attn_t).logits
        pred_ids = logits.argmax(dim=-1)[0].tolist()

        # Convert to tokens to identify and skip specials
        win_tokens = tokenizer.convert_ids_to_tokens(input_ids)

        # Map predictions back to positions in [start:end)
        wpos = 0  # position within window_ids (not counting specials)
        for k, tok in enumerate(win_tokens):
            if tok in special_tokens:
                continue
            if wpos >= len(window_ids):
                break
            global_pos = start + wpos
            if 0 <= global_pos < len(labels) and not filled[global_pos]:
                lbl = model.config.id2label.get(pred_ids[k], "O")
                labels[global_pos] = lbl
                filled[global_pos] = True
            wpos += 1

        if end == len(full_ids):
            break

    return full_tokens, labels


def reconstruct_punctuated_text_from_tokens(
    tokenizer,
    tokens: List[str],
    labels: List[Optional[str]],
) -> str:
    """
    Convert token sequence + predicted punctuation labels into a punctuated string.
    We insert punctuation at word boundaries using a pending-punct flush strategy.
    """
    if not tokens:
        return ""

    output_tokens: List[str] = []
    pending: Optional[str] = None

    for tok, lbl in zip(tokens, labels):
        # Flush punctuation when a new word begins
        if pending and _is_new_word(tok):
            output_tokens.append(pending)
            pending = None

        output_tokens.append(tok)

        punct = label_to_punct(lbl or "O") if lbl else None
        if punct:
            pending = punct

    if pending:
        output_tokens.append(pending)

    text = tokenizer.convert_tokens_to_string(output_tokens)
    return _clean_spaces(text)


def punctuate_long_text(
    text: str,
    tokenizer,
    model,
    device: torch.device,
    max_length: int = 512,
    overlap: int = 64,
) -> str:
    tokens, labels = predict_labels_over_long_text(
        text=text,
        tokenizer=tokenizer,
        model=model,
        device=device,
        max_length=max_length,
        overlap=overlap,
    )
    return reconstruct_punctuated_text_from_tokens(tokenizer, tokens, labels)


# ----------------------------
# Main processing
# ----------------------------

def build_full_text_from_segments(segments: List[dict]) -> str:
    # Join with spaces; preserve word order exactly.
    parts = []
    for seg in segments:
        t = (seg.get("text") or "").strip()
        if t:
            parts.append(t)
    return " ".join(parts).strip()


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--input",
        type=Path,
        default=Path("data/processed/combined_transcripts.json"),
        help="Input combined transcripts JSON",
    )
    ap.add_argument(
        "--output",
        type=Path,
        default=Path("data/processed/combined_transcripts_sentences.json"),
        help="Output JSON with punctuated transcript + sentence layer",
    )
    ap.add_argument(
        "--model_id",
        type=str,
        default="kredor/punctuate-all",
        help="HuggingFace punctuation model id",
    )
    ap.add_argument(
        "--max_length",
        type=int,
        default=512,
        help="Max token length per chunk (includes specials budget internally)",
    )
    ap.add_argument(
        "--overlap",
        type=int,
        default=64,
        help="Token overlap between chunks",
    )
    ap.add_argument(
        "--device",
        type=str,
        default="auto",
        help="auto | cpu | cuda",
    )
    args = ap.parse_args()

    if args.device == "cuda":
        device = torch.device("cuda")
    elif args.device == "cpu":
        device = torch.device("cpu")
    else:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    with args.input.open("r", encoding="utf-8") as f:
        combined = json.load(f)

    tokenizer = AutoTokenizer.from_pretrained(args.model_id)
    tokenizer.model_max_length = 1_000_000
    tokenizer.init_kwargs["model_max_length"] = tokenizer.model_max_length
    model = AutoModelForTokenClassification.from_pretrained(args.model_id)
    model.to(device)
    model.eval()

    for entry in tqdm(combined, desc="Punctuate + sentence-map"):
        transcript = entry.get("transcript", {}) or {}
        segments = load_segments(transcript)
        if not segments:
            transcript["text_punctuated"] = ""
            transcript["sentences"] = []
            entry["transcript"] = transcript
            continue

        # 1) concatenate full text
        full_text = build_full_text_from_segments(segments)

        # 2) punctuate full text (chunked + overlap)
        full_punct = punctuate_long_text(
            full_text,
            tokenizer=tokenizer,
            model=model,
            device=device,
            max_length=args.max_length,
            overlap=args.overlap,
        )

        # 3) sentence split
        sents = sentence_split(full_punct)

        # 4) map sentence -> time via word matching against original segments
        refs = build_word_refs(segments)
        sentences_out: List[Dict] = []
        ref_ptr = 0

        for si, sent in enumerate(sents):
            sw = extract_words_for_matching(sent)
            if not sw:
                continue

            start_i, end_i = find_sentence_span(sw, refs, start_hint=ref_ptr)
            ref_ptr = max(ref_ptr, end_i + 1)

            if refs:
                start_time = refs[start_i].seg_start
                end_time = refs[end_i].seg_end
                seg_indices = sorted({r.seg_index for r in refs[start_i : end_i + 1]})
            else:
                start_time = 0.0
                end_time = 0.0
                seg_indices = []

            sentences_out.append(
                {
                    "start": float(start_time),
                    "end": float(end_time),
                    "text": sent,
                    "segment_indices": seg_indices,
                }
            )

        transcript["text_punctuated"] = full_punct
        transcript["sentences"] = sentences_out
        entry["transcript"] = transcript

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", encoding="utf-8") as f:
        json.dump(combined, f, indent=2, ensure_ascii=False)

    print(f"Wrote: {args.output}")


if __name__ == "__main__":
    main()
