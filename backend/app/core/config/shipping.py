"""
Shipping configuration settings.
"""

from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import Field


class ShippingSettings(BaseSettings):
    """Shipping configuration settings."""

    # General shipping settings
    shipping_test_mode: bool = Field(
        default=False, description="Whether to use test mode for shipping carriers"
    )

    # UPS settings
    ups_api_key: Optional[str] = Field(default=None, description="UPS API key")
    ups_user_id: Optional[str] = Field(default=None, description="UPS user ID")
    ups_password: Optional[str] = Field(
        default=None, description="UPS password")
    ups_account_number: Optional[str] = Field(
        default=None, description="UPS account number"
    )

    # FedEx settings
    fedex_api_key: Optional[str] = Field(
        default=None, description="FedEx API key")
    fedex_client_id: Optional[str] = Field(
        default=None,
        description="FedEx client ID"
    )
    fedex_client_secret: Optional[str] = Field(
        default=None, description="FedEx client secret"
    )
    fedex_account_number: Optional[str] = Field(
        default=None, description="FedEx account number"
    )

    # USPS settings
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

    class Config:
        """Pydantic model configuration."""

        env_prefix = ""
        case_sensitive = False
        env_file = ".env"
        env_file_encoding = "utf-8"
