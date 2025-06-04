"""
Authentication routes for user registration, login, and token management.
"""

import logging
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Header
from fastapi.security import (
    HTTPBearer,
    HTTPAuthorizationCredentials,
    OAuth2PasswordRequestForm,
)
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict
import os

from ...services.cognito_service import cognito_service
from ...core.security import (
    get_current_user,
    password_validator,
    create_access_token,
    authenticate_user,
)
from ...services.security_service import security_service
from ...core.database import get_db
from ...core.config import settings
from ...schemas.token import TokenData
from . import models


router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()
logger = logging.getLogger(__name__)


@router.get("/debug/mock-auth")
async def debug_mock_auth():
    """Debug endpoint to test mock authentication service."""
    logger.info("=" * 50)
    logger.info("MOCK AUTH DEBUG ENDPOINT")
    logger.info("=" * 50)

    from app.services.mock_auth_service import mock_auth_service

    # Check environment
    is_dev = mock_auth_service.is_development_mode()
    logger.info(f"Is development mode: {is_dev}")
    logger.info(f"Environment: {os.getenv('ENVIRONMENT', 'not_set')}")
    logger.info(f"Debug: {os.getenv('DEBUG', 'not_set')}")
    logger.info(f"AUTH_MODE: {settings.AUTH_MODE}")

    # Get mock credentials
    mock_creds = mock_auth_service.get_mock_credentials()
    logger.info(f"Mock credentials available: {len(mock_creds)}")

    # Test each mock user
    test_results = {}
    for email, creds in mock_creds.items():
        logger.info(f"Testing mock user: {email}")
        result = mock_auth_service.authenticate_mock_user(
            email, creds['password']
        )
        test_results[email] = {
            "success": result is not None,
            "user_data": result
        }
        logger.info(f"  Result: {'SUCCESS' if result else 'FAILED'}")

    logger.info("=" * 50)

    return {
        "environment": {
            "ENVIRONMENT": os.getenv('ENVIRONMENT', 'not_set'),
            "DEBUG": os.getenv('DEBUG', 'not_set'),
            "AUTH_MODE": settings.AUTH_MODE,
            "is_development_mode": is_dev
        },
        "mock_credentials": mock_creds,
        "test_results": test_results
    }


@router.post("/debug/test-login")
async def debug_test_login(
    email: str,
    password: str,
    db: AsyncSession = Depends(get_db)
):
    """Debug endpoint to test login functionality."""
    try:
        logger.info(f"Debug test login for: {email}")
        user = await authenticate_user(db, email, password)
        if user:
            return {
                "status": "success",
                "message": "Authentication successful",
                "user_data": user
            }
        else:
            return {
                "status": "failed",
                "message": "Authentication failed"
            }
    except Exception as e:
        logger.error(f"Debug test login error: {str(e)}")
        return {
            "status": "error",
            "message": f"Login test failed: {str(e)}"
        }


