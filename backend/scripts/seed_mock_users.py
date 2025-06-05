import asyncio
import logging
import os
import sys
from uuid import UUID

from sqlalchemy import select

# Add the backend directory to Python path for imports
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Now we can import from app
from app.core.database import AsyncSessionLocal, engine  # noqa: E402
from app.models.user import User  # noqa: E402
from app.models.organization import Organization  # noqa: E402
from app.models.rbac import Role  # noqa: E402
from app.models.sensitive_data import SensitiveData  # noqa: E402
from app.services.mock_auth_service import MockAuthService  # noqa: E402

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def seed_mock_users():
    """Seed the database with all mock users from MockAuthService."""
    async with AsyncSessionLocal() as session:
        async with session.begin():
            # Get or create the mock organization
            mock_org_id = UUID(MockAuthService.MOCK_ORG_ID)
            org_query = select(Organization).where(
                Organization.id == mock_org_id
            )
            org_result = await session.execute(org_query)
            org = org_result.scalar_one_or_none()

            if not org:
                logger.info(
                    f"Creating mock organization with ID: {mock_org_id}"
                )
                org = Organization(
                    id=mock_org_id,
                    name="Healthcare Local Development Org",
                    description="Mock organization for local development",
                    is_active=True,
                    status="active"
                )
                session.add(org)
                await session.flush()
            else:
                logger.info(f"Mock organization already exists: {org.name}")

            # Create roles for each unique role_id in mock users
            role_names = set()
            for user_data in MockAuthService.MOCK_USERS.values():
                role_names.add(user_data["role_id"])

            for role_name in role_names:
                role_query = select(Role).where(
                    Role.name == role_name,
                    Role.organization_id == org.id
                )
                role_result = await session.execute(role_query)
                role = role_result.scalar_one_or_none()

                if not role:
                    logger.info(f"Creating role: {role_name}")
                    role = Role(
                        name=role_name,
                        description=f"Mock role for {role_name}",
                        organization_id=org.id,
                        permissions={"mock": ["all"]}
                    )
                    session.add(role)
                    await session.flush()
                else:
                    logger.info(f"Role '{role_name}' already exists")

            # Now create all mock users
            for email, user_data in MockAuthService.MOCK_USERS.items():
                user_id = UUID(user_data["id"])

                # Check if user already exists
                user_query = select(User).where(User.id == user_id)
                user_result = await session.execute(user_query)
                existing_user = user_result.scalar_one_or_none()

                if not existing_user:
                    # Get the role for this user
                    role_query = select(Role).where(
                        Role.name == user_data["role_id"],
                        Role.organization_id == org.id
                    )
                    role_result = await session.execute(role_query)
                    role = role_result.scalar_one()

                    logger.info(f"Creating mock user: {email}")
                    user = User(
                        id=user_id,
                        username=email,
                        email=email,
                        first_name=user_data["first_name"],
                        last_name=user_data["last_name"],
                        role_id=role.id,
                        organization_id=org.id,
                        is_active=user_data["is_active"],
                        is_superuser=user_data["is_superuser"]
                    )
                    # Set password using the mock password
                    user.set_password(user_data["password"])
                    session.add(user)
                    logger.info(
                        f"Created user: {email} with ID: {user_id}"
                    )
                else:
                    logger.info(f"User {email} already exists with ID: {user_id}")

    logger.info("Mock user seeding process finished.")


async def main():
    """Main function to run the seeding process."""
    logger.info("Starting database seeding for mock users...")
    await seed_mock_users()
    await engine.dispose()
    logger.info("Engine disposed. Mock user seeding complete.")


if __name__ == "__main__":
    asyncio.run(main())