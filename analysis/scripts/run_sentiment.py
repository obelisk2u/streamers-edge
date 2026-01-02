from __future__ import annotations

import json
from pathlib import Path

import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer


MODEL_NAME = "cardiffnlp/twitter-roberta-base-sentiment"
LABELS = ["negative", "neutral", "positive"]


def load_messages(path: Path) -> list[dict]:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def run_sentiment(records: list[dict], batch_size: int = 32) -> list[dict]:
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)
    if torch.cuda.is_available():
        device = torch.device("cuda")
    elif torch.backends.mps.is_available():
        device = torch.device("mps")
    else:
        device = torch.device("cpu")
    model.to(device)
    model.eval()

    results: list[dict] = []
    for start in range(0, len(records), batch_size):
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
            results.append(
                {
                    "username": record.get("username", ""),
                    "message": record.get("message", ""),
                    "label": LABELS[top_index],
                    "score": float(score_vec[top_index].item()),
                }
            )

    return results


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    input_path = root / "data" / "processed" / "combined_chat_5.json"
    output_path = root / "data" / "processed" / "combined_chat_5_sentiment.json"

    records = load_messages(input_path)
    results = run_sentiment(records)

    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(results, handle, ensure_ascii=True, indent=2)

    print(f"Wrote {len(results)} records to {output_path}")


if __name__ == "__main__":
    main()
