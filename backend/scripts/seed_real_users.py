"""
Seed database with real users for production-ready authentication.
This script creates actual database users to replace mock authentication.
"""

import asyncio
import os
import sys
from datetime import datetime, timezone
from uuid import uuid4, UUID
from sqlalchemy import select
from passlib.context import CryptContext

# Add backend directory to Python path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(backend_dir)

# Import after path setup
from app.core.database import init_db, async_session_factory  # noqa: E402
from app.models.user import User  # noqa: E402
from app.models.organization import Organization  # noqa: E402
from app.models.rbac import Role  # noqa: E402

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Fixed organization ID for consistency with mock auth
MOCK_ORG_ID = "2276e0c1-6a32-470e-b7e7-dcdbb286d76b"

# Helper function for UTC timestamps
def utc_now():
    """Get current UTC timestamp."""
    return datetime.now(timezone.utc)


async def create_organization(session) -> UUID:
    """Create or get the main organization."""
    org_id = UUID(MOCK_ORG_ID)

    # Check if organization exists
    query = select(Organization).where(Organization.id == org_id)
    result = await session.execute(query)
    existing_org = result.scalar_one_or_none()

    if existing_org:
        print(f"Organization already exists: {existing_org.name}")
        return org_id

    # Create new organization
    organization = Organization(
        id=org_id,
        name="Healthcare Provider Network",
        description="Main healthcare provider organization",
        settings={},
        security_policy={},
        is_active=True,
        status="ACTIVE",
        created_at=utc_now(),
        updated_at=utc_now(),
    )

    session.add(organization)
    await session.commit()
    print(f"Created organization: {organization.name}")
    return org_id


async def create_roles(session, org_id: UUID) -> dict:
    """Create all necessary roles."""
    roles_data = [
        {
            "name": "Admin",
            "description": "System administrator with full access",
            "permissions": ["*"]
        },
        {
            "name": "Doctor",
            "description": "Medical provider with patient access",
            "permissions": ["patients:read", "patients:write", "orders:read", "orders:write"]
        },
        {
            "name": "IVR",
            "description": "Interactive Voice Response system operator",
            "permissions": ["ivr:read", "ivr:write", "patients:read"]
        },
        {
            "name": "Master Distributor",
            "description": "Regional distribution management",
            "permissions": ["orders:read", "orders:write", "distribution:manage"]
        },
        {
            "name": "CHP Admin",
            "description": "Community Health Program administrator",
            "permissions": ["chp:manage", "users:read", "reports:read"]
        },
        {
            "name": "Distributor",
            "description": "Local distribution operations",
            "permissions": ["orders:read", "orders:write", "inventory:manage"]
        },
        {
            "name": "Sales",
            "description": "Sales representative tools",
            "permissions": ["sales:read", "sales:write", "customers:read"]
        },
        {
            "name": "Shipping and Logistics",
            "description": "Logistics and shipping operations",
            "permissions": ["orders:read", "orders:write", "shipping:read", "shipping:write"]
        }
    ]

    created_roles = {}

    for role_data in roles_data:
        # Check if role exists
        query = select(Role).where(
            Role.name == role_data["name"],
            Role.organization_id == org_id
        )
        result = await session.execute(query)
        existing_role = result.scalar_one_or_none()

        if existing_role:
            print(f"Role already exists: {existing_role.name}")
            created_roles[role_data["name"]] = existing_role.id
            continue

        # Create new role
        role = Role(
            id=uuid4(),
            name=role_data["name"],
            description=role_data["description"],
            organization_id=org_id,
            permissions=role_data["permissions"],
            created_at=utc_now(),
            updated_at=utc_now(),
        )

        session.add(role)
        created_roles[role_data["name"]] = role.id
        print(f"Created role: {role.name}")

    await session.commit()
    return created_roles


