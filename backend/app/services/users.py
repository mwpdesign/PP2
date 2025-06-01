"""User service for managing users."""

from typing import List, Optional
from uuid import UUID
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserPreferences
from app.core.password import get_password_hash


class UserService:
    """Service for user-related operations."""

    def __init__(self, db: AsyncSession):
        """Initialize service with database session.

        Args:
            db: Database session
        """
        self.db = db

    async def create_user(self, user_data: UserCreate, created_by_id: UUID) -> User:
        """Create a new user.

        Args:
            user_data: User creation data
            created_by_id: ID of user creating this user

        Returns:
            User: Created user object

        Raises:
            ValueError: If user already exists
        """
        # Check if user already exists
        result = await self.db.execute(
            select(User).where(
                or_(User.email == user_data.email, User.username == user_data.username)
            )
        )
        existing_user = result.scalar_one_or_none()

        if existing_user:
            if existing_user.email == user_data.email:
                raise ValueError("Email already registered")
            else:
                raise ValueError("Username already taken")

        # Create new user
        db_user = User(
            email=user_data.email,
            username=user_data.username,
            encrypted_password=get_password_hash(user_data.password),
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            organization_id=user_data.organization_id,
            role_id=user_data.role_id,
            security_groups=user_data.security_groups,
            mfa_enabled=user_data.mfa_enabled,
            is_active=user_data.is_active,
            is_superuser=user_data.is_superuser,
            created_by=created_by_id,
        )

        self.db.add(db_user)
        await self.db.commit()
        await self.db.refresh(db_user)

        return db_user

    async def get_user(self, user_id: UUID) -> Optional[User]:
        """Get user by ID.

        Args:
            user_id: User ID

        Returns:
            Optional[User]: User object if found
        """
        return await self.db.get(User, user_id)

    async def get_users(
        self, organization_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[User]:
        """Get users for an organization.

        Args:
            organization_id: Organization ID
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List[User]: List of users
        """
        result = await self.db.execute(
            select(User)
            .where(User.organization_id == organization_id)
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def update_user(
        self, user_id: UUID, user_data: UserUpdate, updated_by_id: UUID
    ) -> User:
        """Update user data.

        Args:
            user_id: User ID
            user_data: Update data
            updated_by_id: ID of user making the update

        Returns:
            User: Updated user object

        Raises:
            ValueError: If user not found
        """
        user = await self.get_user(user_id)
        if not user:
            raise ValueError("User not found")

        # Update user fields
        for field, value in user_data.dict(exclude_unset=True).items():
            if field == "password" and value:
                user.encrypted_password = get_password_hash(value)
            else:
                setattr(user, field, value)

        user.updated_by = updated_by_id
        await self.db.commit()
        await self.db.refresh(user)

        return user

    async def delete_user(self, user_id: UUID) -> None:
        """Delete a user.

        Args:
            user_id: User ID to delete

        Raises:
            ValueError: If user not found
        """
        user = await self.get_user(user_id)
        if not user:
            raise ValueError("User not found")

        await self.db.delete(user)
        await self.db.commit()

    async def update_user_preferences(
        self, user_id: UUID, preferences: UserPreferences, updated_by_id: UUID
    ) -> User:
        """Update user preferences.

        Args:
            user_id: User ID
            preferences: New preferences
            updated_by_id: ID of user making the update

        Returns:
            User: Updated user object

        Raises:
            ValueError: If user not found
        """
        user = await self.get_user(user_id)
        if not user:
            raise ValueError("User not found")

        # Update preferences
        user.preferences = preferences.dict()
        user.updated_by = updated_by_id

        await self.db.commit()
        await self.db.refresh(user)

        return user

    async def get_user_by_email(self, email: str) -> User:
        """Get user by email.

        Args:
            email: User email

        Returns:
            User: User object
        """
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_user_by_username(self, username: str) -> User:
        """Get user by username.

        Args:
            username: Username

        Returns:
            User: User object
        """
        result = await self.db.execute(select(User).where(User.username == username))
        return result.scalar_one_or_none()

    async def update_user_password(self, user: User, new_password: str) -> User:
        """Update user password.

        Args:
            user: User object
            new_password: New password

        Returns:
            User: Updated user object
        """
        user.set_password(new_password)
        await self.db.commit()
        await self.db.refresh(user)
        return user
