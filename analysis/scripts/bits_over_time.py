from __future__ import annotations

import json
import re
from collections import Counter
from pathlib import Path

from data30_utils import iter_data30_messages, parse_timestamp


CHEER_RE = re.compile(r"cheer(\d+)", re.IGNORECASE)


def main() -> None:
    totals: Counter[str] = Counter()
    for record in iter_data30_messages():
        message = record.get("message") or ""
        matches = CHEER_RE.findall(message)
        if not matches:
            continue
        timestamp = record.get("timestamp")
        if not timestamp:
            continue
        date = parse_timestamp(timestamp).date().isoformat()
        bits = sum(int(value) for value in matches)
        totals[date] += bits

    output = [
        {"date": date, "bits": totals[date]} for date in sorted(totals.keys())
    ]

    output_path = (
        Path(__file__).resolve().parents[1]
        / "data"
        / "processed"
        / "bits_over_time.json"
    )
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(output, handle, indent=2)
    print(f"Wrote {len(output)} days to {output_path}")


if __name__ == "__main__":
    main()
