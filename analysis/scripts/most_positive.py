from __future__ import annotations

import json
from pathlib import Path

from most_negative import load_records, sentiment_value


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    input_path = root / "data" / "processed" / "combined_chat_sentiment.json"
    output_path = root / "data" / "processed" / "most_positive_users.json"

    records = load_records(input_path)

    totals: dict[str, dict[str, float]] = {}
    messages_by_user: dict[str, list[str]] = {}
    for record in records:
        username = record.get("username", "")
        if not username:
            continue
        entry = totals.setdefault(username, {"count": 0, "sum": 0.0})
        entry["count"] += 1
        entry["sum"] += sentiment_value(record)
        messages_by_user.setdefault(username, []).append(record.get("message", ""))

    results = []
    for username, stats in totals.items():
        count = int(stats["count"])
        if count <= 5:
            continue
        avg = float(stats["sum"]) / count
        results.append({"username": username, "count": count, "avg_sentiment": avg})

    results.sort(key=lambda item: item["avg_sentiment"], reverse=True)
    results = results[:5]

    for item in results:
        item["messages"] = messages_by_user.get(item["username"], [])

    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(results, handle, ensure_ascii=True, indent=2)

    print(f"Wrote {len(results)} users to {output_path}")


if __name__ == "__main__":
    main()
