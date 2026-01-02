from __future__ import annotations

import json
from pathlib import Path


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    input_path = root / "data" / "data30" / "all_chat.jsonl"
    output_path = root / "data" / "processed" / "chat_count.json"

    count = 0
    with input_path.open("r", encoding="utf-8") as handle:
        for line in handle:
            if line.strip():
                count += 1

    with output_path.open("w", encoding="utf-8") as handle:
        json.dump({"count": count}, handle, ensure_ascii=True, indent=2)

    print(f"Wrote chat count ({count}) to {output_path}")


if __name__ == "__main__":
    main()
