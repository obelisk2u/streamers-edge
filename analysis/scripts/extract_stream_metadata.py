from __future__ import annotations

import json
from pathlib import Path


def iter_stream_meta(root: Path):
    for meta_path in sorted(root.rglob("meta.json")):
        meta = json.loads(meta_path.read_text(encoding="utf-8"))
        started_at = meta.get("started_at")
        date = started_at.split("T")[0] if started_at else None
        yield {
            "stream": meta_path.parent.name,
            "date": date,
            "title": meta.get("title"),
            "category": meta.get("game_name"),
        }


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    raw_root = root / "data" / "raw"
    output_path = root / "data" / "processed" / "stream_metadata.json"

    records = list(iter_stream_meta(raw_root))
    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(records, handle, ensure_ascii=True, indent=2)

    print(f"Wrote {len(records)} streams to {output_path}")


if __name__ == "__main__":
    main()
