from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path


BANDS = [
    ("1-3 chats", 1, 3),
    ("4-10 chats", 4, 10),
    ("11-25 chats", 11, 25),
    ("26-50 chats", 26, 50),
    ("51+ chats", 51, None),
]


def parse_timestamp(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(
        timezone.utc
    )


def load_records(path: Path) -> list[dict]:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def sentiment_value(record: dict) -> float:
    label = record.get("label", "")
    score = float(record.get("score", 0.0))
    if label == "positive":
        return score
    if label == "negative":
        return -score
    return 0.0


def build_chatter_distribution(records: list[dict]) -> list[dict]:
    counts: dict[str, int] = {}
    for record in records:
        username = record.get("username", "")
        if not username:
            continue
        counts[username] = counts.get(username, 0) + 1

    total_chatters = len(counts)
    output = []
    for label, lower, upper in BANDS:
        if upper is None:
            band_count = sum(1 for count in counts.values() if count >= lower)
        else:
            band_count = sum(1 for count in counts.values() if lower <= count <= upper)
        percent = (band_count / total_chatters * 100) if total_chatters else 0.0
        output.append(
            {
                "label": label,
                "chatters": band_count,
                "percent": round(percent, 2),
            }
        )
    return output


def build_top_sentiment(records: list[dict]) -> dict:
    positives = [r for r in records if r.get("label") == "positive"]
    negatives = [r for r in records if r.get("label") == "negative"]

    def trim(items: list[dict]) -> list[dict]:
        items.sort(key=lambda r: float(r.get("score", 0.0)), reverse=True)
        return [
            {
                "username": r.get("username", ""),
                "message": r.get("message", ""),
                "label": r.get("label", ""),
                "score": float(r.get("score", 0.0)),
            }
            for r in items[:10]
        ]

    return {"positive": trim(positives), "negative": trim(negatives)}


def build_user_extremes(records: list[dict], descending: bool) -> list[dict]:
    totals: dict[str, dict[str, float]] = {}
    messages_by_user: dict[str, list[str]] = {}

    for record in records:
        username = record.get("username", "")
        if not username:
            continue
        entry = totals.setdefault(username, {"count": 0, "sum": 0.0})
        entry["count"] += 1
        entry["sum"] += sentiment_value(record)
        messages_by_user.setdefault(username, []).append(record.get("message", ""))

    results = []
    for username, stats in totals.items():
        count = int(stats["count"])
        if count <= 5:
            continue
        avg = float(stats["sum"]) / count
        results.append({"username": username, "count": count, "avg_sentiment": avg})

    results.sort(key=lambda item: item["avg_sentiment"], reverse=descending)
    results = results[:5]
    for item in results:
        item["messages"] = messages_by_user.get(item["username"], [])
    return results


def build_top_mentions(records: list[dict]) -> dict:
    mention_counts: dict[str, int] = {}
    mention_messages: dict[str, list[str]] = {}
    for record in records:
        username = record.get("username", "")
        message = record.get("message", "")
        if not username:
            continue
        if "@supertf" in message.lower():
            mention_counts[username] = mention_counts.get(username, 0) + 1
            mention_messages.setdefault(username, []).append(message)

    if not mention_counts:
        return {"username": "", "mentions": 0, "messages": []}

    top_username, count = max(mention_counts.items(), key=lambda item: item[1])
    return {
        "username": top_username,
        "mentions": count,
        "messages": mention_messages.get(top_username, []),
    }


def build_sentiment_bins(records: list[dict]) -> dict:
    bounds: dict[str, dict[str, datetime]] = {}
    for record in records:
        stream_id = record.get("stream_id", "")
        timestamp = record.get("timestamp")
        if not stream_id or not timestamp:
            continue
        ts = parse_timestamp(timestamp)
        entry = bounds.setdefault(stream_id, {"min": ts, "max": ts})
        if ts < entry["min"]:
            entry["min"] = ts
        if ts > entry["max"]:
            entry["max"] = ts

    sums = [0.0] * 20
    counts = [0] * 20
    for record in records:
        stream_id = record.get("stream_id", "")
        timestamp = record.get("timestamp")
        if not stream_id or not timestamp:
            continue
        bound = bounds.get(stream_id)
        if not bound:
            continue
        duration = (bound["max"] - bound["min"]).total_seconds()
        if duration <= 0:
            continue
        ts = parse_timestamp(timestamp)
        position = (ts - bound["min"]).total_seconds() / duration
        if position < 0 or position > 1:
            continue
        bin_index = min(int(position * 20), 19)
        sums[bin_index] += sentiment_value(record)
        counts[bin_index] += 1

    bins = []
    for i in range(20):
        start = i * 5
        end = start + 5
        avg = (sums[i] / counts[i]) if counts[i] else 0.0
        bins.append(
            {
                "label": f"{start}-{end}%",
                "avg_sentiment": round(avg, 4),
                "count": counts[i],
            }
        )

    return {"stream_count": len(bounds), "bins": bins}


def load_moderators(path: Path) -> set[str]:
    if not path.exists():
        return set()
    with path.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    return {str(name).lower() for name in data}


def build_moderator_sentiment(records: list[dict], moderators: set[str]) -> list[dict]:
    filtered = [
        record
        for record in records
        if record.get("username", "").lower() in moderators
        and record.get("label") in {"positive", "negative"}
    ]

    by_user: dict[str, dict[str, list[dict]]] = {}
    for record in filtered:
        username = record.get("username", "")
        label = record.get("label", "")
        entry = by_user.setdefault(username, {"positive": [], "negative": []})
        entry[label].append(record)

    output = []
    for username in sorted(by_user):
        buckets = by_user[username]
        positive = sorted(
            buckets["positive"], key=lambda item: item.get("score", 0), reverse=True
        )[:5]
        negative = sorted(
            buckets["negative"], key=lambda item: item.get("score", 0), reverse=True
        )[:5]
        output.append(
            {
                "username": username,
                "positive": positive,
                "negative": negative,
            }
        )
    return output


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    input_path = root / "data" / "processed" / "long_messages_sentiment.json"
    output_root = root / "data" / "processed"
    moderators_path = root / "data" / "data30" / "moderators.json"

    records = load_records(input_path)

    outputs = {
        "chatter_distribution.json": build_chatter_distribution(records),
        "most_negative_users.json": build_user_extremes(records, descending=False),
        "most_positive_users.json": build_user_extremes(records, descending=True),
        "top_10_sentiment.json": build_top_sentiment(records),
        "top_supertf_mentions.json": build_top_mentions(records),
        "sentiment_bins_5pct.json": build_sentiment_bins(records),
        "moderator_sentiment.json": build_moderator_sentiment(
            records, load_moderators(moderators_path)
        ),
    }

    for filename, payload in outputs.items():
        output_path = output_root / filename
        with output_path.open("w", encoding="utf-8") as handle:
            json.dump(payload, handle, ensure_ascii=True, indent=2)
        print(f"Wrote {output_path}")


if __name__ == "__main__":
    main()
