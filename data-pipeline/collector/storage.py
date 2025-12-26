from __future__ import annotations
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Optional

from .util import iso_to_folder, safe_name


@dataclass
class ActiveStream:
    channel: str
    started_at: str
    user_id: str
    title: str
    game_name: str
    viewer_count: int

    stream_dir: Path
    chat_path: Path
    meta_path: Path
    snapshots_path: Path

    chat_fh: object
    snapshots_fh: object


class Storage:
    def __init__(self, data_root: Path):
        self.data_root = data_root

    def ensure_root(self) -> None:
        self.data_root.mkdir(parents=True, exist_ok=True)
        test = self.data_root / ".write_test"
        test.write_text("ok\n", encoding="utf-8")
        test.unlink(missing_ok=True)

    def stream_dir(self, channel: str, started_at: str) -> Path:
        ch = safe_name(channel)
        st = iso_to_folder(started_at.replace("+00:00", "Z"))
        return self.data_root / "raw_chat" / f"channel={ch}" / f"stream={st}"

    def open_stream(self, info: Dict) -> ActiveStream:
        channel = info["channel"]
        started_at = info["started_at"]

        sdir = self.stream_dir(channel, started_at)
        sdir.mkdir(parents=True, exist_ok=True)

        chat_path = sdir / "chat.jsonl"
        snapshots_path = sdir / "stream_snapshots.jsonl"
        meta_path = sdir / "meta.json"

        # Line-buffered so each \n flushes, without fsync per line
        chat_fh = chat_path.open("a", encoding="utf-8", buffering=1)
        snapshots_fh = snapshots_path.open("a", encoding="utf-8", buffering=1)

        meta = {
            "channel": channel,
            "user_id": info.get("user_id", ""),
            "started_at": started_at,
            "ended_at": None,
            "title": info.get("title", ""),
            "game_name": info.get("game_name", ""),
            "viewer_count": info.get("viewer_count", 0),
        }
        self._atomic_write_json(meta_path, meta)

        return ActiveStream(
            channel=channel,
            started_at=started_at,
            user_id=info.get("user_id", ""),
            title=info.get("title", ""),
            game_name=info.get("game_name", ""),
            viewer_count=int(info.get("viewer_count", 0)),
            stream_dir=sdir,
            chat_path=chat_path,
            meta_path=meta_path,
            snapshots_path=snapshots_path,
            chat_fh=chat_fh,
            snapshots_fh=snapshots_fh,
        )

    def append_chat(self, stream: ActiveStream, evt: Dict) -> None:
        stream.chat_fh.write(json.dumps(evt, ensure_ascii=False) + "\n")

    def append_snapshot(self, stream: ActiveStream, snap: Dict) -> None:
        stream.snapshots_fh.write(json.dumps(snap, ensure_ascii=False) + "\n")

    def close_stream(self, stream: ActiveStream, ended_at: str, last_meta: Optional[Dict] = None) -> None:
        # Close chat
        try:
            stream.chat_fh.flush()
            stream.chat_fh.close()
        except Exception:
            pass

        # Close snapshots
        try:
            stream.snapshots_fh.flush()
            stream.snapshots_fh.close()
        except Exception:
            pass

        meta = {
            "channel": stream.channel,
            "user_id": stream.user_id,
            "started_at": stream.started_at,
            "ended_at": ended_at,
            "title": stream.title,
            "game_name": stream.game_name,
            "viewer_count": stream.viewer_count,
        }
        if last_meta:
            meta.update(last_meta)

        self._atomic_write_json(stream.meta_path, meta)

    def _atomic_write_json(self, path: Path, obj: Dict) -> None:
        tmp = path.with_suffix(path.suffix + ".tmp")
        tmp.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        tmp.replace(path)