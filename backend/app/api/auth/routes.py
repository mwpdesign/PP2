"""
Authentication routes for user registration, login, and token management.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict

from .cognito_service import CognitoService
from ...core.security import SecurityService, get_current_user

router = APIRouter(prefix="/auth", tags=["authentication"])
security = HTTPBearer()
cognito = CognitoService()
security_service = SecurityService()


@router.post("/register")
async def register(email: str, password: str, attributes: Dict[str, str]):
    """Register a new user."""
    return await cognito.register_user(email, password, attributes)


@router.post("/confirm-registration")
async def confirm_registration(email: str, confirmation_code: str):
    """Confirm user registration with verification code."""
    return await cognito.confirm_registration(email, confirmation_code)


@router.post("/login")
async def login(email: str, password: str):
    """Login user and handle MFA if required."""
    return await cognito.initiate_auth(email, password)


@router.post("/verify-mfa")
async def verify_mfa(
    email: str,
    session: str,
    mfa_code: str,
    challenge_name: str
):
    """Verify MFA code and complete authentication."""
    return await cognito.verify_mfa(
        email,
        session,
        mfa_code,
        challenge_name
    )


@router.post("/refresh-token")
async def refresh_token(refresh_token: str):
    """Get new access token using refresh token."""
    return await cognito.refresh_token(refresh_token)


@router.post("/setup-totp")
async def setup_totp(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Set up TOTP MFA for user."""
    return await cognito.setup_totp(credentials.credentials)


@router.post("/verify-totp-setup")
async def verify_totp_setup(
    totp_code: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Verify TOTP setup with first code."""
    return await cognito.verify_totp_setup(
        credentials.credentials,
        totp_code
    )


@router.post("/forgot-password")
async def forgot_password(email: str):
    """Initiate password reset process."""
    return await cognito.initiate_password_reset(email)


@router.post("/reset-password")
async def reset_password(
    email: str,
    confirmation_code: str,
    new_password: str
):
    """Complete password reset process."""
    return await cognito.complete_password_reset(
        email,
        confirmation_code,
        new_password
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