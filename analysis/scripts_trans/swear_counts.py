from __future__ import annotations

import json
import re
from pathlib import Path


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    input_path = root / "data" / "processed" / "combined_transcripts.json"
    output_path = root / "data" / "processed" / "streamer_swear_counts.json"

    with input_path.open("r", encoding="utf-8") as handle:
        transcripts = json.load(handle)

    patterns = {
        "fuck": re.compile(r"\bfuck\w*\b", re.IGNORECASE),
        "shit": re.compile(r"\bshit\w*\b", re.IGNORECASE),
        "ass": re.compile(r"\bass\w*\b", re.IGNORECASE),
        "hell": re.compile(r"\bhell\w*\b", re.IGNORECASE),
    }
    counts = {key: 0 for key in patterns}

    for entry in transcripts:
        transcript = entry.get("transcript", {}) or {}
        segments = transcript.get("segments", []) or []
        for segment in segments:
            text = segment.get("text", "")
            if not text:
                continue
            for key, pattern in patterns.items():
                counts[key] += len(pattern.findall(text))

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(counts, handle, indent=2)

    print(f"Wrote counts to {output_path}")


if __name__ == "__main__":
    main()
