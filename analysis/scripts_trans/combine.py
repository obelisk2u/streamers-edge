from __future__ import annotations

import json
import sys
from pathlib import Path


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    input_dir = root / "data" / "transcripts"
    output_path = root / "data" / "processed" / "combined_transcripts.json"

    transcripts = []
    if not input_dir.exists():
        raise FileNotFoundError(f"Missing transcripts dir: {input_dir}")

    for path in sorted(input_dir.glob("*.transcript.json")):
        vod_id = path.name.split(".")[0]
        try:
            with path.open("r", encoding="utf-8") as handle:
                payload = json.load(handle)
        except json.JSONDecodeError:
            print(f"Skipping invalid JSON: {path}", file=sys.stderr)
            continue

        transcripts.append(
            {
                "vod_id": vod_id,
                "transcript": payload,
            }
        )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(transcripts, handle, indent=2)

    print(f"Wrote {len(transcripts)} transcripts to {output_path}")


if __name__ == "__main__":
    main()
