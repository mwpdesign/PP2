from typing import List, Optional, Union
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # API Configuration
    API_PREFIX: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # CORS
    CORS_ORIGINS: Union[str, List[str]] = ["http://localhost:3000"]

    @property
    def cors_origins(self) -> List[str]:
        """Get the list of allowed CORS origins."""
        if isinstance(self.CORS_ORIGINS, str):
            return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
        return self.CORS_ORIGINS

    # Database
    DATABASE_URL: str
    MAX_CONNECTIONS_COUNT: int = 10
    MIN_CONNECTIONS_COUNT: int = 3

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # AWS Configuration - Optional for local development
    AWS_ACCESS_KEY_ID: Optional[str] = "local-dev-key"
    AWS_SECRET_ACCESS_KEY: Optional[str] = "local-dev-secret"
    AWS_DEFAULT_REGION: str = "us-east-1"
    AWS_COGNITO_USER_POOL_ID: Optional[str] = "local-dev-pool"
    AWS_COGNITO_CLIENT_ID: Optional[str] = "local-dev-client"
    AWS_S3_BUCKET: Optional[str] = "local-dev-bucket"
    AWS_KMS_KEY_ID: Optional[str] = "local-dev-kms"

    @property
    def use_local_services(self) -> bool:
        """Determine if local development services should be used."""
        return self.ENVIRONMENT == "development"

    @property
    def s3_endpoint_url(self) -> Optional[str]:
        """Get S3 endpoint URL based on environment."""
        return "http://localhost:4566" if self.use_local_services else None

    @property
    def kms_endpoint_url(self) -> Optional[str]:
        """Get KMS endpoint URL based on environment."""
        return "http://localhost:4566" if self.use_local_services else None

    class Config:
        case_sensitive = True
        env_file = ".env"


# Create global settings instance
settings = Settings() 