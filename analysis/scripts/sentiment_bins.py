from __future__ import annotations

import json
from pathlib import Path

import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer

from data30_utils import iter_data30_messages, parse_timestamp

try:
    from tqdm import tqdm
except ImportError:  # pragma: no cover - optional dependency
    tqdm = None


MODEL_NAME = "cardiffnlp/twitter-roberta-base-sentiment"
LABELS = ["negative", "neutral", "positive"]
BIN_COUNT = 20


def sentiment_values(model, tokenizer, texts: list[str], device) -> list[float]:
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

    values: list[float] = []
    for score_vec in scores:
        top_index = int(torch.argmax(score_vec).item())
        label = LABELS[top_index]
        score = float(score_vec[top_index].item())
        if label == "positive":
            values.append(score)
        elif label == "negative":
            values.append(-score)
        else:
            values.append(0.0)
    return values


def bin_labels() -> list[str]:
    labels = []
    for i in range(BIN_COUNT):
        start = i * 5
        end = start + 5
        labels.append(f"{start}-{end}%")
    return labels


def iter_with_progress(iterable, label: str):
    if tqdm is None:
        print(f"{label}...")
        return iterable
    return tqdm(iterable, desc=label)


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    output_path = root / "data" / "processed" / "sentiment_bins_5pct.json"

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

    print("Scanning stream bounds...")
    bounds: dict[str, dict[str, datetime]] = {}
    for record in iter_with_progress(iter_data30_messages(), "Collecting bounds"):
        stream_id = record.get("stream_id", "")
        timestamp = record.get("timestamp")
        if not stream_id or not timestamp:
            continue
        ts = parse_timestamp(timestamp)
        entry = bounds.setdefault(stream_id, {"min": ts, "max": ts})
        if ts < entry["min"]:
            entry["min"] = ts
        if ts > entry["max"]:
            entry["max"] = ts

    stream_count = len(bounds)
    print(f"Found {stream_count} streams")

    global_sums = [0.0] * BIN_COUNT
    global_counts = [0] * BIN_COUNT

    batch_texts: list[str] = []
    batch_bins: list[int] = []
    for record in iter_with_progress(iter_data30_messages(), "Scoring messages"):
        stream_id = record.get("stream_id", "")
        timestamp = record.get("timestamp")
        message = record.get("message", "")
        if not stream_id or not timestamp or not message:
            continue
        bound = bounds.get(stream_id)
        if not bound:
            continue
        duration = (bound["max"] - bound["min"]).total_seconds()
        if duration <= 0:
            continue
        ts = parse_timestamp(timestamp)
        position = (ts - bound["min"]).total_seconds() / duration
        if position < 0 or position > 1:
            continue
        bin_index = min(int(position * BIN_COUNT), BIN_COUNT - 1)
        batch_texts.append(message)
        batch_bins.append(bin_index)

        if len(batch_texts) >= 32:
            values = sentiment_values(model, tokenizer, batch_texts, device)
            for bin_idx, value in zip(batch_bins, values):
                global_sums[bin_idx] += value
                global_counts[bin_idx] += 1
            batch_texts.clear()
            batch_bins.clear()

    if batch_texts:
        values = sentiment_values(model, tokenizer, batch_texts, device)
        for bin_idx, value in zip(batch_bins, values):
            global_sums[bin_idx] += value
            global_counts[bin_idx] += 1

    labels = bin_labels()
    bins = []
    for i in range(BIN_COUNT):
        avg = (global_sums[i] / global_counts[i]) if global_counts[i] else 0.0
        bins.append(
            {
                "label": labels[i],
                "avg_sentiment": round(avg, 4),
                "count": global_counts[i],
            }
        )

    results = {
        "stream_count": stream_count,
        "bins": bins,
    }

    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(results, handle, ensure_ascii=True, indent=2)

    print(f"Wrote aggregate bins to {output_path}")


if __name__ == "__main__":
    main()
