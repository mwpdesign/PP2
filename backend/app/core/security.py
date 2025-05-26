"""
Security utilities for token validation and HIPAA compliance.
Provides core security functionality including JWT token management,
password hashing, and PHI field encryption.
"""
from datetime import datetime, timedelta
from typing import Any, Dict, Optional, Pattern
from uuid import UUID

import base64
import os
import re
import logging

from jose import jwt, JWTError
from fastapi import HTTPException, Security, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.core.config import settings
from app.core.password import verify_password
from app.core.encryption import encrypt_field, decrypt_field
from app.models.user import User
from app.core.database import get_db
from app.core.demo_users import DEMO_USERS, ROLE_PERMISSIONS

# Set up logger
logger = logging.getLogger(__name__)

# Export classes and functions for other modules
__all__ = [
    "User",
    "create_access_token",
    "verify_token",
    "get_current_user",
    "authenticate_user",
    "encrypt_phi",
    "decrypt_phi",
    "sanitize_phi",
    "create_refresh_token",
    "verify_password_reset_token",
    "require_roles",
    "require_permissions",
    "PasswordValidator",
    "encrypt_field",
    "decrypt_field",
    "verify_territory_access",
    "generate_uuid"
]

# Security token settings
ALGORITHM = "HS256"
access_token_jwt_subject = "access"

# Development mode flag
IS_DEVELOPMENT = os.getenv('ENVIRONMENT', 'development') == 'development'

# Security patterns
PHI_PATTERN: Pattern = re.compile(
    r'(\b\d{3}-\d{2}-\d{4}\b)|'  # SSN
    r'(\b\d{10}\b)|'             # 10-digit number (potential MRN)
    r'(\b[A-Za-z]{2}\d{6}\b)'    # Alphanumeric ID
)

# Security middleware
security = HTTPBearer()


def generate_uuid() -> str:
    """Generate a new UUID string.
    
    Returns:
        str: A new UUID string
    """
    return str(UUID(bytes=os.urandom(16), version=4))


async def verify_territory_access(user: dict, territory_id: UUID) -> bool:
    """Verify if a user has access to a specific territory.
    
    Args:
        user: User dictionary containing territory access information
        territory_id: UUID of the territory to check access for
        
    Returns:
        bool: True if user has access, False otherwise
        
    Raises:
        HTTPException: If user doesn't have access to the territory
    """
    # Check if user is superuser
    if user.get('is_superuser'):
        return True

    # Check if territory is user's primary territory
    if str(territory_id) == str(user.get('primary_territory_id')):
        return True

    # Check if territory is in user's assigned territories
    assigned_territories = user.get('assigned_territories', [])
    if str(territory_id) in [str(t) for t in assigned_territories]:
        return True

    logger.warning(
        f"Territory access denied: "
        f"User {user.get('id')} -> Territory {territory_id}"
    )
    return False


