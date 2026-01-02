from __future__ import annotations

import json
from pathlib import Path

from data30_utils import iter_data30_messages


def iter_stream_meta():
    streams: dict[str, dict[str, str | None]] = {}
    for record in iter_data30_messages():
        stream_id = record.get("stream_id", "")
        timestamp = record.get("timestamp")
        if not stream_id or not timestamp:
            continue
        entry = streams.setdefault(stream_id, {"date": None})
        date = timestamp.split("T")[0]
        if entry["date"] is None or date < entry["date"]:
            entry["date"] = date

    for stream_id, entry in sorted(streams.items()):
        yield {
            "stream": stream_id,
            "date": entry["date"],
            "title": f"Stream {stream_id}",
            "category": None,
        }


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    output_path = root / "data" / "processed" / "stream_metadata.json"

    records = list(iter_stream_meta())
    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(records, handle, ensure_ascii=True, indent=2)

    print(f"Wrote {len(records)} streams to {output_path}")


if __name__ == "__main__":
    main()
