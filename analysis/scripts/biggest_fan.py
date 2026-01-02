from __future__ import annotations

import json
from pathlib import Path

from data30_utils import iter_data30_messages


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    most_mentions: dict[str, int] = {}
    mentions_by_user: dict[str, list[str]] = {}

    for record in iter_data30_messages():
        username = record.get("username", "")
        message = record.get("message", "")
        if not username:
            continue
        if "@supertf" in message.lower():
            most_mentions[username] = most_mentions.get(username, 0) + 1
            mentions_by_user.setdefault(username, []).append(message)

    if not most_mentions:
        print("No @supertf mentions found.")
        return

    top_mentions_user = max(most_mentions.items(), key=lambda item: item[1])
    top_username = top_mentions_user[0]
    output = {
        "username": top_username,
        "mentions": top_mentions_user[1],
        "messages": mentions_by_user.get(top_username, []),
    }

    output_path = root / "data" / "processed" / "top_supertf_mentions.json"
    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(output, handle, ensure_ascii=True, indent=2)

    print(f"Wrote results to {output_path}")


if __name__ == "__main__":
    main()
