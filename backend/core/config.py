"""
Secure Configuration Management for Healthcare IVR Platform.
Handles environment-specific settings and sensitive values.
"""

import os
import json
import logging
from pathlib import Path
from typing import Dict, Any, Optional
from functools import lru_cache
from pydantic import BaseSettings, SecretStr, validator

# Setup logging
logger = logging.getLogger("config")


class EnvironmentSettings(BaseSettings):
    """Environment-specific settings with secure value handling."""

    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = False

    # API Configuration
    API_VERSION: str = "v1"
    API_PREFIX: str = f"/api/{API_VERSION}"

    # Security
    SECRET_KEY: SecretStr
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # AWS Configuration
    AWS_ACCESS_KEY_ID: SecretStr
    AWS_SECRET_ACCESS_KEY: SecretStr
    AWS_REGION: str = "us-east-1"
    AWS_S3_BUCKET: str
    AWS_KMS_KEY_ID: str

    # Database
    DATABASE_URL: SecretStr
    DATABASE_POOL_SIZE: int = 5
    DATABASE_MAX_OVERFLOW: int = 10

    # Redis
    REDIS_URL: SecretStr
    REDIS_POOL_SIZE: int = 10

    # External Services
    SLACK_WEBHOOK_URL: Optional[SecretStr] = None
    SNYK_TOKEN: Optional[SecretStr] = None

    # Monitoring
    PROMETHEUS_PUSHGATEWAY: str = "localhost:9091"
    LOG_LEVEL: str = "INFO"

    # HIPAA Compliance
    PHI_ENCRYPTION_KEY: SecretStr
    AUDIT_LOG_RETENTION_DAYS: int = 180

    # Feature Flags
    ENABLE_MFA: bool = True
    ENABLE_AUDIT_LOGGING: bool = True
    ENABLE_PHI_ENCRYPTION: bool = True

    class Config:
        """Pydantic configuration."""

        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

    @validator("ENVIRONMENT")
    def validate_environment(cls, v: str) -> str:
        """Validate environment setting."""
        allowed = {"development", "staging", "production"}
        if v not in allowed:
            raise ValueError(f"Environment must be one of: {allowed}")
        return v

    @validator("LOG_LEVEL")
    def validate_log_level(cls, v: str) -> str:
        """Validate logging level."""
        allowed = {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}
        if v.upper() not in allowed:
            raise ValueError(f"Log level must be one of: {allowed}")
        return v.upper()

    def get_aws_credentials(self) -> Dict[str, str]:
        """Get AWS credentials securely."""
        return {
            "aws_access_key_id": self.AWS_ACCESS_KEY_ID.get_secret_value(),
            "aws_secret_access_key": (self.AWS_SECRET_ACCESS_KEY.get_secret_value()),
            "region_name": self.AWS_REGION,
        }

    def get_database_url(self) -> str:
        """Get database URL securely."""
        return self.DATABASE_URL.get_secret_value()

    def get_redis_url(self) -> str:
        """Get Redis URL securely."""
        return self.REDIS_URL.get_secret_value()

    def get_phi_encryption_key(self) -> str:
        """Get PHI encryption key securely."""
        return self.PHI_ENCRYPTION_KEY.get_secret_value()

    def get_slack_webhook(self) -> Optional[str]:
        """Get Slack webhook URL if configured."""
        return (
            self.SLACK_WEBHOOK_URL.get_secret_value()
            if self.SLACK_WEBHOOK_URL
            else None
        )

    def get_snyk_token(self) -> Optional[str]:
        """Get Snyk token if configured."""
        return self.SNYK_TOKEN.get_secret_value() if self.SNYK_TOKEN else None


class Settings:
    """Main settings class with environment-specific configuration."""

    def __init__(self):
        """Initialize settings based on environment."""
        self.env_settings = EnvironmentSettings()
        self._setup_logging()
        self._load_feature_flags()

        logger.info(
            f"Loaded configuration for environment: {self.env_settings.ENVIRONMENT}"
        )

    def _setup_logging(self):
        """Configure logging based on environment."""
        logging.basicConfig(
            level=self.env_settings.LOG_LEVEL,
            format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        )

    def _load_feature_flags(self):
        """Load feature flags from configuration."""
        try:
            flags_file = Path("config/feature_flags.json")
            if flags_file.exists():
                with open(flags_file) as f:
                    flags = json.load(f)

                    # Override settings with file configuration
                    for flag, value in flags.get(
                        self.env_settings.ENVIRONMENT, {}
                    ).items():
                        if hasattr(self.env_settings, flag):
                            setattr(self.env_settings, flag, value)

        except Exception as e:
            logger.warning(f"Failed to load feature flags: {e}")

    @property
    def environment(self) -> str:
        """Get current environment."""
        return self.env_settings.ENVIRONMENT

    @property
    def debug(self) -> bool:
        """Get debug mode status."""
        return self.env_settings.DEBUG

    @property
    def api_prefix(self) -> str:
        """Get API prefix."""
        return self.env_settings.API_PREFIX

    def get_aws_credentials(self) -> Dict[str, str]:
        """Get AWS credentials securely."""
        return self.env_settings.get_aws_credentials()

    def get_database_url(self) -> str:
        """Get database URL securely."""
        return self.env_settings.get_database_url()

    def get_redis_url(self) -> str:
        """Get Redis URL securely."""
        return self.env_settings.get_redis_url()

    def get_phi_encryption_key(self) -> str:
        """Get PHI encryption key securely."""
        return self.env_settings.get_phi_encryption_key()

    def get_feature_flags(self) -> Dict[str, bool]:
        """Get current feature flag settings."""
        return {
            "mfa_enabled": self.env_settings.ENABLE_MFA,
            "audit_logging": self.env_settings.ENABLE_AUDIT_LOGGING,
            "phi_encryption": self.env_settings.ENABLE_PHI_ENCRYPTION,
        }


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
