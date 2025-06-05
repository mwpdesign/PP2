"""
Consolidated Authentication Service for Healthcare IVR Platform.

This service provides a single, consistent authentication implementation
with clear development/production separation and proper integration with
existing security infrastructure.
"""

import logging
from datetime import timedelta
from typing import Dict, Optional, Any

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    create_access_token,
    verify_token,
    verify_password
)
from app.services.mock_auth_service import mock_auth_service
from app.services.cognito_service import cognito_service
from app.services.audit_service import get_audit_service, AuditEventType, AuditSeverity
from app.models.user import User
from sqlalchemy import select

logger = logging.getLogger(__name__)


class AuthenticationService:
    """
    Consolidated authentication service that handles all authentication flows
    with environment-based configuration and proper audit integration.
    """

    def __init__(self):
        """Initialize the authentication service."""
        self.logger = logger
        self._validate_configuration()

    def _validate_configuration(self) -> None:
        """Validate authentication configuration on startup."""
        if not settings.SECRET_KEY:
            raise ValueError("SECRET_KEY is required for authentication")

        if settings.AUTH_MODE == "cognito" and settings.USE_COGNITO:
            # Validate Cognito configuration
            required_cognito_vars = [
                "AWS_COGNITO_USER_POOL_ID",
                "AWS_COGNITO_CLIENT_ID"
            ]
            missing_vars = [
                var for var in required_cognito_vars
                if not getattr(settings, var, None)
            ]
            if missing_vars:
                raise ValueError(
                    f"Missing Cognito configuration: {missing_vars}"
                )

    async def authenticate_user(
        self,
        email: str,
        password: str,
        user_type: Optional[str] = None,
        db: Optional[AsyncSession] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Authenticate a user with email and password using environment-based
        configuration.

        Args:
            email: User's email address
            password: User's password
            user_type: Optional user type for additional validation
            db: Database session (required for database authentication)

        Returns:
            User data dictionary if authentication successful, None otherwise
        """
        self.logger.info(f"Authentication attempt for user: {email}")

        # Log authentication attempt for HIPAA audit
        await self._log_auth_event("authentication_attempt", email, user_type)

        try:
            # Determine authentication method based on configuration
            if settings.AUTH_MODE == "cognito" and settings.USE_COGNITO:
                return await self._authenticate_cognito(email, password)
            else:
                return await self._authenticate_local(email, password, db)

        except Exception as e:
            self.logger.error(f"Authentication error for {email}: {str(e)}")
            await self._log_auth_event(
                "authentication_error", email, user_type, str(e)
            )
            return None

    async def _authenticate_cognito(
        self, email: str, password: str
    ) -> Optional[Dict[str, Any]]:
        """Authenticate using AWS Cognito."""
        self.logger.info("Using Cognito authentication")

        try:
            result = await cognito_service.user_login(
                email=email, password=password
            )

            # Verify the token to get user data
            user_data = await cognito_service.verify_token(
                result["access_token"]
            )

            await self._log_auth_event("cognito_authentication_success", email)
            return {
                "email": email,
                "access_token": result["access_token"],
                "refresh_token": result["refresh_token"],
                "user_data": user_data
            }

        except Exception as e:
            self.logger.error(
                f"Cognito authentication failed for {email}: {str(e)}"
            )
            await self._log_auth_event(
                "cognito_authentication_failed", email, None, str(e)
            )
            return None

    async def _authenticate_local(
        self,
        email: str,
        password: str,
        db: Optional[AsyncSession]
    ) -> Optional[Dict[str, Any]]:
        """Authenticate using local authentication (mock or database)."""
        self.logger.info("Using local authentication")

        # Check if we're in development mode and should use mock auth
        if mock_auth_service.is_development_mode():
            self.logger.info("Attempting mock authentication")
            mock_user = mock_auth_service.authenticate_mock_user(
                email, password
            )

            if mock_user:
                self.logger.info(
                    f"Mock authentication successful for: {email}"
                )
                await self._log_auth_event("mock_authentication_success", email)
                return mock_user

        # Fall back to database authentication
        if db is None:
            self.logger.error(
                "Database session required for database authentication"
            )
            return None

        return await self._authenticate_database(email, password, db)

    async def _authenticate_database(
        self,
        email: str,
        password: str,
        db: AsyncSession
    ) -> Optional[Dict[str, Any]]:
        """Authenticate using database."""
        self.logger.info("Using database authentication")

        try:
            # Query user from database
            query = select(User).where(User.email == email)
            result = await db.execute(query)
            user = result.scalar_one_or_none()

            if not user:
                self.logger.info(f"Database user not found: {email}")
                await self._log_auth_event(
                    "database_user_not_found", email
                )
                return None

            if not user.is_active:
                self.logger.info(f"User account is inactive: {email}")
                await self._log_auth_event(
                    "inactive_user_login_attempt", email
                )
                return None

            # Verify password
            if not verify_password(password, user.encrypted_password):
                self.logger.info(f"Invalid password for user: {email}")
                await self._log_auth_event(
                    "invalid_password_attempt", email
                )
                return None

            # Update last login
            from datetime import datetime
            user.last_login = datetime.utcnow()
            await db.commit()

            self.logger.info(
                f"Database authentication successful for: {email}"
            )
            await self._log_auth_event("database_authentication_success", email)

            return {
                "id": str(user.id),
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role_id": user.role_id,
                "organization_id": str(user.organization_id),
                "is_active": user.is_active,
                "is_superuser": user.is_superuser,
            }

        except Exception as e:
            self.logger.error(
                f"Database authentication error for {email}: {str(e)}"
            )
            await self._log_auth_event(
                "database_authentication_error", email, None, str(e)
            )
            return None

    async def validate_token(self, token: str) -> Dict[str, Any]:
        """
        Validate a JWT token with audit logging integration.

        Args:
            token: JWT token to validate

        Returns:
            Decoded token payload

        Raises:
            HTTPException: If token is invalid
        """
        try:
            decoded_token = verify_token(token)

            # Log successful token validation
            email = decoded_token.get("sub")
            await self._log_auth_event("token_validation_success", email)

            return decoded_token

        except Exception as e:
            self.logger.error(f"Token validation failed: {str(e)}")
            await self._log_auth_event(
                "token_validation_failed", None, None, str(e)
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Could not validate credentials",
            )

    async def refresh_session(self, refresh_token: str) -> Dict[str, str]:
        """
        Refresh user session with proper session management.

        Args:
            refresh_token: Refresh token

        Returns:
            New access and refresh tokens

        Raises:
            HTTPException: If refresh token is invalid
        """
        try:
            if settings.AUTH_MODE == "cognito" and settings.USE_COGNITO:
                # Use Cognito refresh
                result = await cognito_service.refresh_token(refresh_token)
                await self._log_auth_event("cognito_token_refresh_success")
                return result
            else:
                # For local authentication, verify refresh token and create
                # new access token
                from app.core.security import verify_refresh_token
                user_id = verify_refresh_token(refresh_token)

                if not user_id:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid refresh token"
                    )

                # Create new access token
                access_token_expires = timedelta(
                    minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
                )
                new_access_token = create_access_token(
                    data={"sub": user_id},
                    expires_delta=access_token_expires
                )

                await self._log_auth_event(
                    "local_token_refresh_success", user_id
                )

                return {
                    "access_token": new_access_token,
                    "token_type": "bearer"
                }

        except Exception as e:
            self.logger.error(f"Token refresh failed: {str(e)}")
            await self._log_auth_event(
                "token_refresh_failed", None, None, str(e)
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not refresh token"
            )

    async def logout_user(self, token: str) -> bool:
        """
        Logout user and invalidate session.

        Args:
            token: User's access token

        Returns:
            True if logout successful
        """
        try:
            # Decode token to get user info
            decoded_token = verify_token(token)
            email = decoded_token.get("sub")

            if settings.AUTH_MODE == "cognito" and settings.USE_COGNITO:
                # Use Cognito logout
                await cognito_service.logout_user(token)
            else:
                # For local authentication, we could maintain a token blacklist
                # For now, we'll just log the logout event
                pass

            await self._log_auth_event("user_logout_success", email)
            self.logger.info(f"User logged out successfully: {email}")
            return True

        except Exception as e:
            self.logger.error(f"Logout failed: {str(e)}")
            await self._log_auth_event(
                "user_logout_failed", None, None, str(e)
            )
            return False

    async def _log_auth_event(
        self,
        event_type: str,
        email: Optional[str] = None,
        user_type: Optional[str] = None,
        error_details: Optional[str] = None
    ) -> None:
        """
        Log authentication events for HIPAA audit compliance.

        Args:
            event_type: Type of authentication event
            email: User email (if available)
            user_type: User type (if available)
            error_details: Error details (if applicable)
        """
        try:
            audit_data = {
                "event_type": event_type,
                "email": email,
                "user_type": user_type,
                "auth_mode": settings.AUTH_MODE,
                "environment": settings.ENVIRONMENT,
            }

            if error_details:
                audit_data["error_details"] = error_details

            audit_service = get_audit_service()
            # Log as security event for authentication activities
            audit_service.log_security_event(
                event_type=AuditEventType.SUSPICIOUS_ACTIVITY,
                severity=AuditSeverity.MEDIUM,
                description=f"Authentication event: {event_type}",
                details=audit_data
            )

        except Exception as e:
            # Don't let audit logging failures break authentication
            self.logger.error(f"Failed to log auth event: {str(e)}")

    def get_authentication_status(self) -> Dict[str, Any]:
        """
        Get current authentication configuration status.

        Returns:
            Dictionary with authentication status information
        """
        return {
            "auth_mode": settings.AUTH_MODE,
            "use_cognito": settings.USE_COGNITO,
            "environment": settings.ENVIRONMENT,
            "mock_auth_available": mock_auth_service.is_development_mode(),
            "cognito_configured": bool(
                getattr(settings, "AWS_COGNITO_USER_POOL_ID", None) and
                getattr(settings, "AWS_COGNITO_CLIENT_ID", None)
            ),
            "secret_key_configured": bool(settings.SECRET_KEY),
        }


# Create singleton instance
authentication_service = AuthenticationService()