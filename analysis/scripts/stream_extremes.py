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
MIN_WORDS = 20


def iter_stream_dirs(root: Path):
    for meta_path in sorted(root.rglob("meta.json")):
        stream_dir = meta_path.parent
        chat_path = stream_dir / "chat.jsonl"
        if chat_path.exists():
            yield stream_dir, meta_path, chat_path


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    raw_root = root / "data" / "raw"
    output_path = root / "data" / "processed" / "stream_extreme_sentiment.json"

    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)
    model.eval()

    stream_dirs = list(iter_stream_dirs(raw_root))
    if tqdm is None:
        print(f"Processing {len(stream_dirs)} streams...")

    results = []
    for stream_dir, meta_path, chat_path in tqdm(
        stream_dirs,
        desc="Streams",
        disable=tqdm is None,
    ):
        meta = json.loads(meta_path.read_text(encoding="utf-8"))
        best_positive = None
        best_negative = None

        batch_records: list[dict] = []
        total_filtered = 0
        with chat_path.open("r", encoding="utf-8") as handle:
            for line in handle:
                line = line.strip()
                if not line:
                    continue
                try:
                    payload = json.loads(line)
                except json.JSONDecodeError:
                    continue
                message = payload.get("message", "")
                if len(message.split()) <= MIN_WORDS:
                    continue
                total_filtered += 1
                batch_records.append(
                    {
                        "username": payload.get("user", ""),
                        "message": message,
                        "timestamp_utc": payload.get("timestamp_utc"),
                    }
                )

                if len(batch_records) >= 32:
                    texts = [record["message"] for record in batch_records]
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
                    for record, score_vec in zip(batch_records, scores):
                        top_index = int(torch.argmax(score_vec).item())
                        label = LABELS[top_index]
                        score = float(score_vec[top_index].item())
                        item = {**record, "label": label, "score": score}
                        if label == "positive":
                            if not best_positive or score > best_positive["score"]:
                                best_positive = item
                        if label == "negative":
                            if not best_negative or score > best_negative["score"]:
                                best_negative = item
                    batch_records.clear()

        if tqdm is None:
            print(
                f"{stream_dir.name}: scored {total_filtered} messages over {MIN_WORDS} words",
                file=sys.stderr,
            )

        if batch_records:
            texts = [record["message"] for record in batch_records]
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
            for record, score_vec in zip(batch_records, scores):
                top_index = int(torch.argmax(score_vec).item())
                label = LABELS[top_index]
                score = float(score_vec[top_index].item())
                item = {**record, "label": label, "score": score}
                if label == "positive":
                    if not best_positive or score > best_positive["score"]:
                        best_positive = item
                if label == "negative":
                    if not best_negative or score > best_negative["score"]:
                        best_negative = item

        results.append(
            {
                "stream": stream_dir.name,
                "started_at": meta.get("started_at"),
                "ended_at": meta.get("ended_at"),
                "most_positive": best_positive,
                "most_negative": best_negative,
            }
        )

    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(results, handle, ensure_ascii=True, indent=2)

    print(f"Wrote {len(results)} streams to {output_path}")


if __name__ == "__main__":
    main()
