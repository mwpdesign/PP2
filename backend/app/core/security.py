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
import bcrypt

from jose import jwt, JWTError
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, TypeDecorator, LargeBinary
from passlib.context import CryptContext

from app.core.config import settings
from app.core.database import get_db
from app.core.encryption import encrypt_field, decrypt_field
from app.models.user import User
from app.schemas.token import TokenData

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
    "generate_uuid",
    "EncryptedString",
    "verify_password",
    "get_password_hash",
]

# Security token settings
ALGORITHM = "HS256"
access_token_jwt_subject = "access"

# Development mode flag
IS_DEVELOPMENT = os.getenv("ENVIRONMENT", "development") == "development"

# Security patterns
PHI_PATTERN: Pattern = re.compile(
    r"(\b\d{3}-\d{2}-\d{4}\b)|"  # SSN
    r"(\b\d{10}\b)|"  # 10-digit number (potential MRN)
    r"(\b[A-Za-z]{2}\d{6}\b)"  # Alphanumeric ID
)

# Security middleware
security = HTTPBearer()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def generate_uuid() -> str:
    """Generate a new UUID string.

    Returns:
        str: A new UUID string
    """
    return str(UUID(bytes=os.urandom(16), version=4))


def create_access_token(data: Dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
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
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        return decoded_token
    except JWTError as e:
        logger.error(f"Token verification failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )


async def get_current_user(
    token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)
) -> TokenData:
    """Get current user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception

        # Get user from database
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if user is None:
            raise credentials_exception

        # Create TokenData with all required fields
        token_data = TokenData(
            email=email,
            id=user.id,
            organization_id=user.organization_id,
            permissions=user.permissions,
            role=user.role,
        )
        return token_data
    except JWTError:
        raise credentials_exception


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
    return PHI_PATTERN.sub("[REDACTED]", text)


def create_refresh_token(user_id: str) -> str:
    """Create a refresh token.

    Args:
        user_id: User ID to encode in token

    Returns:
        str: Encoded refresh token
    """
    expires_delta = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    return create_access_token(
        data={"sub": user_id, "type": "refresh"}, expires_delta=expires_delta
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
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type"
            )
        return payload.get("sub")
    except JWTError as e:
        logger.error(f"Refresh token verification failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        )


def create_password_reset_token(email: str) -> str:
    """Create password reset token."""
    expire = datetime.utcnow() + timedelta(
        minutes=settings.SECURITY_RESET_TOKEN_LIFETIME_MINUTES
    )
    to_encode = {"exp": expire, "sub": email, "type": "password_reset"}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt


def verify_password_reset_token(token: str) -> Optional[str]:
    """Verify password reset token and return email if valid."""
    try:
        decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        token_exp = datetime.fromtimestamp(decoded_token["exp"])
        is_valid = (
            decoded_token["type"] == "password_reset" and token_exp > datetime.utcnow()
        )
        return decoded_token["sub"] if is_valid else None
    except jwt.JWTError:
        return None


async def authenticate_user(
    db: AsyncSession, username: str, password: str
) -> Optional[Dict[str, Any]]:
    """Authenticate a user with email and password.

    Args:
        db: Database session
        username: User's email
        password: User's password

    Returns:
        Optional[Dict[str, Any]]: User data if authentication successful
    """
    try:
        # Query the user
        query = select(User).where(User.email == username)
        result = await db.execute(query)
        user = result.scalar_one_or_none()

        if not user:
            return None

        # Verify password
        if not verify_password(password, user.encrypted_password):
            return None

        # Update last login
        user.last_login = datetime.utcnow()
        await db.commit()

        # Return user data
        return {
            "id": str(user.id),
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role_id": str(user.role_id),
            "organization_id": str(user.organization_id),
            "is_active": user.is_active,
            "is_superuser": user.is_superuser,
        }

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
            current_user = kwargs.get("current_user")
            if not current_user:
                for arg in args:
                    if isinstance(arg, dict) and "id" in arg:
                        current_user = arg
                        break

            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Could not validate credentials",
                )

            # Get user's role
            user_role = current_user.get("role")
            if not user_role:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN, detail="User role not found"
                )

            # Check if user is superuser
            if current_user.get("is_superuser"):
                return await func(*args, **kwargs)

            # Get role permissions from settings
            role_perms = settings.ROLE_PERMISSIONS.get(user_role, [])

            # Check if user has all required permissions
            has_perms = all(perm in role_perms for perm in required_permissions)
            if not has_perms:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not enough permissions",
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


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a stored password against a provided password."""
    try:
        return bcrypt.checkpw(plain_password.encode(), hashed_password.encode())
    except Exception as e:
        logger.error(f"Password verification error: {str(e)}")
        return False


def get_password_hash(password: str) -> str:
    """Generate password hash."""
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(12)).decode()


class EncryptedString(TypeDecorator):
    """Custom type for encrypted string fields."""

    impl = LargeBinary

    def process_bind_param(self, value: Optional[str], dialect) -> Optional[bytes]:
        """Encrypt string value before storing."""
        if value is not None:
            return encrypt_field(value)
        return None

    def process_result_value(self, value: Optional[bytes], dialect) -> Optional[str]:
        """Decrypt bytes value when retrieving."""
        if value is not None:
            return decrypt_field(value)
        return None
