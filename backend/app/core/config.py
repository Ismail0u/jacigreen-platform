from pathlib import Path

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


ROOT_DIR = Path(__file__).resolve().parents[3]
ENV_FILE = ROOT_DIR / ".env"


class Settings(BaseSettings):
    # Environment
    ENVIRONMENT: str = "development"

    # Database
    DATABASE_URL: str = (
        "postgresql+asyncpg://jacigreen:jacigreen_dev@localhost:5432/jacigreen"
    )
    REDIS_URL: str = "redis://localhost:6379/0"

    # Security & JWT
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # IA
    AI_MODEL_PATH: str = "ai/models/best.pt"
    AI_CONFIDENCE_THRESHOLD: float = 0.5

    # App
    DEBUG: bool = False
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:8081,http://localhost:5173"
    ALLOWED_HOSTS: str = "localhost,127.0.0.1,0.0.0.0"

    # Supabase (for file storage - optional)
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_STORAGE_BUCKET: str = "photos"

    # Rate limiting
    RATE_LIMIT_ENABLED: bool = True
    LOGIN_RATE_LIMIT: int = 5
    LOGIN_RATE_LIMIT_WINDOW: int = 900

    @field_validator("DEBUG", mode="before")
    @classmethod
    def parse_debug(cls, value):
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"release", "prod", "production"}:
                return False
            if normalized in {"dev", "debug", "true", "1", "yes", "on"}:
                return True
        return value

    @field_validator("SECRET_KEY", mode="before")
    @classmethod
    def validate_secret_key(cls, value):
        if value is None or value == "":
            return "dev-secret-change-me"
        return value

    @model_validator(mode="after")
    def validate_runtime_security(self):
        if self.ENVIRONMENT.lower() in {"prod", "production", "live"} and self.SECRET_KEY in {"", "dev-secret-change-me"}:
            raise ValueError("SECRET_KEY must be set to a strong value in production")
        return self

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE) if ENV_FILE.exists() else None,
        extra="ignore",
    )


settings = Settings()
