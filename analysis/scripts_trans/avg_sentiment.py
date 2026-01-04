from __future__ import annotations

import json
from pathlib import Path

import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer

try:
    from tqdm import tqdm
except ImportError:  # pragma: no cover
    tqdm = None


MODEL_NAME = "cardiffnlp/twitter-roberta-base-sentiment"
LABELS = ["negative", "neutral", "positive"]


def sentiment_value(label: str, score: float) -> float:
    if label == "positive":
        return score
    if label == "negative":
        return -score
    return 0.0


def iter_sentences(records: list[dict]) -> list[dict]:
    sentences: list[dict] = []
    for entry in records:
        transcript = entry.get("transcript", {}) or {}
        for sentence in transcript.get("sentences", []) or []:
            text = sentence.get("text", "")
            if not text:
                continue
            sentences.append(
                {
                    "vod_id": entry.get("vod_id", ""),
                    "start": sentence.get("start", 0.0),
                    "end": sentence.get("end", 0.0),
                    "text": text,
                }
            )
    return sentences


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    input_path = root / "data" / "processed" / "combined_transcripts_sentences.json"
    output_path = root / "data" / "processed" / "transcript_avg_sentiment.json"

    with input_path.open("r", encoding="utf-8") as handle:
        combined = json.load(handle)

    sentences = iter_sentences(combined)

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

    total = 0
    total_score = 0.0
    batch_size = 32

    scored_sentences: list[dict] = []
    for start in tqdm(
        range(0, len(sentences), batch_size),
        desc="Scoring sentences",
        disable=tqdm is None,
    ):
        batch = sentences[start : start + batch_size]
        texts = [item["text"] for item in batch]
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

        for item, score_vec in zip(batch, scores):
            top_index = int(torch.argmax(score_vec).item())
            label = LABELS[top_index]
            score = float(score_vec[top_index].item())
            total_score += sentiment_value(label, score)
            total += 1
            scored_sentences.append(
                {
                    "vod_id": item["vod_id"],
                    "start": item["start"],
                    "end": item["end"],
                    "text": item["text"],
                    "label": label,
                    "score": score,
                }
            )

    avg = total_score / total if total else 0.0
    output = {
        "avg_sentiment": avg,
        "total_sentences": total,
        "total_streams": len(combined),
    }

    positives = sorted(
        scored_sentences,
        key=lambda item: item["score"],
        reverse=True,
    )[:5]
    negatives = sorted(
        scored_sentences,
        key=lambda item: item["score"],
        reverse=False,
    )[:5]
    extremes_path = (
        root / "data" / "processed" / "transcript_sentence_extremes.json"
    )
    with extremes_path.open("w", encoding="utf-8") as handle:
        json.dump({"positive": positives, "negative": negatives}, handle, indent=2)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(output, handle, indent=2)

    sentences_path = (
        root / "data" / "processed" / "transcript_sentence_sentiment.json"
    )
    with sentences_path.open("w", encoding="utf-8") as handle:
        json.dump(scored_sentences, handle, indent=2)

    print(f"Wrote {output_path}")
    print(f"Wrote {sentences_path}")
    print(f"Wrote {extremes_path}")


if __name__ == "__main__":
    main()
