"""
Application configuration.
"""

import base64
import os
from functools import lru_cache
from typing import Dict, List
from pydantic import Field, ConfigDict
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""

    # Core settings
    PROJECT_NAME: str = "Healthcare IVR Platform"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = True

    # Security
    SECRET_KEY: str = Field("your-secret-key-here", env="SECRET_KEY")
    ALGORITHM: str = Field("HS256", env="ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    # Generate valid Fernet key for encryption
    ENCRYPTION_KEY: str = Field(
        base64.urlsafe_b64encode(os.urandom(32)).decode(), env="ENCRYPTION_KEY"
    )

    # Database
    DATABASE_URL: str = Field(
        "postgresql://postgres:password@db:5432/healthcare_ivr", env="DATABASE_URL"
    )

    # Authentication
    AUTH_MODE: str = Field("local", env="AUTH_MODE")  # local or cognito
    USE_COGNITO: bool = Field(False, env="USE_COGNITO")

    # Role constants
    ROLE_ADMIN: str = "Admin"
    ROLE_DOCTOR: str = "Doctor"
    ROLE_IVR: str = "IVR"
    ROLE_LOGISTICS: str = "Logistics"

    # Role permissions
    ROLE_PERMISSIONS: Dict[str, List[str]] = {
        ROLE_ADMIN: ["*"],  # Admin has all permissions
        ROLE_DOCTOR: [
            "patients:read",
            "patients:write",
            "orders:read",
            "orders:write",
            "ivr:read",
        ],
        ROLE_IVR: ["ivr:read", "ivr:write", "patients:read"],
        ROLE_LOGISTICS: [
            "orders:read",
            "orders:write",
            "shipping:read",
            "shipping:write",
        ],
    }

    model_config = ConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow",  # Allow extra fields in environment
    )


settings = Settings()


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return settings
