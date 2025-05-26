"""Application configuration."""
import os
import secrets
from typing import Any, Dict, List, Optional, Union
from pydantic import AnyHttpUrl, EmailStr, validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""
    
    # API settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Healthcare IVR Platform"
    
    # CORS settings
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = []
    
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
    
    # Security settings
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"
    
    # Database settings
    POSTGRES_SERVER: str = os.getenv("DB_HOST", "localhost")
    POSTGRES_USER: str = os.getenv("DB_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("DB_PASSWORD", "postgres")
    POSTGRES_DB: str = os.getenv("DB_NAME", "healthcare_ivr")
    SQLALCHEMY_DATABASE_URI: Optional[str] = None
    
    @validator("SQLALCHEMY_DATABASE_URI", pre=True)
    def assemble_db_connection(
        cls,
        v: Optional[str],
        values: Dict[str, Any]
    ) -> Any:
        """Assemble database connection string."""
        if isinstance(v, str):
            return v
        return (
            f"postgresql+asyncpg://"
            f"{values.get('POSTGRES_USER')}:"
            f"{values.get('POSTGRES_PASSWORD')}@"
            f"{values.get('POSTGRES_SERVER')}/"
            f"{values.get('POSTGRES_DB')}"
        )
    
    # Email settings
    SMTP_TLS: bool = True
    SMTP_PORT: Optional[int] = None
    SMTP_HOST: Optional[str] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAILS_FROM_EMAIL: Optional[EmailStr] = None
    EMAILS_FROM_NAME: Optional[str] = None
    
    # First superuser
    FIRST_SUPERUSER_EMAIL: EmailStr = "admin@healthcare.dev"
    FIRST_SUPERUSER_PASSWORD: str = "admin"
    
    # Encryption settings
    ENCRYPTION_KEY: str = os.getenv(
        "ENCRYPTION_KEY",
        secrets.token_urlsafe(32)
    )
    
    # Password settings
    PASSWORD_MIN_LENGTH: int = 8
    PASSWORD_MAX_LENGTH: int = 100
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int = 60
    
    # Security settings
    SECURITY_RESET_TOKEN_LIFETIME_MINUTES: int = 60
    SECURITY_REFRESH_TOKEN_LIFETIME_DAYS: int = 7
    SECURITY_PASSWORD_SALT: str = secrets.token_hex(32)
    
    # Development mode
    IS_DEVELOPMENT: bool = os.getenv(
        "ENVIRONMENT",
        "development"
    ) == "development"
    
    class Config:
        """Pydantic config."""
        case_sensitive = True
        env_file = ".env"


settings = Settings() 