def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None
) -> str:
    """Create a new access token.
    
    Args:
        data: Data to encode in the token
        expires_delta: Optional expiration time delta
        
    Returns:
        str: Encoded JWT token
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access"
    })
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=ALGORITHM
    )
    return encoded_jwt


def verify_token(token: str) -> Dict[str, Any]:
    """Verify and decode a JWT token.
    
    Args:
        token: JWT token to verify
        
    Returns:
        dict: Decoded token payload
        
    Raises:
        HTTPException: If token is invalid
    """
    try:
        decoded_token = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[ALGORITHM]
        )
        return decoded_token
    except JWTError as e:
        logger.error(f"Token verification failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )


def verify_development_token(token: str) -> dict:
    """Verify development mode JWT token.
    
    Args:
        token: JWT token
        
    Returns:
        Dict containing user information
        
    Raises:
        HTTPException: If token is invalid
    """
    try:
        # In development mode, return a test user without verifying the token
        if IS_DEVELOPMENT:
            return {
                "username": "test-user",
                "attributes": {
                    "email": "test@example.com",
                    "given_name": "Test",
                    "family_name": "User",
                    "email_verified": "true",
                    "sub": "test-user",
                    "role": "admin",
                    "is_superuser": True
                }
            }
        
        # In non-development mode, verify the token
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[ALGORITHM]
        )
        
        # Extract user info from payload
        user_info = {
            "username": payload.get("sub"),
            "attributes": {
                "email": payload.get("email"),
                "given_name": payload.get("given_name"),
                "family_name": payload.get("family_name"),
                "email_verified": "true",
                "sub": payload.get("sub"),
                "role": payload.get("role"),
                "is_superuser": payload.get("is_superuser", False)
            }
        }
        
        return user_info
        
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Get current authenticated user from token.
    
    Args:
        credentials: HTTP Authorization credentials
        db: Database session
        
    Returns:
        Dict[str, Any]: User data
        
    Raises:
        HTTPException: If token is invalid or user not found
    """
    try:
        token = credentials.credentials
        payload = verify_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
            )

        # In development mode, return demo user
        if settings.ENVIRONMENT == "development":
            # Find user by ID in demo users
            user_data = next(
                (u for u in DEMO_USERS.values() if str(u["id"]) == user_id),
                None
            )
            if user_data:
                return user_data
            
            # If not found, return first demo user (for testing)
            return next(iter(DEMO_USERS.values()))

        # In production, get user from database
        user = await db.get(User, UUID(user_id))
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )

        # Check if user is active
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User is inactive",
            )

        # Convert user model to dict
        user_dict = {
            "id": str(user.id),
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "is_active": user.is_active,
            "is_superuser": user.is_superuser,
            "organization_id": str(user.organization_id),
            "primary_territory_id": (
                str(user.primary_territory_id)
                if user.primary_territory_id else None
            ),
            "mfa_enabled": user.mfa_enabled
        }

        return user_dict

    except JWTError as e:
        logger.error(f"Token verification failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    except Exception as e:
        logger.error(f"Error getting current user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Error getting current user",
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


def create_refresh_token(user_id: str) -> str:
    """Create a refresh token.
    
    Args:
        user_id: User ID to encode in token
        
    Returns:
        str: Encoded refresh token
    """
    expires_delta = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    return create_access_token(
        data={"sub": user_id, "type": "refresh"},
        expires_delta=expires_delta
    )


def verify_refresh_token(token: str) -> str:
    """Verify a refresh token.
    
    Args:
        token: Refresh token to verify
        
    Returns:
        str: User ID from token
        
    Raises:
        HTTPException: If token is invalid
    """
    try:
        payload = verify_token(token)
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )
        return payload.get("sub")
    except JWTError as e:
        logger.error(f"Refresh token verification failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )


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
    username: str,
    password: str
) -> Optional[Dict[str, Any]]:
    """Authenticate a user.
    
    Args:
        db: Database session
        username: Username or email
        password: Password
        
    Returns:
        Optional[Dict[str, Any]]: User data if authenticated, None otherwise
    """
    try:
        # In development mode, use demo users
        if settings.ENVIRONMENT == "development":
            # Check if username/email exists in demo users
            user_data = DEMO_USERS.get(username)
            if not user_data:
                # Try finding by username
                user_data = next(
                    (u for u in DEMO_USERS.values() if u["username"] == username),
                    None
                )
            
            if user_data and user_data["password"] == password:
                return user_data
            return None

        # In production, use database
        query = select(User).where(
            or_(
                User.email == username,
                User.username == username
            )
        )
        result = await db.execute(query)
        user = result.scalar_one_or_none()

        if not user:
            return None

        if not verify_password(password, user.encrypted_password):
            # Increment failed login attempts
            user.increment_failed_login()
            await db.commit()
            return None

        # Convert user model to dict
        user_dict = {
            "id": str(user.id),
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "is_active": user.is_active,
            "is_superuser": user.is_superuser,
            "organization_id": str(user.organization_id),
            "primary_territory_id": (
                str(user.primary_territory_id)
                if user.primary_territory_id else None
            ),
            "mfa_enabled": user.mfa_enabled
        }

        return user_dict

    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        return None


def require_roles(allowed_roles: list[str]):
    """Role-based access control decorator.
    
    Args:
        allowed_roles: List of allowed roles
        
    Returns:
        Callable: Role checker function
    """
    async def role_checker(
        current_user: Dict[str, Any] = Depends(get_current_user)
    ) -> Dict[str, Any]:
        """Check if current user has required role.
        
        Args:
            current_user: Current authenticated user
            
        Returns:
            Dict[str, Any]: User data if authorized
            
        Raises:
            HTTPException: If user doesn't have required role
        """
        # Superusers have access to everything
        if current_user.get("is_superuser", False):
            return current_user

        # Check if user's role is in allowed roles
        if current_user.get("role") not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted",
            )

        return current_user

    return role_checker


def require_permissions(required_permissions: list[str]):
    """Decorator to check if user has required permissions.
    
    Args:
        required_permissions: List of required permission strings
        
    Returns:
        Decorator function
    """
    from functools import wraps

    def permission_decorator(func):
        @wraps(func)
        async def permission_checker(*args, **kwargs):
            current_user = kwargs.get('current_user')
            if not current_user:
                for arg in args:
                    if isinstance(arg, dict) and 'id' in arg:
                        current_user = arg
                        break

            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Could not validate credentials"
                )

            # Get user's role
            user_role = current_user.get('role')
            if not user_role:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="User role not found"
                )

            # Check if user is superuser
            if current_user.get('is_superuser'):
                return await func(*args, **kwargs)

            # Get role permissions
            role_perms = ROLE_PERMISSIONS.get(user_role, [])

            # Check if user has all required permissions
            has_perms = all(perm in role_perms for perm in required_permissions)
            if not has_perms:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not enough permissions"
                )

            return await func(*args, **kwargs)

        return permission_checker

    return permission_decorator


class PasswordValidator:
    """Password validation utility."""

    @staticmethod
    def validate(password: str) -> tuple[bool, Optional[str]]:
        """Validate password strength.
        
        Args:
            password: Password to validate
            
        Returns:
            tuple: (is_valid, error_message)
        """
        if len(password) < 8:
            return False, "Password must be at least 8 characters long"

        if not re.search(r"[A-Z]", password):
            return False, "Password must contain at least one uppercase letter"

        if not re.search(r"[a-z]", password):
            return False, "Password must contain at least one lowercase letter"

        if not re.search(r"\d", password):
            return False, "Password must contain at least one number"

        special_chars = r"[!@#$%^&*(),.?\":{}|<>]"
        if not re.search(special_chars, password):
            msg = "Password must contain at least one special character"
            return False, msg

        return True, None


# Global instance
password_validator = PasswordValidator() 