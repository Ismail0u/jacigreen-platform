from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


ROOT_DIR = Path(__file__).resolve().parents[3]
ENV_FILE = ROOT_DIR / ".env"

"""
Application configuration settings.
This module defines the Settings class, which inherits from BaseSettings provided by Pydantic.
The Settings class contains various configuration parameters for the application, including database connection details, security settings, AI model configuration, and other application-specific settings.
The settings are loaded from environment variables or a .env file, allowing for easy configuration management across different environments.
"""
class Settings(BaseSettings):
    DATABASE_URL: str = (
        "postgresql+asyncpg://jacigreen:jacigreen_dev@localhost:5433/jacigreen"
    )
    REDIS_URL: str = "redis://localhost:6380/0"

    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    AI_MODEL_PATH: str = "ai/models/yolov8n.pt"
    AI_CONFIDENCE_THRESHOLD: float = 0.45

    DEBUG: bool = True
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:8081"

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE) if ENV_FILE.exists() else None,
        extra="ignore"
    )


settings = Settings()