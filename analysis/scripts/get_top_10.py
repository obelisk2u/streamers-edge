from __future__ import annotations

import json
from pathlib import Path


def load_records(path: Path) -> list[dict]:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def top_n(records: list[dict], label: str, n: int = 10) -> list[dict]:
    filtered = [record for record in records if record.get("label") == label]
    filtered.sort(key=lambda item: float(item.get("score", 0.0)), reverse=True)
    return filtered[:n]


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    input_path = root / "data" / "processed" / "combined_chat_5_sentiment.json"
    output_path = root / "data" / "processed" / "top_10_sentiment.json"

    records = load_records(input_path)
    top_positive = top_n(records, "positive")
    top_negative = top_n(records, "negative")

    output = {
        "positive": top_positive,
        "negative": top_negative,
    }
    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(output, handle, ensure_ascii=True, indent=2)

    print(f"Wrote {len(top_positive) + len(top_negative)} rows to {output_path}")


if __name__ == "__main__":
    main()
