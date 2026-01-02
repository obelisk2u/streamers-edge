from __future__ import annotations

import json
import sys
from pathlib import Path

try:
    from tqdm import tqdm
except ImportError:  # pragma: no cover - optional dependency
    tqdm = None

MIN_WORDS = 20


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    input_path = root / "data" / "processed" / "long_messages_sentiment.json"
    output_path = root / "data" / "processed" / "stream_extreme_sentiment.json"

    records = []
    with input_path.open("r", encoding="utf-8") as handle:
        records = json.load(handle)

    streams: dict[str, dict[str, object]] = {}
    for record in records:
        stream_id = record.get("stream_id", "")
        timestamp = record.get("timestamp")
        if not stream_id or not timestamp:
            continue
        entry = streams.setdefault(
            stream_id, {"records": [], "min_ts": timestamp, "max_ts": timestamp}
        )
        if timestamp < entry["min_ts"]:
            entry["min_ts"] = timestamp
        if timestamp > entry["max_ts"]:
            entry["max_ts"] = timestamp
        message = record.get("message", "")
        if len(message.split()) <= MIN_WORDS:
            continue
        entry["records"].append(record)

    stream_ids = list(streams.keys())
    if tqdm is None:
        print(f"Processing {len(stream_ids)} streams...")

    results = []
    if tqdm is None:
        stream_iter = stream_ids
    else:
        stream_iter = tqdm(stream_ids, desc="Streams")
    for stream_id in stream_iter:
        entry = streams[stream_id]
        best_positive = None
        best_negative = None
        total_filtered = 0

        for record in entry["records"]:
            total_filtered += 1
            label = record.get("label", "")
            score = float(record.get("score", 0.0))
            item = {
                "username": record.get("username", ""),
                "message": record.get("message", ""),
                "timestamp_utc": record.get("timestamp"),
                "label": label,
                "score": score,
            }
            if label == "positive":
                if not best_positive or score > best_positive["score"]:
                    best_positive = item
            if label == "negative":
                if not best_negative or score > best_negative["score"]:
                    best_negative = item

        if tqdm is None:
            print(
                f"{stream_id}: scored {total_filtered} messages over {MIN_WORDS} words",
                file=sys.stderr,
            )

        results.append(
            {
                "stream": stream_id,
                "started_at": entry["min_ts"],
                "ended_at": entry["max_ts"],
                "most_positive": best_positive,
                "most_negative": best_negative,
            }
        )

    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(results, handle, ensure_ascii=True, indent=2)

    print(f"Wrote {len(results)} streams to {output_path}")


if __name__ == "__main__":
    main()
