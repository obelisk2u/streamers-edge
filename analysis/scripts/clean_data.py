from __future__ import annotations

import json
from pathlib import Path

from data30_utils import iter_data30_messages


def main() -> None:
    output_path = Path(__file__).resolve().parents[1] / "data" / "processed" / "combined_chat.json"
    records = [
        {"username": record["username"], "message": record["message"]}
        for record in iter_data30_messages()
    ]
    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(records, handle, ensure_ascii=True, indent=2)
    print(f"Wrote {len(records)} records to {output_path}")


if __name__ == "__main__":
    main()
