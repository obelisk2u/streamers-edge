from __future__ import annotations

import json
from pathlib import Path

from data30_utils import iter_data30_messages


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    output_path = root / "data" / "processed" / "unique_chatters.json"

    records = list(iter_data30_messages())
    unique = sorted(
        {record.get("username", "") for record in records if record.get("username", "")}
    )

    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(unique, handle, ensure_ascii=True, indent=2)

    print(f"Wrote {len(unique)} unique chatters to {output_path}")


if __name__ == "__main__":
    main()
