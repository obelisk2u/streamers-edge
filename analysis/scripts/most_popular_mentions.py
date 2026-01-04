from __future__ import annotations

import json
import re
from collections import Counter, defaultdict
from pathlib import Path

from data30_utils import iter_data30_messages


MENTION_RE = re.compile(r"@([A-Za-z0-9_]+)")


def main() -> None:
    unique_senders: dict[str, set[str]] = defaultdict(set)
    mention_counts: Counter[str] = Counter()

    for record in iter_data30_messages():
        sender = (record.get("username") or "").lower()
        message = record.get("message") or ""
        targets = {m.lower() for m in MENTION_RE.findall(message)}
        for target in targets:
            if target == "supertf" or not target or target == sender:
                continue
            unique_senders[target].add(sender)
        for target in MENTION_RE.findall(message):
            target_lower = target.lower()
            if target_lower == "supertf" or not target_lower or target_lower == sender:
                continue
            mention_counts[target_lower] += 1

    ranking = sorted(
        unique_senders.items(),
        key=lambda item: (-len(item[1]), -mention_counts[item[0]], item[0]),
    )[:5]

    output = [
        {
            "username": username,
            "unique_chatters": len(unique_senders[username]),
            "mentions": mention_counts[username],
        }
        for username, _ in ranking
    ]

    output_path = (
        Path(__file__).resolve().parents[1]
        / "data"
        / "processed"
        / "most_popular_mentions.json"
    )
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(output, handle, indent=2)
    print(f"Wrote {len(output)} users to {output_path}")


if __name__ == "__main__":
    main()
