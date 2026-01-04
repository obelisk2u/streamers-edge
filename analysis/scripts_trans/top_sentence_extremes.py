from __future__ import annotations

import json
from pathlib import Path


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    input_path = root / "data" / "processed" / "transcript_sentence_sentiment.json"
    output_path = root / "data" / "processed" / "transcript_sentence_extremes.json"

    with input_path.open("r", encoding="utf-8") as handle:
        sentences = json.load(handle)

    positives = [item for item in sentences if item.get("label") == "positive"]
    negatives = [item for item in sentences if item.get("label") == "negative"]

    top_positive = sorted(positives, key=lambda item: item.get("score", 0.0), reverse=True)[:5]
    top_negative = sorted(negatives, key=lambda item: item.get("score", 0.0), reverse=True)[:5]

    output = {"positive": top_positive, "negative": top_negative}

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(output, handle, indent=2)

    print(f"Wrote extremes to {output_path}")


if __name__ == "__main__":
    main()
