from __future__ import annotations

import json
from pathlib import Path


def load_records(path: Path) -> list[dict]:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    input_path = root / "data" / "processed" / "combined_chat.json"
    output_path = root / "data" / "processed" / "unique_chatters.json"

    records = load_records(input_path)
    unique = sorted({record.get("username", "") for record in records if record.get("username", "")})

    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(unique, handle, ensure_ascii=True, indent=2)

    print(f"Wrote {len(unique)} unique chatters to {output_path}")


if __name__ == "__main__":
    main()