@router.post("/login", response_model=models.TokenResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """Authenticate user and return tokens."""
    logger.info("=" * 50)
    logger.info("LOGIN REQUEST DETAILS")
    logger.info("=" * 50)
    logger.info(f"Username from form_data: '{form_data.username}'")
    password_provided = 'Yes' if form_data.password else 'No'
    logger.info(f"Password provided: {password_provided}")

    password_length = len(form_data.password) if form_data.password else 0
    logger.info(f"Password length: {password_length}")

    username_length = len(form_data.username) if form_data.username else 0
    logger.info(f"Username length: {username_length}")

    logger.info(f"Username type: {type(form_data.username)}")
    logger.info(f"Password type: {type(form_data.password)}")

    # Check for whitespace issues
    if form_data.username:
        logger.info(f"Username stripped: '{form_data.username.strip()}'")
        has_spaces = form_data.username != form_data.username.strip()
        logger.info(f"Username has leading/trailing spaces: {has_spaces}")

    logger.info(f"AUTH_MODE: {settings.AUTH_MODE}")
    logger.info(f"USE_COGNITO: {settings.USE_COGNITO}")
    logger.info(f"Environment: {os.getenv('ENVIRONMENT', 'not_set')}")
    logger.info("=" * 50)

    try:
        if settings.AUTH_MODE == "cognito" and settings.USE_COGNITO:
            logger.info("Using Cognito authentication")
            # Use Cognito authentication
            result = await cognito_service.user_login(
                email=form_data.username, password=form_data.password
            )
            return models.TokenResponse(**result)
        else:
            logger.info("Using local authentication")
            # Use local authentication - clean the username
            clean_username = (
                form_data.username.strip() if form_data.username else ""
            )
            clean_password = (
                form_data.password.strip() if form_data.password else ""
            )

            logger.info(f"Cleaned username: '{clean_username}'")
            logger.info(f"Cleaned password length: {len(clean_password)}")

            user = await authenticate_user(
                db, clean_username, clean_password
            )
            if not user:
                error_msg = f"Authentication failed for user: {clean_username}"
                logger.error(error_msg)
                logger.error("Available mock users:")
                from app.services.mock_auth_service import mock_auth_service
                mock_creds = mock_auth_service.get_mock_credentials()
                for email, creds in mock_creds.items():
                    password_info = f"password: {creds['password']}"
                    logger.error(f"  - {email} ({password_info})")

                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Incorrect email or password",
                    headers={"WWW-Authenticate": "Bearer"},
                )

            success_msg = (
                f"Authentication successful for user: {clean_username}"
            )
            logger.info(success_msg)
            logger.info(f"User data: {user}")

            # Create access token with role information
            access_token_expires = timedelta(
                minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
            )
            access_token = create_access_token(
                data={
                    "sub": user["email"],
                    "role": user["role_id"],
                    "org": user["organization_id"],
                    "is_superuser": user["is_superuser"],
                },
                expires_delta=access_token_expires,
            )

            token_success_msg = (
                f"Access token created successfully for user: {clean_username}"
            )
            logger.info(token_success_msg)

            return {
                "access_token": access_token,
                "token_type": "bearer",
                "refresh_token": None,  # Local auth doesn't use refresh tokens
            }
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        error_msg = (
            f"Unexpected error during login for {form_data.username}: {str(e)}"
        )
        logger.error(error_msg)
        logger.error(f"Exception type: {type(e)}")
        logger.error(f"Exception args: {e.args}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.get("/test-cognito")
async def test_cognito_connection():
    """Test endpoint to verify Cognito connection."""
    if not settings.USE_COGNITO:
        return {"status": "disabled", "message": "Cognito is not enabled"}

    try:
        client = await cognito_service.cognito.get_client()
        # Test API call that doesn't require authentication
        client.describe_user_pool(
            UserPoolId=cognito_service.cognito.settings.COGNITO_USER_POOL_ID
        )
        return {"status": "success", "message": "Cognito connection working"}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Cognito connection failed: {str(e)}"
        )


@router.post("/register", response_model=dict)
async def register_user(user: models.UserRegistration):
    """Register a new user."""
    # Validate password strength
    is_valid, error_message = password_validator.validate(user.password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_message)

    try:
        if settings.AUTH_MODE == "cognito" and settings.USE_COGNITO:
            result = await cognito_service.user_registration(
                email=user.email,
                password=user.password,
                user_attributes={
                    "given_name": user.first_name,
                    "family_name": user.last_name,
                    "phone_number": user.phone_number,
                },
            )
            return result
        else:
            # Local user registration
            raise HTTPException(
                status_code=501,
                detail="Local user registration not implemented"
            )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/profile", response_model=models.UserProfile)
async def get_profile(current_user: TokenData = Depends(get_current_user)):
    """Get current user profile."""
    logger.info("=" * 50)
    logger.info("PROFILE ENDPOINT CALLED")
    logger.info("=" * 50)

    try:
        logger.info(f"Current user type: {type(current_user)}")
        logger.info(f"Current user data: {current_user}")
        logger.info(f"AUTH_MODE: {settings.AUTH_MODE}")
        logger.info(f"USE_COGNITO: {settings.USE_COGNITO}")

        if settings.AUTH_MODE == "cognito" and settings.USE_COGNITO:
            logger.info("Using Cognito profile logic")
            # For Cognito, current_user would be different structure
            # This is a placeholder for Cognito implementation
            return models.UserProfile(
                email=current_user.email or "",
                first_name="",
                last_name="",
                phone_number="",
                email_verified=True,
                created_at="",
            )
        else:
            logger.info("Using local profile logic")

            # For local/mock users, get additional data from mock service
            if current_user.email:
                from app.services.mock_auth_service import mock_auth_service
                mock_user = mock_auth_service.get_mock_user(current_user.email)

                if mock_user:
                    logger.info(f"Found mock user data: {mock_user}")
                    profile = models.UserProfile(
                        email=current_user.email,
                        first_name=mock_user.get("first_name", ""),
                        last_name=mock_user.get("last_name", ""),
                        phone_number=mock_user.get("phone_number", ""),
                        email_verified=True,
                        created_at=mock_user.get("created_at", ""),
                        role=current_user.role,  # Include role from JWT token
                    )
                else:
                    # Fallback if mock user not found
                    profile = models.UserProfile(
                        email=current_user.email,
                        first_name="",
                        last_name="",
                        phone_number="",
                        email_verified=True,
                        created_at="",
                        role=current_user.role,  # Include role from JWT token
                    )
            else:
                # Fallback if no email
                profile = models.UserProfile(
                    email="",
                    first_name="",
                    last_name="",
                    phone_number="",
                    email_verified=True,
                    created_at="",
                    role=current_user.role if current_user else "",
                )

            logger.info(f"Created profile: {profile}")
            return profile
    except Exception as e:
        logger.error(f"Profile endpoint error: {str(e)}")
        logger.error(f"Exception type: {type(e)}")
        logger.error(f"Exception args: {e.args}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Profile error: {str(e)}")


