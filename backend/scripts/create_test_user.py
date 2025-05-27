"""Create a test admin user."""
import asyncio
from uuid import uuid4
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    async_sessionmaker,
    AsyncSession
)

from app.models.user import User
from app.models.organization import Organization
from app.models.rbac import Role
from app.core.password import get_password_hash


async def create_test_user():
    """Create a test admin user."""
    # Create engine and session
    engine = create_async_engine(
        "postgresql+asyncpg://postgres:password@db:5432/healthcare_ivr",
        echo=True
    )

    async_session = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False
    )

    async with async_session() as db:
        # Create organization
        organization = Organization(
            id=uuid4(),
            name="Healthcare IVR Platform",
            description="Primary Healthcare Organization",
            settings={},
            security_policy={},
            is_active=True
        )
        db.add(organization)
        await db.flush()

        # Create admin role
        role = Role(
            id=uuid4(),
            name="admin",
            description="Administrator role",
            organization_id=organization.id,
            permissions={"*": ["*"]}  # Full access
        )
        db.add(role)
        await db.flush()

        # Create admin user
        user = User(
            id=uuid4(),
            username='admin',
            email='admin@example.com',
            encrypted_password=get_password_hash('Admin123!'),
            first_name='Admin',
            last_name='User',
            role_id=role.id,
            is_superuser=True,
            organization_id=organization.id,
            is_active=True
        )
        db.add(user)
        await db.commit()
        print("Test admin user created successfully!")


if __name__ == "__main__":
    asyncio.run(create_test_user())