from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    bot_token: str = "dev_token"
    # On Railway mount a volume at /data and set DATABASE_URL=sqlite:////data/triproute.db
    database_url: str = "sqlite:///./triproute.db"
    skip_auth: bool = True  # set False in prod

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
