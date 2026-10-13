from __future__ import annotations

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

    # App
    APP_NAME: str = "SchoolERP"
    APP_ENV: str = "development"
    APP_VERSION: str = "1.0.0"

    # Database
    DATABASE_URL: str

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS – stored as comma-separated string in env, parsed to list
    ALLOWED_ORIGINS: str = "http://localhost:3000"

    @property
    def allowed_origins_list(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    # Super Admin bootstrap
    SUPER_ADMIN_EMAIL: str = "admin@schoolerp.com"
    SUPER_ADMIN_PASSWORD: str = "SuperAdmin@123"

    # File storage
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE_MB: int = 10

    # Domain
    BASE_DOMAIN: str = "localhost"

    @field_validator("SECRET_KEY")
    @classmethod
    def secret_key_must_exist(cls, v: str) -> str:
        if not v or v == "changeme-use-a-long-random-string-in-production":
            import os
            if os.getenv("APP_ENV", "development") == "production":
                raise ValueError("SECRET_KEY must be set to a secure value in production")
        return v


settings = Settings()  # type: ignore[call-arg]
