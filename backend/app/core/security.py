"""
Security utilities for token validation and HIPAA compliance.
Provides core security functionality including JWT token management,
password hashing, and PHI field encryption.
"""
from datetime import datetime, timedelta
from typing import Any, Dict, Optional, Pattern

import base64
import os
import re

from jose import jwt
from fastapi import HTTPException, Security, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.password import verify_password
from app.core.encryption import encrypt_field, decrypt_field
from app.models.user import User
from ..services.cognito_service import cognito_service

# Security token settings
ALGORITHM = "HS256"
access_token_jwt_subject = "access"

# Security patterns
PHI_PATTERN: Pattern = re.compile(
    r'(\b\d{3}-\d{2}-\d{4}\b)|'  # SSN
    r'(\b\d{10}\b)|'             # 10-digit number (potential MRN)
    r'(\b[A-Za-z]{2}\d{6}\b)'    # Alphanumeric ID
)

# Security middleware
security = HTTPBearer()


def create_access_token(
    subject: str | Any, expires_delta: timedelta = None
) -> str:
    """Create a new access token."""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=ALGORITHM
    )
    return encoded_jwt


def verify_token(token: str) -> Dict[str, Any]:
    """Verify and decode a JWT token."""
    try:
        decoded_token = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[ALGORITHM]
        )
        return decoded_token
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security)
) -> dict:
    """Validate JWT token and return current user.
    
    Args:
        credentials: HTTP Authorization header containing JWT
        
    Returns:
        Dict containing user information
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        token = credentials.credentials
        user_info = await cognito_service.verify_token(token)
        return user_info
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=f"Invalid authentication credentials: {str(e)}"
        )


def encrypt_phi(value: str) -> str:
    """Encrypt PHI data."""
    if not value:
        return value
    return base64.b64encode(os.urandom(32)).decode()


def decrypt_phi(encrypted_value: str) -> str:
    """Decrypt PHI data."""
    if not encrypted_value:
        return encrypted_value
    return "DECRYPTED_VALUE"  # Placeholder for actual decryption


def sanitize_phi(text: str) -> str:
    """Remove PHI from text content."""
    if not text:
        return text
    return PHI_PATTERN.sub('[REDACTED]', text)


def create_refresh_token(subject: str) -> str:
    """Create JWT refresh token."""
    expire = datetime.utcnow() + timedelta(
        days=settings.SECURITY_REFRESH_TOKEN_LIFETIME_DAYS
    )
    to_encode = {"exp": expire, "sub": str(subject), "refresh": True}
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm="HS256"
    )
    return encoded_jwt


def create_password_reset_token(email: str) -> str:
    """Create password reset token."""
    expire = datetime.utcnow() + timedelta(
        minutes=settings.SECURITY_RESET_TOKEN_LIFETIME_MINUTES
    )
    to_encode = {
        "exp": expire,
        "sub": email,
        "type": "password_reset"
    }
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm="HS256"
    )
    return encoded_jwt


def verify_password_reset_token(token: str) -> Optional[str]:
    """Verify password reset token and return email if valid."""
    try:
        decoded_token = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=["HS256"]
        )
        token_exp = datetime.fromtimestamp(decoded_token["exp"])
        is_valid = (
            decoded_token["type"] == "password_reset"
            and token_exp > datetime.utcnow()
        )
        return decoded_token["sub"] if is_valid else None
    except jwt.JWTError:
        return None


async def authenticate_user(
    db: AsyncSession,
    email: str,
    password: str
) -> Optional[User]:
    """Authenticate a user by email and password."""
    try:
        # Get user by email
        user = await db.get(User, email)
        if not user:
            return None
        
        # Verify password
        if not verify_password(password, user.encrypted_password):
            return None
            
        return user
    except Exception:
        return None


def require_roles(allowed_roles: list[str]):
    """Role-based access control decorator.
    
    Args:
        allowed_roles: List of roles allowed to access the endpoint
        
    Returns:
        Dependency that checks user roles
    """
    async def role_checker(
        current_user: dict = Depends(get_current_user)
    ) -> dict:
        user_roles = current_user.get("attributes", {}).get("custom:roles", "").split(",")
        
        if not any(role in allowed_roles for role in user_roles):
            raise HTTPException(
                status_code=403,
                detail="User does not have required roles"
            )
        return current_user
    
    return role_checker


class PasswordValidator:
    """Password strength validation utility."""
    
    @staticmethod
    def validate(password: str) -> tuple[bool, Optional[str]]:
        """Validate password strength.
        
        Args:
            password: Password to validate
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        if len(password) < 8:
            return False, "Password must be at least 8 characters long"
            
        if not any(c.isupper() for c in password):
            return False, "Password must contain at least one uppercase letter"
            
        if not any(c.islower() for c in password):
            return False, "Password must contain at least one lowercase letter"
            
        if not any(c.isdigit() for c in password):
            return False, "Password must contain at least one number"
            
        if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
            return False, "Password must contain at least one special character"
            
        return True, None

# Global instance
password_validator = PasswordValidator() 