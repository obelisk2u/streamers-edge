'''
python3 analysis/scripts_trans/generate_chat_examples.py \
  --input_jsonl all_chat.jsonl \
  --model_dir outputs/phi3-chat-lora \
  --output_jsonl analysis/data/processed/generated_chat_examples.jsonl \
  --num_samples 20000

'''
from __future__ import annotations

import argparse
import json
import random
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Iterable

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

try:
    from peft import PeftModel
except ImportError:  # pragma: no cover
    PeftModel = None


@dataclass
class ChatMessage:
    username: str
    message: str
    timestamp: datetime


def parse_timestamp(value: str) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def iter_messages(path: Path) -> Iterable[ChatMessage]:
    with path.open("r", encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, start=1):
            line = line.strip()
            if not line:
                continue
            try:
                payload = json.loads(line)
            except json.JSONDecodeError:
                print(f"Skipping invalid JSON on line {line_number}")
                continue

            username = str(payload.get("username", "")).strip()
            message = str(payload.get("message", "")).strip()
            timestamp_raw = str(payload.get("timestamp_utc", "")).strip()
            timestamp = parse_timestamp(timestamp_raw)

            if not username or not message or timestamp is None:
                continue
            yield ChatMessage(username=username, message=message, timestamp=timestamp)


def build_bins(messages: list[ChatMessage], bin_size: int) -> list[str]:
    bins = []
    total = len(messages) - (len(messages) % bin_size)
    for i in range(0, total, bin_size):
        chunk = messages[i : i + bin_size]
        lines = [f"{msg.username}: {msg.message}" for msg in chunk]
        bins.append("\n".join(lines))
    return bins


def sample_prompts(bins: list[str], count: int, lines: int) -> list[str]:
    prompts = []
    for _ in range(count):
        text = random.choice(bins)
        prompt_lines = text.splitlines()[:lines]
        prompts.append("\n".join(prompt_lines))
    return prompts


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate chat examples with a fine-tuned model.")
    parser.add_argument("--input_jsonl", type=Path, required=True)
    parser.add_argument("--output_jsonl", type=Path, required=True)
    parser.add_argument("--model_dir", type=Path, required=True)
    parser.add_argument("--adapter_dir", type=Path, default=None)
    parser.add_argument("--num_samples", type=int, default=20000)
    parser.add_argument("--prompt_lines", type=int, default=4)
    parser.add_argument("--bin_size", type=int, default=20)
    parser.add_argument("--max_new_tokens", type=int, default=256)
    parser.add_argument("--temperature", type=float, default=0.8)
    parser.add_argument("--top_p", type=float, default=0.9)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    if not args.input_jsonl.exists():
        raise FileNotFoundError(f"Missing input file: {args.input_jsonl}")
    if not args.model_dir.exists():
        raise FileNotFoundError(f"Missing model dir: {args.model_dir}")

    random.seed(args.seed)
    torch.manual_seed(args.seed)

    messages = list(iter_messages(args.input_jsonl))
    messages.sort(key=lambda m: m.timestamp)
    bins = build_bins(messages, args.bin_size)
    if not bins:
        raise SystemExit("No bins built from input data.")

    tokenizer = AutoTokenizer.from_pretrained(args.model_dir)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    tokenizer.padding_side = "left"

    model = AutoModelForCausalLM.from_pretrained(
        args.model_dir,
        device_map="auto",
        torch_dtype=torch.bfloat16 if torch.cuda.is_available() and torch.cuda.is_bf16_supported() else torch.float16,
        trust_remote_code=True,
    )
    if args.adapter_dir:
        if PeftModel is None:
            raise SystemExit("peft not installed but --adapter_dir was provided.")
        model = PeftModel.from_pretrained(model, args.adapter_dir)

    model.eval()

    prompts = sample_prompts(bins, args.num_samples, args.prompt_lines)
    args.output_jsonl.parent.mkdir(parents=True, exist_ok=True)

    with args.output_jsonl.open("w", encoding="utf-8") as handle:
        for idx, prompt in enumerate(prompts, start=1):
            inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
            with torch.no_grad():
                outputs = model.generate(
                    **inputs,
                    max_new_tokens=args.max_new_tokens,
                    do_sample=True,
                    temperature=args.temperature,
                    top_p=args.top_p,
                    pad_token_id=tokenizer.eos_token_id,
                )
            decoded = tokenizer.decode(outputs[0], skip_special_tokens=True)
            handle.write(json.dumps({"id": idx, "text": decoded}) + "\n")

    print(f"Wrote {args.num_samples} samples to {args.output_jsonl}")


if __name__ == "__main__":
    main()
