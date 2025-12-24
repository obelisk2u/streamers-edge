import secrets
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, HTTPException, Request
from starlette.responses import RedirectResponse
from fastapi import Response


from app.core.config import settings

router = APIRouter()

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

        access_token = token_resp.json()["access_token"]

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
    profile_image_url = me.get("profile_image_url")
    session_value = f"{twitch_user_id}:{twitch_login}:{display_name}:{profile_image_url}"
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
def logout(response: Response):
    response.delete_cookie(key=settings.SESSION_COOKIE_NAME, path="/")
    return {"ok": True}


@router.get("/me")
def me(request: Request):
    raw = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if not raw:
        return {"authenticated": False}

    parts = raw.split(":", 3)
    if len(parts) < 3:
        return {"authenticated": False}

    twitch_user_id = parts[0]
    login = parts[1]
    display_name = parts[2]
    profile_image_url = parts[3] if len(parts) == 4 else None

    return {
        "authenticated": True,
        "twitch_user_id": twitch_user_id,
        "login": login,
        "display_name": display_name,
        "profile_image_url": profile_image_url,
    }