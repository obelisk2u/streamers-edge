from __future__ import annotations

import json
from pathlib import Path


def load_records(path: Path) -> list[dict]:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    input_path = root / "data" / "processed" / "long_messages_sentiment.json"
    output_path = root / "data" / "processed" / "single_message_extremes.json"

    records = load_records(input_path)
    counts: dict[str, int] = {}
    for record in records:
        username = record.get("username", "")
        if not username:
            continue
        counts[username] = counts.get(username, 0) + 1

    best_positive: list[dict] = []
    best_negative: list[dict] = []

    for record in records:
        username = record.get("username", "")
        if counts.get(username, 0) != 1:
            continue
        label = record.get("label", "")
        score = float(record.get("score", 0.0))
        if label == "positive":
            best_positive.append(record)
        if label == "negative":
            best_negative.append(record)

    best_positive = sorted(
        best_positive, key=lambda item: float(item.get("score", 0.0)), reverse=True
    )[:10]
    best_negative = sorted(
        best_negative, key=lambda item: float(item.get("score", 0.0)), reverse=True
    )[:10]
    output = {"most_positive": best_positive, "most_negative": best_negative}
    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(output, handle, ensure_ascii=True, indent=2)

    print(f"Wrote singleton extremes to {output_path}")


if __name__ == "__main__":
    main()
