from __future__ import annotations

import json
from pathlib import Path


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    input_path = root / "data" / "processed" / "long_messages_sentiment.json"
    output_path = root / "data" / "processed" / "sentiment_counts.json"

    with input_path.open("r", encoding="utf-8") as handle:
        records = json.load(handle)

    counts = {"negative": 0, "neutral": 0, "positive": 0}
    for record in records:
        label = record.get("label", "")
        if label in counts:
            counts[label] += 1

    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(counts, handle, ensure_ascii=True, indent=2)

    print(f"Wrote counts to {output_path}")


if __name__ == "__main__":
    main()
