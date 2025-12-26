from __future__ import annotations
import argparse
import sys
import time
from typing import Dict

from dotenv import load_dotenv

from .config import load_config
from .helix import HelixClient, StreamInfo
from .irc import IRCClient
from .storage import Storage, ActiveStream
from .util import utc_now_iso


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True, help="Path to config.yaml")
    args = ap.parse_args()

    load_dotenv()
    cfg = load_config(args.config)

    storage = Storage(cfg.data_root)
    storage.ensure_root()

    helix = HelixClient.from_env()

    active_streams: Dict[str, ActiveStream] = {}

    def on_privmsg(evt: Dict) -> None:
        ch = evt["channel"]
        stream = active_streams.get(ch)
        if not stream:
            return
        storage.append_chat(stream, evt)

    irc = IRCClient.from_env(
        server=cfg.irc.server,
        port=cfg.irc.port,
        use_tls=cfg.irc.use_tls,
        on_privmsg=on_privmsg,
    )

    print(f"[boot] data_root={cfg.data_root}")
    print(f"[boot] tracking {len(cfg.streams.channels)} channels")

    irc.connect()
    print("[irc] connected")

    try:
        while True:
            try:
                live: Dict[str, StreamInfo] = helix.get_live_streams(
                    cfg.streams.channels,
                    batch_size=cfg.helix.batch_size,
                )
            except Exception as e:
                print(f"[helix] error: {e}", file=sys.stderr)
                time.sleep(max(5, cfg.helix.poll_seconds))
                continue

            live_set = set(live.keys())
            active_set = set(active_streams.keys())

            went_live = sorted(live_set - active_set)
            went_offline = sorted(active_set - live_set)

            # 1) Handle newly live channels
            for ch in went_live:
                info = live[ch]
                stream = storage.open_stream({
                    "channel": ch,
                    "user_id": info.user_id,
                    "started_at": info.started_at.replace("+00:00", "Z"),
                    "title": info.title,
                    "game_name": info.game_name,
                    "viewer_count": info.viewer_count,
                })
                active_streams[ch] = stream

                irc.join(ch)
                time.sleep(cfg.irc.join_delay_s)

                # initial snapshot
                storage.append_snapshot(stream, {
                    "timestamp_utc": utc_now_iso(),
                    "channel": ch,
                    "started_at": stream.started_at,
                    "viewer_count": info.viewer_count,
                    "title": info.title,
                    "game_name": info.game_name,
                })

                print(f"[live] {ch} started_at={info.started_at} title={info.title!r}")

            # 2) Update + snapshot for channels still live (every poll)
            poll_ts = utc_now_iso()
            for ch in sorted(live_set & set(active_streams.keys())):
                info = live[ch]
                stream = active_streams[ch]

                stream.title = info.title
                stream.game_name = info.game_name
                stream.viewer_count = info.viewer_count

                storage.append_snapshot(stream, {
                    "timestamp_utc": poll_ts,
                    "channel": ch,
                    "started_at": stream.started_at,
                    "viewer_count": info.viewer_count,
                    "title": info.title,
                    "game_name": info.game_name,
                })

            # 3) Handle channels that went offline
            for ch in went_offline:
                stream = active_streams.pop(ch, None)
                if not stream:
                    continue

                irc.part(ch)
                ended_at = utc_now_iso()
                storage.close_stream(stream, ended_at=ended_at)
                print(f"[off] {ch} ended_at={ended_at}")

            time.sleep(cfg.helix.poll_seconds)

    except KeyboardInterrupt:
        print("\n[shutdown] ctrl-c")
    finally:
        ended_at = utc_now_iso()
        for ch, stream in list(active_streams.items()):
            try:
                irc.part(ch)
            except Exception:
                pass
            storage.close_stream(stream, ended_at=ended_at)
        try:
            irc.close()
        except Exception:
            pass

    return 0


if __name__ == "__main__":
    raise SystemExit(main())