from __future__ import annotations
import os
import time
from dataclasses import dataclass
from typing import Dict, List, Optional
import requests


TWITCH_OAUTH_URL = "https://id.twitch.tv/oauth2/token"
HELIX_BASE = "https://api.twitch.tv/helix"


@dataclass
class StreamInfo:
    user_login: str
    user_id: str
    started_at: str
    title: str
    game_name: str
    viewer_count: int


class HelixClient:
    def __init__(self, client_id: str, client_secret: str):
        self.client_id = client_id
        self.client_secret = client_secret
        self._access_token: Optional[str] = None
        self._expires_at: float = 0.0  # epoch seconds

        # cache login->id
        self._user_id_cache: Dict[str, str] = {}

    @classmethod
    def from_env(cls) -> "HelixClient":
        cid = os.getenv("TWITCH_CLIENT_ID", "").strip()
        sec = os.getenv("TWITCH_CLIENT_SECRET", "").strip()
        if not cid or not sec:
            raise RuntimeError("Missing TWITCH_CLIENT_ID / TWITCH_CLIENT_SECRET in environment (.env).")
        return cls(cid, sec)

    def _ensure_token(self) -> None:
        now = time.time()
        if self._access_token and now < self._expires_at - 60:
            return

        resp = requests.post(
            TWITCH_OAUTH_URL,
            params={
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "grant_type": "client_credentials",
            },
            timeout=20,
        )
        resp.raise_for_status()
        data = resp.json()
        self._access_token = data["access_token"]
        expires_in = int(data.get("expires_in", 3600))
        self._expires_at = now + expires_in

    def _headers(self) -> Dict[str, str]:
        self._ensure_token()
        assert self._access_token
        return {
            "Client-ID": self.client_id,
            "Authorization": f"Bearer {self._access_token}",
        }

    def get_user_ids(self, logins: List[str]) -> Dict[str, str]:
        logins = [l.strip().lower() for l in logins if l.strip()]
        out: Dict[str, str] = {}

        missing = [l for l in logins if l not in self._user_id_cache]
        if missing:
            # Helix users endpoint supports multiple login params
            url = f"{HELIX_BASE}/users"
            params = []
            for l in missing:
                params.append(("login", l))

            resp = requests.get(url, headers=self._headers(), params=params, timeout=20)
            resp.raise_for_status()
            data = resp.json().get("data", [])
            for row in data:
                login = row["login"].lower()
                uid = row["id"]
                self._user_id_cache[login] = uid

        for l in logins:
            uid = self._user_id_cache.get(l)
            if uid:
                out[l] = uid

        return out

    def get_live_streams(self, logins: List[str], batch_size: int = 100) -> Dict[str, StreamInfo]:
        """
        Returns dict user_login -> StreamInfo for currently LIVE streams among the requested logins.
        """
        live: Dict[str, StreamInfo] = {}
        logins = [l.strip().lower() for l in logins if l.strip()]

        url = f"{HELIX_BASE}/streams"
        for i in range(0, len(logins), batch_size):
            chunk = logins[i : i + batch_size]
            params = []
            for l in chunk:
                params.append(("user_login", l))

            resp = requests.get(url, headers=self._headers(), params=params, timeout=20)
            resp.raise_for_status()
            rows = resp.json().get("data", [])
            for r in rows:
                login = r["user_login"].lower()
                live[login] = StreamInfo(
                    user_login=login,
                    user_id=str(r["user_id"]),
                    started_at=str(r["started_at"]),  # ISO8601
                    title=str(r.get("title", "")),
                    game_name=str(r.get("game_name", "")),
                    viewer_count=int(r.get("viewer_count", 0)),
                )
        return live