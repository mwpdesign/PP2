"""AWS Cognito configuration."""
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import ConfigDict, field_validator
import logging

logger = logging.getLogger(__name__)


class CognitoSettings(BaseSettings):
    """AWS Cognito configuration settings."""
    model_config = ConfigDict(extra='ignore')  # Allow extra env vars
    
    # Make all fields optional for development
    aws_region: Optional[str] = None
    cognito_user_pool_id: Optional[str] = None
    cognito_app_client_id: Optional[str] = None
    cognito_app_client_secret: Optional[str] = None
    cognito_domain: Optional[str] = None
    
    # Optional MFA settings
    enable_mfa: bool = False
    mfa_configuration: str = "OFF"  # OFF, ON, OPTIONAL
    
    # Development mode
    cognito_enabled: bool = False
    
    @field_validator("mfa_configuration")
    def validate_mfa_config(cls, v):
        """Validate MFA configuration value."""
        allowed = ["OFF", "ON", "OPTIONAL"]
        if v not in allowed:
            raise ValueError(f"MFA_CONFIGURATION must be one of {allowed}")
        return v


class CognitoConfig:
    """AWS Cognito configuration and client management."""
    
    def __init__(self, settings: CognitoSettings = CognitoSettings()):
        """Initialize Cognito configuration with settings."""
        self.settings = settings
        self.client = None
        self.idp_client = None
    
    async def get_client(self):
        """Get or create boto3 Cognito Identity Provider client."""
        if not self.settings.cognito_enabled:
            logger.warning("Cognito is disabled - running in development mode")
            return None
            
        if not self.idp_client:
            if not all([
                self.settings.aws_region,
                self.settings.cognito_user_pool_id,
                self.settings.cognito_app_client_id
            ]):
                logger.warning("Cognito configuration incomplete - some settings missing")
                return None
                
            import boto3
            self.idp_client = boto3.client('cognito-idp',
                region_name=self.settings.aws_region)
        return self.idp_client
    
    def get_jwt_config(self) -> dict:
        """Get JWT configuration for token validation."""
        return {
            "region": self.settings.aws_region,
            "user_pool_id": self.settings.cognito_user_pool_id,
            "app_client_id": self.settings.cognito_app_client_id,
            "domain": self.settings.cognito_domain
        }
    
    async def validate_config(self) -> bool:
        """Validate Cognito configuration by testing connection."""
        if not self.settings.cognito_enabled:
            logger.info("Cognito validation skipped - running in development mode")
            return True
            
        try:
            client = await self.get_client()
            if not client:
                return False
                
            # Test API call
            client.describe_user_pool(
                UserPoolId=self.settings.cognito_user_pool_id
            )
            return True
        except Exception as e:
            logger.error(f"Cognito configuration validation failed: {str(e)}")
            return False


# Global instance
cognito = CognitoConfig() 