async def create_users(session, org_id: UUID, roles: dict):
    """Create all test users with proper database relationships."""
    users_data = [
        {
            "id": "21bebfe9-a6a9-4208-a623-87db7ca8d935",
            "email": "admin@healthcare.local",
            "username": "admin",
            "password": "admin123",
            "first_name": "Admin",
            "last_name": "User",
            "role_name": "Admin",
            "is_superuser": True,
        },
        {
            "id": "43d8ebd3-efe8-4aee-98b5-0a77ba7003e8",
            "email": "doctor@healthcare.local",
            "username": "doctor",
            "password": "doctor123",
            "first_name": "Dr. John",
            "last_name": "Smith",
            "role_name": "Doctor",
            "is_superuser": False,
        },
        {
            "id": "311e87c4-812e-4f8c-b842-62f4d5cdffbe",
            "email": "ivr@healthcare.local",
            "username": "ivr",
            "password": "ivr123",
            "first_name": "IVR",
            "last_name": "Company",
            "role_name": "IVR",
            "is_superuser": False,
        },
        {
            "id": "baf64777-cf09-4277-8c35-4cf7939f2acd",
            "email": "distributor@healthcare.local",
            "username": "distributor",
            "password": "distributor123",
            "first_name": "Master",
            "last_name": "Distributor",
            "role_name": "Master Distributor",
            "is_superuser": False,
        },
        {
            "id": "de129f89-7a0c-4493-80c7-e2ab32051bbe",
            "email": "chp@healthcare.local",
            "username": "chp",
            "password": "chp123",
            "first_name": "CHP",
            "last_name": "Administrator",
            "role_name": "CHP Admin",
            "is_superuser": False,
        },
        {
            "id": "3b0a4415-08f6-47ae-abff-5e90a554566a",
            "email": "distributor2@healthcare.local",
            "username": "distributor2",
            "password": "distributor123",
            "first_name": "Regional",
            "last_name": "Distributor",
            "role_name": "Distributor",
            "is_superuser": False,
        },
        {
            "id": "f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
            "email": "sales@healthcare.local",
            "username": "sales",
            "password": "sales123",
            "first_name": "Sales",
            "last_name": "Representative",
            "role_name": "Sales",
            "is_superuser": False,
        },
        {
            "id": "a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
            "email": "logistics@healthcare.local",
            "username": "logistics",
            "password": "logistics123",
            "first_name": "Shipping",
            "last_name": "Logistics",
            "role_name": "Shipping and Logistics",
            "is_superuser": False,
        }
    ]

    for user_data in users_data:
                # Check if user exists by email or username
        query = select(User).where(
            (User.email == user_data["email"]) |
            (User.username == user_data["username"])
        )
        result = await session.execute(query)
        existing_user = result.scalar_one_or_none()

        if existing_user:
            print(f"User already exists: {existing_user.email} "
                  f"(username: {existing_user.username})")
            continue

        # Get role ID
        role_id = roles.get(user_data["role_name"])
        if not role_id:
            print(f"Role not found: {user_data['role_name']}")
            continue

        # Create new user
        user = User(
            id=UUID(user_data["id"]),
            email=user_data["email"],
            username=user_data["username"],
            encrypted_password=pwd_context.hash(user_data["password"]),
            first_name=user_data["first_name"],
            last_name=user_data["last_name"],
            organization_id=org_id,
            role_id=role_id,
            is_active=True,
            is_superuser=user_data["is_superuser"],
            mfa_enabled=False,
            force_password_change=False,
            failed_login_attempts=0,
            created_at=utc_now(),
            updated_at=utc_now(),
        )

        session.add(user)
        print(f"Created user: {user.email} ({user_data['role_name']})")

    await session.commit()


async def main():
    """Main seeding function."""
    print("Starting real user database seeding...")

    # Initialize database
    await init_db()

    async with async_session_factory() as session:
        try:
            # Create organization
            org_id = await create_organization(session)

            # Create roles
            roles = await create_roles(session, org_id)

            # Create users
            await create_users(session, org_id, roles)

            print("\n✅ Database seeding completed successfully!")
            print("\nCreated users:")
            print("- admin@healthcare.local / admin123 (Admin)")
            print("- doctor@healthcare.local / doctor123 (Doctor)")
            print("- ivr@healthcare.local / ivr123 (IVR)")
            print("- distributor@healthcare.local / distributor123 (Master Distributor)")
            print("- chp@healthcare.local / chp123 (CHP Admin)")
            print("- distributor2@healthcare.local / distributor123 (Distributor)")
            print("- sales@healthcare.local / sales123 (Sales)")
            print("- logistics@healthcare.local / logistics123 (Shipping and Logistics)")

        except Exception as e:
            print(f"❌ Error during seeding: {str(e)}")
            await session.rollback()
            raise


if __name__ == "__main__":
    asyncio.run(main())