from __future__ import annotations

import json
from pathlib import Path

import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer

try:
    from tqdm import tqdm
except ImportError:  # pragma: no cover - optional dependency
    tqdm = None

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
            results.append(
                {
                    **record,
                    "label": LABELS[top_index],
                    "score": float(score_vec[top_index].item()),
                }
            )

    return results


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    input_path = root / "data" / "processed" / "long_messages.json"
    output_path = root / "data" / "processed" / "long_messages_sentiment.json"

    records = load_messages(input_path)
    results = run_sentiment(records)

    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(results, handle, ensure_ascii=True, indent=2)

    print(f"Wrote {len(results)} records to {output_path}")


if __name__ == "__main__":
    main()