@router.get("/verify-token")
async def verify_token(token_data: Dict = Depends(get_current_user)):
    """Verify if token is valid and return user data."""
    return {
        "valid": True,
        "user": token_data,
        "phi_access": security_service.verify_phi_access(token_data),
        "device_trusted": security_service.verify_device_trust(token_data),
    }


@router.get("/debug/test-current-user")
async def debug_test_current_user(
    current_user: dict = Depends(get_current_user)
):
    """Debug endpoint to test get_current_user function."""
    try:
        return {
            "status": "success",
            "message": "get_current_user working",
            "current_user": current_user,
            "current_user_type": str(type(current_user))
        }
    except Exception as e:
        logger.error(f"Debug test current user error: {str(e)}")
        return {
            "status": "error",
            "message": f"get_current_user failed: {str(e)}",
            "error_type": str(type(e))
        }


@router.get("/debug/test-token")
async def debug_test_token(authorization: str = Header(None)):
    """Debug endpoint to manually test token decoding."""
    logger.info("=" * 50)
    logger.info("DEBUG TEST TOKEN ENDPOINT")
    logger.info("=" * 50)

    try:
        if not authorization:
            return {"error": "No Authorization header"}

        if not authorization.startswith("Bearer "):
            return {"error": "Invalid Authorization header format"}

        token = authorization.replace("Bearer ", "")
        logger.info(f"Extracted token: {token[:50]}...")

        # Try to decode the token manually
        from jose import jwt
        from app.core.config import settings

        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        logger.info(f"JWT payload: {payload}")

        email = payload.get("sub")
        logger.info(f"Email from token: {email}")

        # Try to get mock user
        from app.services.mock_auth_service import mock_auth_service
        mock_user = mock_auth_service.get_mock_user(email)
        logger.info(f"Mock user: {mock_user}")

        return {
            "status": "success",
            "token_valid": True,
            "payload": payload,
            "mock_user": mock_user
        }

    except Exception as e:
        logger.error(f"Token test error: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return {
            "status": "error",
            "error": str(e),
            "error_type": str(type(e))
        }


# Only enable these endpoints if Cognito is enabled
if settings.AUTH_MODE == "cognito" and settings.USE_COGNITO:

    @router.post("/forgot-password")
    async def forgot_password(request: models.PasswordReset):
        """Initiate password reset process."""
        try:
            result = await cognito_service.initiate_password_reset(
                request.email
            )
            return result
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    @router.post("/reset-password")
    async def reset_password(request: models.PasswordResetConfirm):
        """Complete password reset process."""
        # Validate new password strength
        is_valid, error_message = password_validator.validate(
            request.new_password
        )
        if not is_valid:
            raise HTTPException(status_code=400, detail=error_message)

        try:
            result = await cognito_service.confirm_password_reset(
                email=request.email,
                confirmation_code=request.confirmation_code,
                new_password=request.new_password,
            )
            return result
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    @router.post("/confirm-registration")
    async def confirm_registration(email: str, confirmation_code: str):
        """Confirm user registration with verification code."""
        return await cognito_service.confirm_registration(
            email, confirmation_code
        )

    @router.post("/verify-mfa")
    async def verify_mfa(
        email: str, session: str, mfa_code: str, challenge_name: str
    ):
        """Verify MFA code and complete authentication."""
        return await cognito_service.verify_mfa(
            email, session, mfa_code, challenge_name
        )

    @router.post("/refresh-token")
    async def refresh_token(refresh_token: str):
        """Get new access token using refresh token."""
        return await cognito_service.refresh_token(refresh_token)

    @router.post("/setup-totp")
    async def setup_totp(
        credentials: HTTPAuthorizationCredentials = Depends(security)
    ):
        """Set up TOTP MFA for user."""
        return await cognito_service.setup_totp(credentials.credentials)

    @router.post("/verify-totp-setup")
    async def verify_totp_setup(
        totp_code: str,
        credentials: HTTPAuthorizationCredentials = Depends(security)
    ):
        """Verify TOTP setup with first code."""
        return await cognito_service.verify_totp_setup(
            credentials.credentials, totp_code
        )
