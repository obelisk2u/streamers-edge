from __future__ import annotations

import json
from pathlib import Path

from data30_utils import iter_data30_messages, parse_timestamp


def word_count(text: str) -> int:
    return len([word for word in text.split() if word])


def main() -> None:
    longest = {
        "stream_id": "",
        "timestamp": "",
        "username": "",
        "message": "",
        "words": 0,
    }

    for record in iter_data30_messages():
        message = record.get("message") or ""
        count = word_count(message)
        if count <= longest["words"]:
            continue
        longest = {
            "stream_id": record.get("stream_id") or "",
            "timestamp": record.get("timestamp") or "",
            "username": record.get("username") or "",
            "message": message,
            "words": count,
        }

    output_path = (
        Path(__file__).resolve().parents[1]
        / "data"
        / "processed"
        / "longest_message.json"
    )
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(longest, handle, indent=2)

    print(
        f"Wrote longest message ({longest['words']} words) to {output_path}"
    )


if __name__ == "__main__":
    main()
