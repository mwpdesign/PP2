"""User service for managing user operations."""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status

from app.models.user import User
from app.schemas.auth import UserCreate
from app.core.password import get_password_hash


async def create_user(
    db: AsyncSession,
    user_data: UserCreate,
    cognito_id: str,
) -> User:
    """Create a new user in the database."""
    try:
        # Create new user
        db_user = User(
            username=user_data.email,  # Using email as username for now
            email=user_data.email,
            encrypted_password=get_password_hash(user_data.password),
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            cognito_id=cognito_id,
            mfa_enabled=False,
            # Require password change on first login
            force_password_change=True
        )

        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)

        return db_user

    except IntegrityError as e:
        await db.rollback()
        if "username" in str(e.orig):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered"
            )
        if "email" in str(e.orig):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database integrity error"
        ) 