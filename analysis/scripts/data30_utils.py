from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterator


DATA30_PATH = (
    Path(__file__).resolve().parents[1] / "data" / "data30" / "all_chat.jsonl"
)


def parse_timestamp(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(
        timezone.utc
    )


def iter_data30_messages(path: Path = DATA30_PATH) -> Iterator[dict]:
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
            yield {
                "stream_id": payload.get("vid", ""),
                "timestamp": payload.get("ts"),
                "username": payload.get("u", ""),
                "message": payload.get("m", ""),
            }
