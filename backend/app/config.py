"""Application settings loaded from environment via pydantic-settings v2."""
from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Environment / URLs
    ENVIRONMENT: str = "production"
    FRONTEND_URL: str = "https://keychain.qa"
    BACKEND_URL: str = "https://api.keychain.qa"

    # Database
    DATABASE_URL: str = "postgresql+psycopg2://keychain:keychain@localhost:5432/keychain"

    # Security / admin
    SECRET_KEY: str = "change_me"
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "change_me_strong_password"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 12  # 12 hours

    # WhatsApp
    WHATSAPP_NUMBER: str = "97433423421"

    # Google Sheets
    GOOGLE_SHEETS_ENABLED: bool = True
    GOOGLE_SHEET_ID: str = ""
    GOOGLE_SHEET_TAB_NAME: str = "order_items"
    GOOGLE_SERVICE_ACCOUNT_JSON: str = ""

    # Snapchat CAPI
    ENABLE_SNAPCHAT_CAPI: bool = True
    SNAP_PIXEL_ID: str = ""
    SNAP_ACCESS_TOKEN: str = ""

    # Meta CAPI
    ENABLE_META_CAPI: bool = False
    META_PIXEL_ID: str = ""
    META_CAPI_ACCESS_TOKEN: str = ""

    # TikTok Events
    ENABLE_TIKTOK_EVENTS: bool = False
    TIKTOK_PIXEL_ID: str = ""
    TIKTOK_ACCESS_TOKEN: str = ""

    # Misc
    RATE_LIMIT_PER_MINUTE: int = 20
    CORS_ORIGINS: str = "https://keychain.qa"
    LOG_LEVEL: str = "INFO"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        """Normalize ``postgres://`` / ``postgresql://`` to the psycopg2 driver
        and strip libpq-only query params (e.g. ``sslmode``) that SQLAlchemy's
        psycopg2 dialect tolerates but we keep clean here."""
        if not value:
            return value
        url = value.strip()
        if url.startswith("postgres://"):
            url = "postgresql+psycopg2://" + url[len("postgres://"):]
        elif url.startswith("postgresql://"):
            url = "postgresql+psycopg2://" + url[len("postgresql://"):]
        return url

    @property
    def cors_origins_list(self) -> List[str]:
        if not self.CORS_ORIGINS:
            return []
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
