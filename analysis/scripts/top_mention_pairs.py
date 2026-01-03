from __future__ import annotations

import json
import re
from collections import defaultdict
from pathlib import Path


MENTION_RE = re.compile(r"@([A-Za-z0-9_]+)")


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    input_path = root / "data" / "data30" / "all_chat.jsonl"
    output_path = root / "data" / "processed" / "top_mention_pairs.json"

    pair_counts: dict[tuple[str, str], int] = defaultdict(int)
    pair_messages: dict[tuple[str, str], list[dict]] = defaultdict(list)

    with input_path.open("r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            try:
                payload = json.loads(line)
            except json.JSONDecodeError:
                continue
            sender = str(payload.get("u", "")).lower()
            message = str(payload.get("m", ""))
            timestamp = payload.get("ts")
            if not sender or not message:
                continue

            mentions = {m.lower() for m in MENTION_RE.findall(message)}
            for target in mentions:
                if not target or target == sender:
                    continue
                if "supertf" in {sender, target}:
                    continue
                pair = tuple(sorted([sender, target]))
                pair_counts[pair] += 1
                pair_messages[pair].append(
                    {
                        "sender": sender,
                        "target": target,
                        "message": message,
                        "timestamp": timestamp,
                    }
                )

    if not pair_counts:
        output = {"pair": [], "mentions": 0, "messages": []}
    else:
        top_pair = max(pair_counts.items(), key=lambda item: item[1])[0]
        output = {
            "pair": list(top_pair),
            "mentions": pair_counts[top_pair],
            "messages": pair_messages[top_pair],
        }

    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(output, handle, ensure_ascii=True, indent=2)

    print(f"Wrote top mention pair to {output_path}")


if __name__ == "__main__":
    main()
