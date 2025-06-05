#!/usr/bin/env python3
"""
Create admin@healthcare.local user for authentication system.
"""

import asyncio
from uuid import UUID
from sqlalchemy import select
from passlib.context import CryptContext

from app.core.database import async_session_factory, init_db
from app.models import User, Role, Organization

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def create_admin_user():
    """Create admin@healthcare.local user."""
    print("Creating admin@healthcare.local user...")

    # Initialize database
    await init_db()

    async with async_session_factory() as session:
        try:
            # Check if user already exists
            query = select(User).where(User.email == "admin@healthcare.local")
            result = await session.execute(query)
            existing_user = result.scalar_one_or_none()

            if existing_user:
                print(f"User already exists: {existing_user.email}")
                return

            # Get organization
            org_query = select(Organization).where(
                Organization.name == "Healthcare Provider Network"
            )
            org_result = await session.execute(org_query)
            organization = org_result.scalar_one_or_none()

            if not organization:
                print("❌ Organization not found")
                return

            # Get Admin role
            role_query = select(Role).where(
                Role.name == "Admin",
                Role.organization_id == organization.id
            )
            role_result = await session.execute(role_query)
            admin_role = role_result.scalar_one_or_none()

            if not admin_role:
                print("❌ Admin role not found")
                return

            # Create admin user
            admin_user = User(
                id=UUID("21bebfe9-a6a9-4208-a623-87db7ca8d935"),
                email="admin@healthcare.local",
                username="admin_healthcare",  # Different username to avoid conflict
                encrypted_password=pwd_context.hash("admin123"),
                first_name="Admin",
                last_name="User",
                organization_id=organization.id,
                role_id=admin_role.id,
                is_active=True,
                is_superuser=True,
                mfa_enabled=False,
                force_password_change=False,
                failed_login_attempts=0,
            )

            session.add(admin_user)
            await session.commit()

            print("✅ Created admin@healthcare.local user successfully!")
            print("Credentials: admin@healthcare.local / admin123")

        except Exception as e:
            print(f"❌ Error creating admin user: {str(e)}")
            await session.rollback()
            raise


if __name__ == "__main__":
    asyncio.run(create_admin_user())