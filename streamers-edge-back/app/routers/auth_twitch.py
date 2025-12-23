import secrets
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, HTTPException
from starlette.responses import RedirectResponse

from app.core.config import settings

router = APIRouter()

# MVP-only in-memory state store (replace with Redis later)
_OAUTH_STATE = set()

TWITCH_AUTHORIZE_URL = "https://id.twitch.tv/oauth2/authorize"
TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token"
TWITCH_HELIX_USERS_URL = "https://api.twitch.tv/helix/users"


@router.get("/auth/twitch/start")
def twitch_start():
    state = secrets.token_urlsafe(24)
    _OAUTH_STATE.add(state)

    params = {
        "client_id": settings.TWITCH_CLIENT_ID,
        "redirect_uri": settings.TWITCH_REDIRECT_URI,
        "response_type": "code",
        # Keep scopes minimal at first. Add "user:read:email" only if you need email.
        "scope": "",
        "state": state,
    }
    return RedirectResponse(TWITCH_AUTHORIZE_URL + "?" + urlencode(params))


@router.get("/auth/twitch/callback")
async def twitch_callback(code: str | None = None, state: str | None = None):
    if not code or not state or state not in _OAUTH_STATE:
        raise HTTPException(status_code=400, detail="Invalid OAuth state or missing code")
    _OAUTH_STATE.discard(state)

    async with httpx.AsyncClient(timeout=20) as client:
        # 1) Exchange code -> token
        token_resp = await client.post(
            TWITCH_TOKEN_URL,
            data={
                "client_id": settings.TWITCH_CLIENT_ID,
                "client_secret": settings.TWITCH_CLIENT_SECRET,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": settings.TWITCH_REDIRECT_URI,
            },
        )
        if token_resp.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Token exchange failed: {token_resp.text}")

        token = token_resp.json()
        access_token = token["access_token"]

        # 2) Fetch user identity
        user_resp = await client.get(
            TWITCH_HELIX_USERS_URL,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Client-Id": settings.TWITCH_CLIENT_ID,
            },
        )
        if user_resp.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Get users failed: {user_resp.text}")

        data = user_resp.json().get("data", [])
        if not data:
            raise HTTPException(status_code=400, detail="No user returned from Twitch")

        me = data[0]
        twitch_user_id = me["id"]
        twitch_login = me["login"]
        display_name = me.get("display_name", twitch_login)

    # MVP session cookie payload:
    # Production: store server-side session and set cookie to opaque session id.
    session_value = f"{twitch_user_id}:{twitch_login}:{display_name}"

    resp = RedirectResponse(f"{settings.FRONTEND_URL}/dashboard")
    resp.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=session_value,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=60 * 60 * 24 * 7,
        path="/",
    )
    return resp


@router.post("/auth/logout")
def logout():
    resp = RedirectResponse(settings.FRONTEND_URL + "/")
    resp.delete_cookie(key=settings.SESSION_COOKIE_NAME, path="/")
    return resp


@router.get("/me")
def me(request):
    raw = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if not raw:
        return {"authenticated": False}

    parts = raw.split(":", 2)
    if len(parts) < 2:
        return {"authenticated": False}

    twitch_user_id = parts[0]
    twitch_login = parts[1]
    display_name = parts[2] if len(parts) == 3 else twitch_login

    return {
        "authenticated": True,
        "twitch_user_id": twitch_user_id,
        "login": twitch_login,
        "display_name": display_name,
    }