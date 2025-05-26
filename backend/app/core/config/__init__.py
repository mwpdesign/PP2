"""
Application configuration.
"""
from functools import lru_cache
from typing import Any, Dict, List, Optional, Union
from pydantic import Field, validator
from pydantic_settings import BaseSettings, SettingsConfigDict
import base64
import os


def generate_fernet_key() -> str:
    """Generate a valid Fernet key."""
    return base64.urlsafe_b64encode(os.urandom(32)).decode()


class Settings(BaseSettings):
    """Application settings."""
    # Core settings
    PROJECT_NAME: str = "Healthcare IVR Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = True
    SECRET_KEY: str = Field(
        "local_development_secret_key_do_not_use_in_production",
        env='SECRET_KEY'
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30  # 30 days
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    ENVIRONMENT: str = "local"
    
    # Encryption settings
    ENCRYPTION_KEY: str = Field(
        default_factory=generate_fernet_key,
        env='ENCRYPTION_KEY'
    )
    ENCRYPTION_SALT: str = Field(
        default_factory=lambda: os.urandom(16).hex(),
        env='ENCRYPTION_SALT'
    )
    ENABLE_LOCAL_ENCRYPTION: bool = Field(True, env='ENABLE_LOCAL_ENCRYPTION')
    
    # Database
    DATABASE_URL: str = Field(
        "postgresql://michaelparson@localhost:5432/healthcare_ivr",
        env='DATABASE_URL'
    )
    POSTGRES_SERVER: str = Field("localhost", env='DB_HOST')
    POSTGRES_USER: str = Field("michaelparson", env='DB_USER')
    POSTGRES_PASSWORD: str = Field("", env='DB_PASSWORD')
    POSTGRES_DB: str = Field("healthcare_ivr", env='DB_NAME')
    SQLALCHEMY_DATABASE_URI: Optional[str] = None
    
    # Redis
    REDIS_URL: str = Field("redis://localhost:6379", env='REDIS_URL')
    
    # AWS
    AWS_ACCESS_KEY_ID: str = Field("test", env='AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY: str = Field("test", env='AWS_SECRET_ACCESS_KEY')
    AWS_REGION: str = Field("us-east-1", env='AWS_REGION')
    AWS_ENDPOINT_URL: Optional[str] = Field(
        "http://localhost:4566",
        env='AWS_ENDPOINT_URL'
    )
    AWS_KMS_KEY_ID: Optional[str] = None
    
    # AWS Cognito
    AWS_COGNITO_USER_POOL_ID: str = Field(
        "local_test_pool",
        env='AWS_COGNITO_USER_POOL_ID'
    )
    AWS_COGNITO_CLIENT_ID: str = Field(
        "local_test_client",
        env='AWS_COGNITO_CLIENT_ID'
    )
    
    # Security
    JWT_SECRET_KEY: str = Field(
        "local_development_secret_key_do_not_use_in_production",
        env='JWT_SECRET_KEY'
    )
    TOKEN_EXPIRY_MINUTES: int = 60
    
    # Email
    SMTP_TLS: bool = True
    SMTP_PORT: Optional[int] = None
    SMTP_HOST: Optional[str] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAILS_FROM_EMAIL: Optional[str] = None
    EMAILS_FROM_NAME: Optional[str] = None
    
    # Feature Flags
    ENABLE_MOCK_SERVICES: bool = Field(True, env='ENABLE_MOCK_SERVICES')
    ENABLE_DEMO_MODE: bool = Field(True, env='ENABLE_DEMO_MODE')
    ENABLE_PHI_ENCRYPTION: bool = Field(True, env='ENABLE_PHI_ENCRYPTION')
    
    # External Service URLs
    INSURANCE_API_URL: Optional[str] = Field(
        "http://localhost:8001/mock/insurance",
        env='INSURANCE_API_URL'
    )
    PHARMACY_API_URL: Optional[str] = Field(
        "http://localhost:8001/mock/pharmacy",
        env='PHARMACY_API_URL'
    )
    PROVIDER_API_URL: Optional[str] = Field(
        "http://localhost:8001/mock/provider",
        env='PROVIDER_API_URL'
    )
    
    # Notification Settings
    ENABLE_EMAIL_NOTIFICATIONS: bool = False
    ENABLE_SMS_NOTIFICATIONS: bool = False

    # Shipping Settings
    shipping_test_mode: bool = Field(
        default=False,
        description="Whether to use test mode for shipping carriers"
    )
    ups_api_key: Optional[str] = Field(
        default=None,
        description="UPS API key"
    )
    ups_user_id: Optional[str] = Field(
        default=None,
        description="UPS user ID"
    )
    ups_password: Optional[str] = Field(
        default=None,
        description="UPS password"
    )
    ups_account_number: Optional[str] = Field(
        default=None,
        description="UPS account number"
    )
    fedex_api_key: Optional[str] = Field(
        default=None,
        description="FedEx API key"
    )
    fedex_client_id: Optional[str] = Field(
        default=None,
        description="FedEx client ID"
    )
    fedex_client_secret: Optional[str] = Field(
        default=None,
        description="FedEx client secret"
    )
    fedex_account_number: Optional[str] = Field(
        default=None,
        description="FedEx account number"
    )
    usps_api_key: Optional[str] = Field(
        default=None,
        description="USPS API key"
    )
    usps_user_id: Optional[str] = Field(
        default=None,
        description="USPS user ID"
    )
    usps_password: Optional[str] = Field(
        default=None,
        description="USPS password"
    )

    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(
        cls,
        v: Union[str, List[str]]
    ) -> Union[List[str], str]:
        """Validate CORS origins."""
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    @validator("SQLALCHEMY_DATABASE_URI", pre=True)
    def assemble_db_connection(
        cls,
        v: Optional[str],
        values: Dict[str, Any]
    ) -> Any:
        """Assemble database connection URI."""
        if isinstance(v, str):
            return v
        if values.get("DATABASE_URL"):
            return values.get("DATABASE_URL")
        return (
            f"postgresql://{values.get('POSTGRES_USER')}:"
            f"{values.get('POSTGRES_PASSWORD')}@"
            f"{values.get('POSTGRES_SERVER')}/"
            f"{values.get('POSTGRES_DB')}"
        )

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        env_file_encoding="utf-8",
        extra="ignore"  # Allow extra fields in .env file
    )


# Create settings instance
settings = Settings()


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return settings 