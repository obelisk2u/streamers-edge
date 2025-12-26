from __future__ import annotations
import os
import socket
import ssl
import threading
import time
from typing import Callable, Dict, Optional, Tuple

from .util import utc_now_iso


def _parse_tags(tag_str: str) -> Dict[str, str]:
    # a=b;c=d;flag= -> {"a":"b","c":"d","flag":""}
    tags: Dict[str, str] = {}
    for part in tag_str.split(";"):
        if "=" in part:
            k, v = part.split("=", 1)
            tags[k] = v
        else:
            tags[part] = ""
    return tags


def parse_irc_line(line: str) -> Optional[Dict]:
    """
    Parses a Twitch IRC line. Returns a dict for PRIVMSG lines, else None.
    """
    raw = line.rstrip("\r\n")
    tags = {}
    prefix = ""
    cmd = ""
    params = ""
    trailing = ""

    s = raw

    if s.startswith("@"):
        tags_part, s = s.split(" ", 1)
        tags = _parse_tags(tags_part[1:])

    if s.startswith(":"):
        prefix, s = s[1:].split(" ", 1)

    if " :" in s:
        before, trailing = s.split(" :", 1)
    else:
        before = s

    parts = before.split()
    if not parts:
        return None
    cmd = parts[0]
    params = " ".join(parts[1:])

    if cmd == "PING":
        return {"type": "PING", "raw": raw, "payload": trailing or params}

    if cmd != "PRIVMSG":
        return None

    # params: "<#channel>"
    channel = params.strip()
    if channel.startswith("#"):
        channel = channel[1:]

    # prefix like: user!user@user.tmi.twitch.tv
    user = prefix.split("!", 1)[0] if prefix else ""

    return {
        "type": "PRIVMSG",
        "timestamp_utc": utc_now_iso(),
        "channel": channel.lower(),
        "user": user,
        "message": trailing,
        "tags": tags,
        "raw": raw,
    }


class IRCClient:
    def __init__(
        self,
        server: str,
        port: int,
        use_tls: bool,
        nick: str,
        oauth: str,
        on_privmsg: Callable[[Dict], None],
    ):
        self.server = server
        self.port = port
        self.use_tls = use_tls
        self.nick = nick
        self.oauth = oauth
        self.on_privmsg = on_privmsg

        self._sock: Optional[socket.socket] = None
        self._file = None

        self._stop = threading.Event()
        self._thread: Optional[threading.Thread] = None
        self._write_lock = threading.Lock()

        self._joined: Dict[str, bool] = {}

    @classmethod
    def from_env(cls, server: str, port: int, use_tls: bool, on_privmsg: Callable[[Dict], None]) -> "IRCClient":
        nick = os.getenv("TWITCH_IRC_NICK", "").strip()
        oauth = os.getenv("TWITCH_IRC_OAUTH", "").strip()
        if not nick or not oauth:
            raise RuntimeError("Missing TWITCH_IRC_NICK / TWITCH_IRC_OAUTH in environment (.env).")
        return cls(server, port, use_tls, nick, oauth, on_privmsg)

    def connect(self) -> None:
        self._stop.clear()
        base = socket.create_connection((self.server, self.port), timeout=20)
        if self.use_tls:
            ctx = ssl.create_default_context()
            sock = ctx.wrap_socket(base, server_hostname=self.server)
        else:
            sock = base

        sock.settimeout(60)
        self._sock = sock
        self._file = sock.makefile("r", encoding="utf-8", newline="\n")

        # auth + capabilities
        self._send(f"PASS {self.oauth}")
        self._send(f"NICK {self.nick}")
        self._send("CAP REQ :twitch.tv/tags twitch.tv/commands twitch.tv/membership")

        self._thread = threading.Thread(target=self._read_loop, name="twitch-irc-read", daemon=True)
        self._thread.start()

    def close(self) -> None:
        self._stop.set()
        try:
            if self._sock:
                with self._write_lock:
                    try:
                        self._sock.sendall(b"QUIT\r\n")
                    except Exception:
                        pass
                self._sock.close()
        finally:
            self._sock = None
            self._file = None

    def join(self, channel: str) -> None:
        channel = channel.strip().lstrip("#").lower()
        if not channel or self._joined.get(channel):
            return
        self._send(f"JOIN #{channel}")
        self._joined[channel] = True

    def part(self, channel: str) -> None:
        channel = channel.strip().lstrip("#").lower()
        if not channel or not self._joined.get(channel):
            return
        self._send(f"PART #{channel}")
        self._joined.pop(channel, None)

    def _send(self, line: str) -> None:
        if not self._sock:
            raise RuntimeError("IRC socket not connected.")
        msg = (line + "\r\n").encode("utf-8")
        with self._write_lock:
            self._sock.sendall(msg)

    def _read_loop(self) -> None:
        assert self._file is not None
        while not self._stop.is_set():
            try:
                line = self._file.readline()
                if not line:
                    # disconnected
                    break
                evt = parse_irc_line(line)
                if not evt:
                    continue
                if evt["type"] == "PING":
                    payload = evt.get("payload", "")
                    try:
                        self._send(f"PONG :{payload}")
                    except Exception:
                        pass
                    continue
                if evt["type"] == "PRIVMSG":
                    try:
                        self.on_privmsg(evt)
                    except Exception:
                        # swallow to keep logging alive
                        pass
            except socket.timeout:
                # allow loop to continue
                continue
            except Exception:
                break