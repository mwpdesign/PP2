"""
Authentication routes for user registration, login, and token management.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict

from ...services.cognito_service import cognito_service
from ...core.security import get_current_user, password_validator
from . import models

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()


@router.get("/test-cognito")
async def test_cognito_connection():
    """Test endpoint to verify Cognito connection."""
    try:
        client = await cognito_service.cognito.get_client()
        # Test API call that doesn't require authentication
        client.describe_user_pool(
            UserPoolId=cognito_service.cognito.settings.COGNITO_USER_POOL_ID
        )
        return {"status": "success", "message": "Cognito connection working"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Cognito connection failed: {str(e)}"
        )


@router.post("/register", response_model=dict)
async def register_user(user: models.UserRegistration):
    """Register a new user."""
    # Validate password strength
    is_valid, error_message = password_validator.validate(user.password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_message)
    
    try:
        result = await cognito_service.user_registration(
            email=user.email,
            password=user.password,
            user_attributes={
                "given_name": user.first_name,
                "family_name": user.last_name,
                "phone_number": user.phone_number
            }
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login", response_model=models.TokenResponse)
async def login(credentials: models.UserLogin):
    """Authenticate user and return tokens."""
    try:
        result = await cognito_service.user_login(
            email=credentials.email,
            password=credentials.password
        )
        return models.TokenResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.get("/profile", response_model=models.UserProfile)
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Get current user profile."""
    try:
        attributes = current_user["attributes"]
        return models.UserProfile(
            email=attributes.get("email"),
            first_name=attributes.get("given_name"),
            last_name=attributes.get("family_name"),
            phone_number=attributes.get("phone_number"),
            email_verified=attributes.get("email_verified") == "true",
            created_at=attributes.get("sub")
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/forgot-password")
async def forgot_password(request: models.PasswordReset):
    """Initiate password reset process."""
    try:
        result = await cognito_service.initiate_password_reset(request.email)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/reset-password")
async def reset_password(request: models.PasswordResetConfirm):
    """Complete password reset process."""
    # Validate new password strength
    is_valid, error_message = password_validator.validate(request.new_password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_message)
    
    try:
        result = await cognito_service.confirm_password_reset(
            email=request.email,
            confirmation_code=request.confirmation_code,
            new_password=request.new_password
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/confirm-registration")
async def confirm_registration(email: str, confirmation_code: str):
    """Confirm user registration with verification code."""
    return await cognito_service.confirm_registration(email, confirmation_code)


@router.post("/verify-mfa")
async def verify_mfa(
    email: str,
    session: str,
    mfa_code: str,
    challenge_name: str
):
    """Verify MFA code and complete authentication."""
    return await cognito_service.verify_mfa(
        email,
        session,
        mfa_code,
        challenge_name
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
        credentials.credentials,
        totp_code
    )


@router.get("/verify-token")
async def verify_token(token_data: Dict = Depends(get_current_user)):
    """Verify if token is valid and return user data."""
    return {
        "valid": True,
        "user": token_data,
        "phi_access": security_service.verify_phi_access(token_data),
        "device_trusted": security_service.verify_device_trust(token_data)
    } 