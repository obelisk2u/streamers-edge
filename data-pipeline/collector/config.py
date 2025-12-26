from __future__ import annotations
from dataclasses import dataclass
from typing import List, Any, Dict
from pathlib import Path
import yaml


@dataclass(frozen=True)
class HelixCfg:
    poll_seconds: int = 60
    batch_size: int = 100


@dataclass(frozen=True)
class IRCCfg:
    server: str = "irc.chat.twitch.tv"
    port: int = 6697
    use_tls: bool = True
    join_delay_s: float = 1.2


@dataclass(frozen=True)
class StreamsCfg:
    channels: List[str]


@dataclass(frozen=True)
class AppCfg:
    data_root: Path
    streams: StreamsCfg
    helix: HelixCfg
    irc: IRCCfg


def load_config(path: str | Path) -> AppCfg:
    p = Path(path)
    obj: Dict[str, Any] = yaml.safe_load(p.read_text(encoding="utf-8"))

    data_root = Path(obj["data_root"])
    streams = StreamsCfg(channels=[c.strip().lstrip("#").lower() for c in obj["streams"]["channels"]])

    helix_obj = obj.get("helix", {}) or {}
    irc_obj = obj.get("irc", {}) or {}

    helix = HelixCfg(
        poll_seconds=int(helix_obj.get("poll_seconds", 60)),
        batch_size=int(helix_obj.get("batch_size", 100)),
    )

    irc = IRCCfg(
        server=str(irc_obj.get("server", "irc.chat.twitch.tv")),
        port=int(irc_obj.get("port", 6697)),
        use_tls=bool(irc_obj.get("use_tls", True)),
        join_delay_s=float(irc_obj.get("join_delay_s", 1.2)),
    )

    return AppCfg(
        data_root=data_root,
        streams=streams,
        helix=helix,
        irc=irc,
    )