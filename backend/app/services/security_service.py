"""
Security service for handling authentication and authorization.
"""

from typing import Dict, Optional, Any
from datetime import datetime, timedelta
import logging
from jose import jwt, JWTError
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.models.user import User
from app.core.password import verify_password

# Set up logger
logger = logging.getLogger(__name__)


class SecurityService:
    """Security service for handling authentication and authorization."""

    def __init__(self):
        """Initialize security service."""
        self.algorithm = settings.ALGORITHM
        self.secret_key = settings.SECRET_KEY

    def create_access_token(
        self, data: Dict, expires_delta: Optional[timedelta] = None
    ) -> str:
        """Create JWT access token."""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=15)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(
            to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt

    def verify_token(self, token: str) -> Dict:
        """Verify JWT token."""
        try:
            payload = jwt.decode(
                token,
                self.secret_key,
                algorithms=[self.algorithm]
            )
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

    def verify_phi_access(self, user_data: Dict) -> bool:
        """Verify if user has PHI access."""
        # For now, all authenticated users have PHI access
        # This should be enhanced with proper role-based checks
        return True

    def verify_device_trust(self, user_data: Dict) -> bool:
        """Verify if user's device is trusted."""
        # For now, all devices are trusted
        # This should be enhanced with device fingerprinting
        return True

    async def authenticate_user(
        self, db: AsyncSession, email: str, password: str
    ) -> Optional[Dict[str, Any]]:
        """Authenticate user with email and password.

        Args:
            db: Database session
            email: User's email
            password: User's password

        Returns:
            Optional[Dict[str, Any]]: User data if authentication successful
        """
        try:
            # Query the user
            query = select(User).where(User.email == email)
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


security_service = SecurityService()
