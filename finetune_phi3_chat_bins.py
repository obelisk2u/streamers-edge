#!/usr/bin/env python3
'''
python finetune_phi3_chat_bins.py `
  --input_jsonl all_chat.jsonl `
  --output_dir outputs/phi3-chat-lora
'''
from __future__ import annotations

import argparse
import json
import os
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Iterable

import torch
from datasets import Dataset, load_from_disk
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    DataCollatorForLanguageModeling,
    TrainingArguments,
    Trainer,
)


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


def build_bins(messages: list[ChatMessage], bin_size: int, eos_token: str) -> list[dict]:
    bins = []
    for i in range(0, len(messages) - (len(messages) % bin_size), bin_size):
        chunk = messages[i : i + bin_size]
        lines = [f"{msg.username}: {msg.message}" for msg in chunk]
        text = "\n".join(lines) + eos_token
        bins.append({"text": text})
    return bins


def tokenize_dataset(dataset: Dataset, tokenizer, max_seq_len: int) -> Dataset:
    def _tokenize(batch):
        tokens = tokenizer(
            batch["text"],
            truncation=True,
            max_length=max_seq_len,
        )
        tokens["labels"] = tokens["input_ids"].copy()
        return tokens

    return dataset.map(_tokenize, batched=True, remove_columns=["text"])


def main() -> None:
    parser = argparse.ArgumentParser(description="Fine-tune Phi-3 on chat bins")
    parser.add_argument("--input_jsonl", type=Path, required=True)
    parser.add_argument("--output_dir", type=Path, required=True)
    parser.add_argument("--model_name", type=str, default="microsoft/Phi-3-mini-4k-instruct")
    parser.add_argument("--max_steps", type=int, default=0)
    parser.add_argument("--num_train_epochs", type=int, default=1)
    parser.add_argument("--per_device_train_batch_size", type=int, default=1)
    parser.add_argument("--gradient_accumulation_steps", type=int, default=8)
    parser.add_argument("--learning_rate", type=float, default=2e-4)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--max_seq_len", type=int, default=1024)
    parser.add_argument("--save_steps", type=int, default=500)
    parser.add_argument("--logging_steps", type=int, default=50)
    parser.add_argument("--bin_size", type=int, default=20)
    parser.add_argument("--dataset_cache_dir", type=Path, default=None)
    args = parser.parse_args()

    if not args.input_jsonl.exists():
        raise FileNotFoundError(f"Missing input file: {args.input_jsonl}")

    output_dir = args.output_dir
    output_dir.mkdir(parents=True, exist_ok=True)
    dataset_dir = output_dir / "dataset_arrow"

    tokenizer = AutoTokenizer.from_pretrained(args.model_name)
    if tokenizer.eos_token is None:
        tokenizer.eos_token = "</s>"
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    tokenizer.padding_side = "right"

    if dataset_dir.exists():
        dataset = load_from_disk(str(dataset_dir))
    else:
        messages = list(iter_messages(args.input_jsonl))
        messages.sort(key=lambda m: m.timestamp)
        bins = build_bins(messages, args.bin_size, tokenizer.eos_token)
        dataset = Dataset.from_list(bins)
        dataset.save_to_disk(str(dataset_dir))

    tokenized = tokenize_dataset(dataset, tokenizer, args.max_seq_len)
    tokenized.save_to_disk(str(dataset_dir))

    total_tokens = sum(len(ids) for ids in tokenized["input_ids"])

    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_use_double_quant=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.bfloat16 if torch.cuda.is_available() and torch.cuda.is_bf16_supported() else torch.float16,
    )

    model = AutoModelForCausalLM.from_pretrained(
        args.model_name,
        quantization_config=bnb_config,
        device_map="auto",
        trust_remote_code=True,
    )
    model = prepare_model_for_kbit_training(model)
    model.gradient_checkpointing_enable()

    lora_config = LoraConfig(
        r=16,
        lora_alpha=32,
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM",
        target_modules=["qkv_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    )
    model = get_peft_model(model, lora_config)

    use_bf16 = torch.cuda.is_available() and torch.cuda.is_bf16_supported()
    args_max_steps = args.max_steps if args.max_steps > 0 else -1

    training_args = TrainingArguments(
        output_dir=str(output_dir),
        per_device_train_batch_size=args.per_device_train_batch_size,
        gradient_accumulation_steps=args.gradient_accumulation_steps,
        learning_rate=args.learning_rate,
        max_steps=args_max_steps,
        num_train_epochs=None if args.max_steps > 0 else args.num_train_epochs,
        logging_steps=args.logging_steps,
        save_steps=args.save_steps,
        bf16=use_bf16,
        fp16=not use_bf16,
        optim="paged_adamw_8bit",
        report_to="none",
        seed=args.seed,
        dataloader_pin_memory=True,
        gradient_checkpointing=True,
    )

    data_collator = DataCollatorForLanguageModeling(tokenizer=tokenizer, mlm=False)

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized,
        data_collator=data_collator,
    )

    trainer.train()

    model.save_pretrained(str(output_dir))
    tokenizer.save_pretrained(str(output_dir))

    steps = trainer.state.global_step
    samples = len(tokenized)
    print("Throughput summary")
    print(f"  steps:   {steps}")
    print(f"  samples: {samples}")
    print(f"  tokens:  {total_tokens}")


if __name__ == "__main__":
    os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")
    main()
