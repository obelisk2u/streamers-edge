from __future__ import annotations

import json
import sys
from pathlib import Path

import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer

try:
    from tqdm import tqdm
except ImportError:  # pragma: no cover - optional dependency
    tqdm = None

MODEL_NAME = "cardiffnlp/twitter-roberta-base-sentiment"
LABELS = ["negative", "neutral", "positive"]


def iter_moderator_messages(root: Path):
    for path in sorted(root.rglob("chat.jsonl")):
        with path.open("r", encoding="utf-8") as handle:
            for line in handle:
                line = line.strip()
                if not line:
                    continue
                try:
                    payload = json.loads(line)
                except json.JSONDecodeError:
                    continue
                tags = payload.get("tags") or {}
                if str(tags.get("mod", "0")) != "1":
                    continue
                badges = str(tags.get("badges", ""))
                if "bot/1" in badges:
                    continue
                username = payload.get("user", "")
                if username in {"streamelements", "nightbot", "voll"}:
                    continue
                message = payload.get("message", "")
                if not message:
                    continue
                yield {
                    "username": username,
                    "message": message,
                    "timestamp_utc": payload.get("timestamp_utc"),
                }


def run_sentiment(records: list[dict], batch_size: int = 32) -> list[dict]:
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)
    model.eval()

    results: list[dict] = []
    total_batches = (len(records) + batch_size - 1) // batch_size
    if tqdm is None:
        print(f"Scoring {len(records)} messages in {total_batches} batches...")
    for start in tqdm(
        range(0, len(records), batch_size),
        desc="Scoring batches",
        disable=tqdm is None,
    ):
        batch = records[start : start + batch_size]
        texts = [record.get("message", "") for record in batch]
        encoded = tokenizer(
            texts,
            return_tensors="pt",
            truncation=True,
            max_length=512,
            padding=True,
        ).to(device)

        with torch.no_grad():
            logits = model(**encoded).logits
            scores = torch.softmax(logits, dim=-1)

        for record, score_vec in zip(batch, scores):
            top_index = int(torch.argmax(score_vec).item())
            if LABELS[top_index] == "neutral":
                continue
            results.append(
                {
                    "username": record.get("username", ""),
                    "message": record.get("message", ""),
                    "timestamp_utc": record.get("timestamp_utc"),
                    "label": LABELS[top_index],
                    "score": float(score_vec[top_index].item()),
                }
            )

    return results


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    raw_root = root / "data" / "raw"
    output_path = root / "data" / "processed" / "moderator_sentiment.json"

    print("Loading moderator messages...")
    records = list(iter_moderator_messages(raw_root))
    print(f"Found {len(records)} moderator messages")
    results = run_sentiment(records)

    by_user: dict[str, dict[str, list[dict]]] = {}
    for record in results:
        username = record.get("username", "")
        label = record.get("label", "")
        if not username or label not in {"positive", "negative"}:
            continue
        entry = by_user.setdefault(username, {"positive": [], "negative": []})
        entry[label].append(record)

    output = []
    for username in sorted(by_user):
        buckets = by_user[username]
        positive = sorted(
            buckets["positive"], key=lambda item: item.get("score", 0), reverse=True
        )[:5]
        negative = sorted(
            buckets["negative"], key=lambda item: item.get("score", 0), reverse=True
        )[:5]
        output.append({"username": username, "positive": positive, "negative": negative})

    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(output, handle, ensure_ascii=True, indent=2)

    print(f"Wrote {len(output)} users to {output_path}")


if __name__ == "__main__":
    main()
