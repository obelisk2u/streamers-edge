from __future__ import annotations

import json
from pathlib import Path

from data30_utils import iter_data30_messages


MIN_WORDS = 10


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    output_path = root / "data" / "processed" / "long_messages.json"

    records = []
    for record in iter_data30_messages():
        username = record.get("username", "")
        message = record.get("message", "")
        if not message:
            continue
        lower_username = username.lower()
        if lower_username.endswith("bot") or lower_username == "streamelements":
            continue
        if "subscribed at Tier 1" in message:
            continue
        if "subscribed with Prime. They've subscribed" in message:
            continue
        if len(message.split()) <= MIN_WORDS:
            continue
        records.append(record)

    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(records, handle, ensure_ascii=True, indent=2)

    print(f"Wrote {len(records)} records to {output_path}")


if __name__ == "__main__":
    main()
