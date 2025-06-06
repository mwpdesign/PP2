"""
Application configuration.
"""

import base64
import os
from functools import lru_cache
from typing import Dict, List
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings."""

    # Core settings
    PROJECT_NAME: str = "Healthcare IVR Platform"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = True

    # Security
    SECRET_KEY: str = Field(
        default="INSECURE_DEFAULT_CHANGE_ME",
        description="JWT secret key - MUST be changed in production"
    )
    ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]
    # Generate valid Fernet key for encryption
    ENCRYPTION_KEY: str = Field(
        default_factory=lambda: base64.urlsafe_b64encode(
            os.urandom(32)
        ).decode()
    )

    # Database
    DATABASE_URL: str = Field(
        default=(
            "postgresql://postgres:CHANGE_DB_PASSWORD@localhost:5432/"
            "healthcare_ivr"
        ),
        description="Database connection URL - configure in .env file"
    )

    # AWS Configuration
    aws_access_key_id: str = Field(default="dummy_access_key")
    aws_secret_access_key: str = Field(default="dummy_secret_key")
    aws_region: str = Field(default="us-east-1")
    aws_s3_bucket: str = Field(default="healthcare-ivr-local")
    aws_kms_key_id: str = Field(
        default="19c444c8-b145-41ba-b081-e0ba3cb5b6b2"
    )
    aws_endpoint_url: str = Field(default="http://localhost:4566")

    # Authentication
    AUTH_MODE: str = Field(default="local")  # local or cognito
    USE_COGNITO: bool = Field(default=False)
    USE_MOCK_AUTH: bool = Field(
        default=True,
        description="Enable mock auth for development authentication"
    )

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
            "ivr:submit",
            "delegation:create",
            "delegation:manage",
        ],
        ROLE_IVR: [
            "ivr:read",
            "ivr:write",
            "patients:read",
            "delegation:receive",
        ],
        ROLE_LOGISTICS: [
            "orders:read",
            "orders:write",
            "shipping:read",
            "shipping:write",
        ],
    }

    model_config = SettingsConfigDict(
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
