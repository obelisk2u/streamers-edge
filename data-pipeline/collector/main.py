from __future__ import annotations
import argparse
import os
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

    # load .env from cwd or alongside config
    load_dotenv()

    cfg = load_config(args.config)

    storage = Storage(cfg.data_root)
    storage.ensure_root()

    helix = HelixClient.from_env()

    active_streams: Dict[str, ActiveStream] = {}  # channel -> stream session

    def on_privmsg(evt: Dict) -> None:
        ch = evt["channel"]
        stream = active_streams.get(ch)
        if not stream:
            # chat arrived before we opened stream (rare); ignore
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

    # connect once; reconnect logic is simple: if it dies, exit with nonzero for now
    irc.connect()
    print("[irc] connected")

    try:
        while True:
            # poll helix for live status
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

            # channels that just went live
            went_live = sorted(live_set - active_set)
            # channels that just went offline
            went_offline = sorted(active_set - live_set)

            for ch in went_live:
                info = live[ch]
                # open per-stream session directory based on Helix started_at
                stream = storage.open_stream({
                    "channel": ch,
                    "user_id": info.user_id,
                    "started_at": info.started_at.replace("+00:00", "Z"),
                    "title": info.title,
                    "game_name": info.game_name,
                    "viewer_count": info.viewer_count,
                })
                active_streams[ch] = stream

                # join IRC
                irc.join(ch)
                time.sleep(cfg.irc.join_delay_s)

                print(f"[live] {ch} started_at={info.started_at} title={info.title!r}")

            # update metadata for channels still live (lightweight)
            for ch in sorted(live_set & active_set):
                info = live[ch]
                stream = active_streams[ch]
                # keep some fields fresh in memory (final meta will reflect latest)
                stream.title = info.title
                stream.game_name = info.game_name
                stream.viewer_count = info.viewer_count

            for ch in went_offline:
                stream = active_streams.pop(ch, None)
                if not stream:
                    continue

                # part IRC, close files, write meta
                irc.part(ch)
                ended_at = utc_now_iso()
                storage.close_stream(stream, ended_at=ended_at)
                print(f"[off] {ch} ended_at={ended_at}")

            time.sleep(cfg.helix.poll_seconds)

    except KeyboardInterrupt:
        print("\n[shutdown] ctrl-c")
    finally:
        # close all active streams
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