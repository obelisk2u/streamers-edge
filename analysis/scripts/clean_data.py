from __future__ import annotations

import json
import sys
from pathlib import Path


def iter_chat_records(root: Path):
    for path in sorted(root.rglob("chat.jsonl")):
        with path.open("r", encoding="utf-8") as handle:
            for line_number, line in enumerate(handle, start=1):
                line = line.strip()
                if not line:
                    continue
                try:
                    payload = json.loads(line)
                except json.JSONDecodeError:
                    print(
                        f"Skipping invalid JSON in {path}:{line_number}",
                        file=sys.stderr,
                    )
                    continue
                message = payload.get("message", "")
                yield {
                    "username": payload.get("user", ""),
                    "message": message,
                }


def main() -> None:
    root = Path(__file__).resolve().parents[1] / "data" / "raw"
    output_path = Path(__file__).resolve().parents[1] / "data" / "processed" / "combined_chat.json"
    records = list(iter_chat_records(root))
    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(records, handle, ensure_ascii=True, indent=2)
    print(f"Wrote {len(records)} records to {output_path}")


if __name__ == "__main__":
    main()
