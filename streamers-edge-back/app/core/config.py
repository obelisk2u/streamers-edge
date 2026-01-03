import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    TWITCH_CLIENT_ID: str = os.environ["TWITCH_CLIENT_ID"]
    TWITCH_CLIENT_SECRET: str = os.environ["TWITCH_CLIENT_SECRET"]
    TWITCH_REDIRECT_URI: str = os.environ["TWITCH_REDIRECT_URI"]
    FRONTEND_URL: str = os.environ.get("FRONTEND_URL", "http://localhost:5173")

    # MVP session cookie settings
    SESSION_COOKIE_NAME: str = os.environ.get("SESSION_COOKIE_NAME", "se_session")
    COOKIE_SECURE: bool = os.environ.get("COOKIE_SECURE", "false").lower() == "true"  # set true in prod https
    COOKIE_SAMESITE: str = os.environ.get("COOKIE_SAMESITE", "lax")  # lax is best for oauth redirects

settings = Settings()