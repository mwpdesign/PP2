"""
Mock Authentication Service for Local Development Only.

This service provides simple in-memory authentication for local development.
NEVER USE IN PRODUCTION - This is for development convenience only.
"""

import os
from typing import Dict, Optional, Any
from uuid import uuid4
import logging

logger = logging.getLogger(__name__)


class MockAuthService:
    """
    Local development authentication service.

    WARNING: This is for LOCAL DEVELOPMENT ONLY.
    Do not use in production environments.
    """

    # Mock organization ID for development
    MOCK_ORG_ID = str(uuid4())

    # Mock user database - DEVELOPMENT ONLY
    MOCK_USERS = {
        "admin@healthcare.local": {
            "id": str(uuid4()),
            "email": "admin@healthcare.local",
            "password": "admin123",
            "first_name": "Admin",
            "last_name": "User",
            "role_id": "Admin",
            "organization_id": MOCK_ORG_ID,
            "is_active": True,
            "is_superuser": True,
            "mfa_enabled": False,
            "created_at": "2024-01-01T00:00:00Z",
        },
        "doctor@healthcare.local": {
            "id": str(uuid4()),
            "email": "doctor@healthcare.local",
            "password": "doctor123",
            "first_name": "Dr. John",
            "last_name": "Smith",
            "role_id": "Doctor",
            "organization_id": MOCK_ORG_ID,
            "is_active": True,
            "is_superuser": False,
            "mfa_enabled": False,
            "created_at": "2024-01-01T00:00:00Z",
        },
        "ivr@healthcare.local": {
            "id": str(uuid4()),
            "email": "ivr@healthcare.local",
            "password": "ivr123",
            "first_name": "IVR",
            "last_name": "Company",
            "role_id": "IVR",
            "organization_id": MOCK_ORG_ID,
            "is_active": True,
            "is_superuser": False,
            "mfa_enabled": False,
            "created_at": "2024-01-01T00:00:00Z",
        },
        "distributor@healthcare.local": {
            "id": str(uuid4()),
            "email": "distributor@healthcare.local",
            "password": "distributor123",
            "first_name": "Master",
            "last_name": "Distributor",
            "role_id": "Master Distributor",
            "organization_id": MOCK_ORG_ID,
            "is_active": True,
            "is_superuser": False,
            "mfa_enabled": False,
            "created_at": "2024-01-01T00:00:00Z",
        },
        "chp@healthcare.local": {
            "id": str(uuid4()),
            "email": "chp@healthcare.local",
            "password": "chp123",
            "first_name": "CHP",
            "last_name": "Administrator",
            "role_id": "CHP Admin",
            "organization_id": MOCK_ORG_ID,
            "is_active": True,
            "is_superuser": False,
            "mfa_enabled": False,
            "created_at": "2024-01-01T00:00:00Z",
        },
        "distributor2@healthcare.local": {
            "id": str(uuid4()),
            "email": "distributor2@healthcare.local",
            "password": "distributor123",
            "first_name": "Regional",
            "last_name": "Distributor",
            "role_id": "Distributor",
            "organization_id": MOCK_ORG_ID,
            "is_active": True,
            "is_superuser": False,
            "mfa_enabled": False,
            "created_at": "2024-01-01T00:00:00Z",
        },
        "sales@healthcare.local": {
            "id": str(uuid4()),
            "email": "sales@healthcare.local",
            "password": "sales123",
            "first_name": "Sales",
            "last_name": "Representative",
            "role_id": "Sales",
            "organization_id": MOCK_ORG_ID,
            "is_active": True,
            "is_superuser": False,
            "mfa_enabled": False,
            "created_at": "2024-01-01T00:00:00Z",
        },
        "logistics@healthcare.local": {
            "id": str(uuid4()),
            "email": "logistics@healthcare.local",
            "password": "logistics123",
            "first_name": "Shipping",
            "last_name": "Logistics",
            "role_id": "Shipping and Logistics",
            "organization_id": MOCK_ORG_ID,
            "is_active": True,
            "is_superuser": False,
            "mfa_enabled": False,
            "created_at": "2024-01-01T00:00:00Z",
        }
    }

    @classmethod
    def is_development_mode(cls) -> bool:
        """
        Check if we're in development mode.
        Only allow mock authentication in development.
        """
        environment = os.getenv("ENVIRONMENT", "production").lower()
        debug = os.getenv("DEBUG", "false").lower() == "true"

        return environment in ["development", "dev", "local"] or debug

    @classmethod
    def authenticate_mock_user(
        cls, email: str, password: str
    ) -> Optional[Dict[str, Any]]:
        """
        Authenticate a user against the mock user database.

        Args:
            email: User's email address
            password: User's password

        Returns:
            User data dict if authentication successful, None otherwise

        Note:
            This method only works in development mode for security.
        """
        # Security check - only work in development
        if not cls.is_development_mode():
            logger.warning(
                "Mock authentication attempted in non-development environment"
            )
            return None

        logger.info(f"Mock authentication attempt for: {email}")

        # Get user from mock database
        user_data = cls.MOCK_USERS.get(email)

        if not user_data:
            logger.info(f"Mock user not found: {email}")
            return None

        # Simple password check (development only!)
        if user_data["password"] != password:
            logger.info(f"Mock authentication failed for: {email}")
            return None

        # Return user data without password
        authenticated_user = {
            k: v for k, v in user_data.items() if k != "password"
        }

        logger.info(
            f"Mock authentication successful for: {email} "
            f"with role: {authenticated_user['role_id']}"
        )
        return authenticated_user

    @classmethod
    def get_mock_user(cls, email: str) -> Optional[Dict[str, Any]]:
        """
        Get mock user data by email (without password).

        Args:
            email: User's email address

        Returns:
            User data dict if found, None otherwise
        """
        if not cls.is_development_mode():
            return None

        user_data = cls.MOCK_USERS.get(email)
        if not user_data:
            return None

        # Return user data without password
        return {k: v for k, v in user_data.items() if k != "password"}

    @classmethod
    def get_mock_users_info(cls) -> Dict[str, str]:
        """
        Get information about available mock users for development.

        Returns:
            Dictionary with user emails and their roles
        """
        if not cls.is_development_mode():
            return {}

        return {
            email: (
                f"{data['first_name']} {data['last_name']} "
                f"({data['role_id']})"
            )
            for email, data in cls.MOCK_USERS.items()
        }

    @classmethod
    def get_mock_credentials(cls) -> Dict[str, Dict[str, str]]:
        """
        Get mock user credentials for development documentation.

        Returns:
            Dictionary with emails and passwords for development use
        """
        if not cls.is_development_mode():
            return {}

        return {
            email: {
                "email": email,
                "password": data["password"],
                "role": data["role_id"]
            }
            for email, data in cls.MOCK_USERS.items()
        }


# Create singleton instance
mock_auth_service = MockAuthService()
