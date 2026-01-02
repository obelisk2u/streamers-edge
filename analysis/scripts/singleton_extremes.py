from __future__ import annotations

import json
from pathlib import Path

import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer


MODEL_NAME = "cardiffnlp/twitter-roberta-base-sentiment"
LABELS = ["negative", "neutral", "positive"]
MIN_WORDS = 20


def load_records(path: Path) -> list[dict]:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    input_path = root / "data" / "processed" / "combined_chat.json"
    output_path = root / "data" / "processed" / "singleton_extremes.json"

    records = load_records(input_path)
    counts: dict[str, int] = {}
    for record in records:
        username = record.get("username", "")
        if not username:
            continue
        counts[username] = counts.get(username, 0) + 1

    singles = [
        record
        for record in records
        if counts.get(record.get("username", ""), 0) == 1
        and len(record.get("message", "").split()) > MIN_WORDS
    ]

    if not singles:
        print("No qualifying singleton messages found.")
        return

    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)
    model.eval()

    best_positive: list[dict] = []
    best_negative: list[dict] = []

    for start in range(0, len(singles), 32):
        batch = singles[start : start + 32]
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
            label = LABELS[top_index]
            score = float(score_vec[top_index].item())
            item = {
                "username": record.get("username", ""),
                "message": record.get("message", ""),
                "label": label,
                "score": score,
            }
            if label == "positive":
                best_positive.append(item)
            if label == "negative":
                best_negative.append(item)

    best_positive = sorted(
        best_positive, key=lambda entry: entry["score"], reverse=True
    )[:5]
    best_negative = sorted(
        best_negative, key=lambda entry: entry["score"], reverse=True
    )[:5]
    output = {"most_positive": best_positive, "most_negative": best_negative}
    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(output, handle, ensure_ascii=True, indent=2)

    print(f"Wrote singleton extremes to {output_path}")


if __name__ == "__main__":
    main()
