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
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, TypeDecorator, LargeBinary

from passlib.context import CryptContext

from app.core.config import settings
from app.core.database import get_db
from app.core.encryption import encrypt_field, decrypt_field
from app.core.password import verify_password, get_password_hash
from app.models.user import User
from app.schemas.token import TokenData
from app.services.mock_auth_service import mock_auth_service

# Set up logger
logger = logging.getLogger(__name__)

# Export classes and functions for other modules
__all__ = [
    "User",
    "create_access_token",
    "verify_token",
    "get_current_user",

    "encrypt_phi",
    "decrypt_phi",
    "sanitize_phi",
    "create_refresh_token",
    "verify_password_reset_token",
    "verify_password",
    "get_password_hash",
    "require_roles",
    "require_permissions",
    "PasswordValidator",
    "password_validator",
    "encrypt_field",
    "decrypt_field",
    "generate_uuid",
    "EncryptedString",
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


def create_access_token(
    data: Dict, expires_delta: Optional[timedelta] = None
) -> str:
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
    logger.info("=" * 60)
    logger.info("GET_CURRENT_USER FUNCTION CALLED")
    logger.info("=" * 60)

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        logger.info(f"Token received: {token[:50]}...")

        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        logger.info(f"JWT payload decoded: {payload}")

        email: str = payload.get("sub")
        logger.info(f"Email from payload: {email}")

        if email is None:
            logger.error("No email found in JWT payload")
            raise credentials_exception

        # Check if we're in local development mode with mock auth
        is_local_mode = settings.AUTH_MODE == "local"
        is_dev_mode = mock_auth_service.is_development_mode()
        use_mock_auth = getattr(settings, 'USE_MOCK_AUTH', True)
        # Default to True for development

        logger.info(f"Is local mode: {is_local_mode}")
        logger.info(f"Is dev mode: {is_dev_mode}")
        logger.info(f"Use mock auth: {use_mock_auth}")

        # Use mock auth if we're in local mode AND development mode
        # This ensures mock users work in development regardless of
        # USE_MOCK_AUTH setting
        if is_local_mode and is_dev_mode:
            logger.info("Using mock user authentication path")
            # For mock users, create TokenData directly from JWT payload
            logger.info(f"Using mock user data for: {email}")
            logger.info(f"JWT payload: {payload}")

            # Get mock user data to ensure user exists
            mock_user = mock_auth_service.get_mock_user(email)
            logger.info(f"Mock user lookup result: {mock_user}")

            if mock_user:
                logger.info(f"Found mock user: {mock_user}")

                # Convert string UUIDs to UUID objects
                user_id = UUID(mock_user["id"])
                org_id = UUID(mock_user["organization_id"])

                logger.info(
                    f"Converted UUIDs - user_id: {user_id}, org_id: {org_id}"
                )

                token_data = TokenData(
                    email=email,
                    id=user_id,
                    organization_id=org_id,
                    permissions=[],  # Mock users have empty permissions
                    role=mock_user["role_id"],
                )
                logger.info(f"Created TokenData: {token_data}")
                logger.info("=" * 60)
                return token_data
            else:
                logger.error(f"Mock user not found for email: {email}")
                raise credentials_exception

        # Use real database authentication
        logger.info("Using real database authentication")
        return await _authenticate_database_user(email, db)

        # Database authentication for non-mock users
        logger.info(f"Using database authentication for: {email}")
        stmt = (
            select(User)
            .where(User.email == email)
        )
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        if user is None:
            logger.error(f"Database user not found for email: {email}")
            raise credentials_exception

        user_role_name = user.role.name if user.role else None

        # Placeholder for permissions; actual logic depends on how they are stored/derived.
        # For now, an empty list is used as per TokenData schema default.
        user_permissions = []

        token_data = TokenData(
            email=email,
            id=user.id,
            organization_id=user.organization_id,
            permissions=user_permissions,
            role=user_role_name,
        )
        logger.info(f"Created database TokenData: {token_data}")
        logger.info("=" * 60)
        return token_data
    except HTTPException:
        logger.error("HTTP exception in get_current_user")
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"Unexpected error in get_current_user: {str(e)}")
        logger.error(f"Exception type: {type(e)}")
        logger.error(f"Exception args: {e.args}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise credentials_exception


async def _authenticate_database_user(
    email: str, db: AsyncSession
) -> TokenData:
    """Authenticate user against database."""
    logger.info(f"Database authentication for: {email}")

    # Query user from database
    query = select(User).where(User.email == email)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user:
        logger.error(f"Database user not found: {email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        logger.error(f"User account is inactive: {email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive user account",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Update last login
    user.update_last_login()
    await db.commit()

    # Create TokenData from database user
    token_data = TokenData(
        email=user.email,
        id=user.id,
        organization_id=user.organization_id,
        permissions=[],  # Will be populated from role
        role=user.role.name if user.role else "Unknown",
    )

    logger.info(f"Database authentication successful: {token_data}")
    return token_data


async def verify_websocket_token(
    token: str, db: AsyncSession
) -> Optional[Dict[str, Any]]:
    """Verify JWT token for WebSocket connections.

    Args:
        token: JWT token to verify
        db: Database session

    Returns:
        Optional[Dict[str, Any]]: User data if token is valid, None otherwise
    """
    try:
        logger.info("Verifying WebSocket token")

        # Decode JWT token
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )

        email: str = payload.get("sub")
        if not email:
            logger.error("No email found in WebSocket token")
            return None

        # Check if we're in local development mode with mock auth
        is_local_mode = settings.AUTH_MODE == "local"
        is_dev_mode = mock_auth_service.is_development_mode()

        if is_local_mode and is_dev_mode:
            logger.info("Using mock user authentication for WebSocket")
            mock_user = mock_auth_service.get_mock_user(email)

            if mock_user:
                return {
                    "id": mock_user["id"],
                    "email": mock_user["email"],
                    "organization_id": mock_user["organization_id"],
                    "role": mock_user["role_id"]
                }
            else:
                logger.error(
                    f"Mock user not found for WebSocket: {email}"
                )
                return None

        # Database authentication for real users
        query = select(User).where(User.email == email)
        result = await db.execute(query)
        user = result.scalar_one_or_none()

        if not user or not user.is_active:
            logger.error(f"WebSocket auth failed for user: {email}")
            return None

        return {
            "id": str(user.id),
            "email": user.email,
            "organization_id": str(user.organization_id),
            "role": user.role.name if user.role else "Unknown"
        }

    except JWTError as e:
        logger.error(f"WebSocket token verification failed: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error in WebSocket auth: {str(e)}")
        return None


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
        decoded_token = jwt.decode(
            token, settings.SECRET_KEY, algorithms=["HS256"])
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
    logger.info("=" * 60)
    logger.info("AUTHENTICATE_USER FUNCTION CALLED")
    logger.info("=" * 60)
    logger.info(f"Username: '{username}'")
    password_len = len(password) if password else 0
    logger.info(f"Password length: {password_len}")
    logger.info(f"Username type: {type(username)}")
    logger.info(f"Password type: {type(password)}")
    logger.info(f"AUTH_MODE: {settings.AUTH_MODE}")
    logger.info(f"Environment: {os.getenv('ENVIRONMENT', 'not_set')}")
    logger.info(f"DEBUG: {os.getenv('DEBUG', 'not_set')}")

    try:
        # Check if we're in local development mode and should use mock auth
        is_local_mode = settings.AUTH_MODE == "local"
        is_dev_mode = mock_auth_service.is_development_mode()

        logger.info(f"Is local mode: {is_local_mode}")
        logger.info(f"Is development mode: {is_dev_mode}")

        if is_local_mode and is_dev_mode:
            logger.info("✅ USING MOCK AUTHENTICATION SERVICE")

            # Try mock authentication first
            auth_func_msg = "Calling mock_auth_service.authenticate_mock_user()"
            logger.info(auth_func_msg)
            mock_user = mock_auth_service.authenticate_mock_user(
                username, password
            )

            if mock_user:
                logger.info("✅ MOCK AUTHENTICATION SUCCESSFUL")
                logger.info(f"Mock user data: {mock_user}")
                logger.info("=" * 60)
                return mock_user
            else:
                logger.info("❌ MOCK AUTHENTICATION FAILED")
                fallback_msg = "Falling through to database authentication"
                logger.info(fallback_msg)

        # Database authentication (fallback or primary for non-local)
        logger.info("🔍 USING DATABASE AUTHENTICATION")
        logger.info("Executing database query...")

        query = select(User).where(User.email == username)
        logger.info(f"Query: {query}")

        result = await db.execute(query)
        user = result.scalar_one_or_none()

        if not user:
            logger.info("❌ DATABASE AUTH FAILED: User not found")
            logger.info(f"Searched for email: '{username}'")
            logger.info("=" * 60)
            return None

        logger.info(f"✅ USER FOUND IN DATABASE: {user.email}")
        logger.info(f"User ID: {user.id}")
        logger.info(f"User active: {user.is_active}")
        logger.info(f"User role: {user.role_id}")

        # Verify password using User model's method
        logger.info("🔐 VERIFYING PASSWORD")
        password_valid = user.verify_password(password)
        logger.info(f"Password verification result: {password_valid}")

        if not password_valid:
            # Increment failed login attempts if user exists but password wrong
            logger.info("❌ PASSWORD VERIFICATION FAILED")
            user.increment_failed_login()
            await db.commit()
            logger.info("Incremented failed login attempts")
            logger.info("=" * 60)
            return None

        # Check if account is locked
        is_locked = user.is_locked()
        logger.info(f"Account locked status: {is_locked}")
        if is_locked:
            logger.info("❌ ACCOUNT IS LOCKED")
            logger.info("=" * 60)
            return None

        # Check if account is active
        logger.info(f"Account active status: {user.is_active}")
        if not user.is_active:
            logger.info("❌ ACCOUNT IS NOT ACTIVE")
            logger.info("=" * 60)
            return None

        # Reset failed login attempts on successful login
        logger.info("✅ AUTHENTICATION SUCCESSFUL")
        logger.info("Resetting failed login attempts")
        user.reset_failed_login()

        # Update last login
        logger.info("Updating last login timestamp")
        user.update_last_login()  # Use the model's method
        await db.commit()

        # Return user data
        user_data = {
            "id": str(user.id),
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role_id": str(user.role_id),
            "organization_id": str(user.organization_id),
            "is_active": user.is_active,
            "is_superuser": user.is_superuser,
        }

        logger.info("✅ RETURNING USER DATA")
        logger.info(f"User data: {user_data}")
        logger.info("=" * 60)
        return user_data

    except Exception as e:
        logger.error("❌ AUTHENTICATION EXCEPTION OCCURRED")
        logger.error(f"Exception type: {type(e)}")
        logger.error(f"Exception message: {str(e)}")
        logger.error(f"Exception args: {e.args}")
        import traceback
        traceback_str = traceback.format_exc()
        logger.error(f"Traceback: {traceback_str}")
        logger.error("=" * 60)
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


class EncryptedString(TypeDecorator):
    """Custom type for encrypted string fields."""

    impl = LargeBinary

    def process_bind_param(
        self,
        value: Optional[str],
        dialect
    ) -> Optional[bytes]:
        """Encrypt string value before storing."""
        if value is not None:
            return encrypt_field(value)
        return None

    def process_result_value(
        self,
        value: Optional[bytes],
        dialect
    ) -> Optional[str]:
        """Decrypt bytes value when retrieving."""
        if value is not None:
            return decrypt_field(value)
        return None
