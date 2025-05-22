"""
Application configuration.
"""
from functools import lru_cache
from typing import Optional

from pydantic import BaseSettings, Field

from app.core.config.shipping import ShippingSettings


class Settings(BaseSettings, ShippingSettings):
    """Application settings."""

    # Database settings
    database_url: str = Field(
        ...,
        description="Database connection URL"
    )

    # JWT settings
    jwt_secret_key: str = Field(
        ...,
        description="Secret key for JWT token generation"
    )
    jwt_algorithm: str = Field(
        default="HS256",
        description="Algorithm for JWT token generation"
    )
    jwt_expiration: int = Field(
        default=3600,
        description="JWT token expiration time in seconds"
    )

    # AWS settings
    aws_access_key_id: Optional[str] = Field(
        default=None,
        description="AWS access key ID"
    )
    aws_secret_access_key: Optional[str] = Field(
        default=None,
        description="AWS secret access key"
    )
    aws_region: str = Field(
        default="us-east-1",
        description="AWS region"
    )
    aws_s3_bucket: Optional[str] = Field(
        default=None,
        description="AWS S3 bucket for file storage"
    )
    aws_kms_key_id: Optional[str] = Field(
        default=None,
        description="AWS KMS key ID for encryption"
    )

    # Application settings
    debug: bool = Field(
        default=False,
        description="Debug mode"
    )
    api_prefix: str = Field(
        default="/api/v1",
        description="API prefix"
    )
    project_name: str = Field(
        default="Healthcare IVR Platform",
        description="Project name"
    )

    class Config:
        """Pydantic model configuration."""
        env_prefix = ""
        case_sensitive = False
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings() 