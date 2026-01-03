from __future__ import annotations

import json
from collections import Counter
from pathlib import Path


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    input_path = root / "data" / "data30" / "all_chat.jsonl"
    output_path = root / "data" / "processed" / "christmas_mentions.json"

    keywords = {
        "christmas": "christmas",
        "new years": "new years",
        "@supertf": "super",
        "blizzard": "blizzard",
    }
    counts: dict[str, Counter[str]] = {
        key: Counter() for key in keywords.values()
    }
    with input_path.open("r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            try:
                payload = json.loads(line)
            except json.JSONDecodeError:
                continue
            message = str(payload.get("m", ""))
            lower_message = message.lower()
            matched = [label for key, label in keywords.items() if key in lower_message]
            if not matched:
                continue
            timestamp = payload.get("ts")
            if not timestamp:
                continue
            date = timestamp.split("T")[0]
            for label in matched:
                counts[label][date] += 1

    dates = sorted(
        {date for counter in counts.values() for date in counter.keys()}
    )
    data = []
    for date in dates:
        data.append(
            {
                "date": date,
                "christmas": counts["christmas"].get(date, 0),
                "new_years": counts["new years"].get(date, 0),
                "super": counts["super"].get(date, 0),
                "blizzard": counts["blizzard"].get(date, 0),
            }
        )
    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(data, handle, ensure_ascii=True, indent=2)

    print(f"Wrote {len(data)} dates to {output_path}")


if __name__ == "__main__":
    main()
