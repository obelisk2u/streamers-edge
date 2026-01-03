from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path


def parse_timestamp(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(
        timezone.utc
    )


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    input_path = root / "data" / "data30" / "all_chat.jsonl"
    output_path = root / "data" / "processed" / "fun_stats.json"

    unique_chatters: set[str] = set()
    stream_counts: dict[str, int] = {}
    stream_bounds: dict[str, dict[str, datetime]] = {}
    second_counts: dict[str, int] = {}

    with input_path.open("r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            try:
                payload = json.loads(line)
            except json.JSONDecodeError:
                continue

            stream_id = payload.get("vid", "")
            timestamp = payload.get("ts")
            username = payload.get("u", "")
            if username:
                unique_chatters.add(username)

            if stream_id:
                stream_counts[stream_id] = stream_counts.get(stream_id, 0) + 1

            if timestamp:
                ts = parse_timestamp(timestamp)
                bounds = stream_bounds.setdefault(
                    stream_id, {"min": ts, "max": ts}
                )
                if ts < bounds["min"]:
                    bounds["min"] = ts
                if ts > bounds["max"]:
                    bounds["max"] = ts

                second_key = ts.replace(microsecond=0).isoformat()
                second_counts[second_key] = second_counts.get(second_key, 0) + 1

    total_messages = sum(stream_counts.values())
    total_seconds = 0.0
    stream_lengths = []
    for bounds in stream_bounds.values():
        duration = (bounds["max"] - bounds["min"]).total_seconds()
        if duration <= 0:
            continue
        stream_lengths.append(duration)
        total_seconds += duration

    avg_chats_per_minute = (
        total_messages / (total_seconds / 60) if total_seconds else 0.0
    )
    peak_messages_per_second = max(second_counts.values()) if second_counts else 0
    avg_stream_length_seconds = (
        sum(stream_lengths) / len(stream_lengths) if stream_lengths else 0.0
    )

    output = {
        "unique_chatters": len(unique_chatters),
        "avg_chats_per_minute": round(avg_chats_per_minute, 2),
        "peak_messages_per_second": peak_messages_per_second,
        "avg_stream_length_seconds": int(avg_stream_length_seconds),
    }

    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(output, handle, ensure_ascii=True, indent=2)

    print(f"Wrote fun stats to {output_path}")


if __name__ == "__main__":
    main()
