from __future__ import annotations
from datetime import datetime, timezone
import re


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def iso_to_folder(ts: str) -> str:
    # "2025-12-25T23:10:00Z" -> "2025-12-25T23-10-00Z"
    return ts.replace(":", "-")


def safe_name(s: str) -> str:
    s = s.strip().lower()
    s = re.sub(r"[^a-z0-9_\-]+", "_", s)
    return s.strip("_")