from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ── Required — must be set in Railway dashboard (or .env locally) ─────────
    bot_token: str                   # from @BotFather
    admin_api_key: str               # python3 -c "import secrets; print(secrets.token_hex(32))"

    # ── Optional — sensible defaults work out of the box ──────────────────────
    # Railway: add a Volume at /data and set DATABASE_URL=sqlite:////data/triproute.db
    database_url: str = "sqlite:///./triproute.db"

    # Set SKIP_AUTH=true only for local development (disables Telegram HMAC check)
    skip_auth: bool = False

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
