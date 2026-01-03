from __future__ import annotations

import json
import re
from collections import Counter
from pathlib import Path

from data30_utils import iter_data30_messages, parse_timestamp


def main() -> None:
    patterns = [
        re.compile(r"subscribed at tier [123]"),
        re.compile(r"subscribed with prime"),
        re.compile(r"gifted (?:\\d+ )?tier [123] sub"),
        re.compile(r"gifted a tier [123] sub"),
    ]
    counts: Counter[str] = Counter()
    for record in iter_data30_messages():
        message = (record.get("message") or "").lower()
        if not any(pattern.search(message) for pattern in patterns):
            continue
        timestamp = record.get("timestamp")
        if not timestamp:
            continue
        date = parse_timestamp(timestamp).date().isoformat()
        counts[date] += 1

    output = [
        {"date": date, "subs": counts[date]} for date in sorted(counts.keys())
    ]

    output_path = (
        Path(__file__).resolve().parents[1]
        / "data"
        / "processed"
        / "subs_over_time.json"
    )
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(output, handle, indent=2)
    print(f"Wrote {len(output)} days to {output_path}")


if __name__ == "__main__":
    main()
