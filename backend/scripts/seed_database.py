"""Seed database with initial data for development."""

import asyncio
import json
import os
import sys
from datetime import datetime, timezone
from uuid import uuid4
from sqlalchemy import text
from passlib.context import CryptContext
from app.core.database import init_db, async_session_factory


# Add backend directory to Python path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(backend_dir)


# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# Database configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/healthcare_ivr"
)


# Helper function for UTC timestamps
def utc_now():
    """Get current UTC timestamp."""
    return datetime.now(timezone.utc)


# Sample data
ORGANIZATIONS = [
    {
        "id": uuid4(),
        "name": "Healthcare Provider Network",
        "description": "Network of healthcare providers",
        "settings": json.dumps({}),
        "security_policy": json.dumps({}),
        "is_active": True,
        "status": "ACTIVE",
        "created_at": utc_now(),
        "updated_at": utc_now(),
    },
    {
        "id": uuid4(),
        "name": "Insurance Verification Services",
        "description": "IVR services for insurance verification",
        "settings": json.dumps({}),
        "security_policy": json.dumps({}),
        "is_active": True,
        "status": "ACTIVE",
        "created_at": utc_now(),
        "updated_at": utc_now(),
    },
]


# Create roles with proper organization IDs
ROLES = [
    {
        "id": uuid4(),
        "name": "Root",
        "description": "Root role",
        "organization_id": ORGANIZATIONS[0]["id"],  # Assign to first organization
        "parent_role_id": None,  # Root role has no parent
        "permissions": json.dumps(["*"]),
        "created_at": utc_now(),
        "updated_at": utc_now(),
    },
    {
        "id": uuid4(),
        "name": "Admin",
        "description": "Administrator role",
        "organization_id": ORGANIZATIONS[0]["id"],  # Assign to first organization
        "parent_role_id": None,  # Will be set to root role's ID
        "permissions": json.dumps(
            [
                "create_users",
                "update_users",
                "delete_users",
                "view_users",
                "create_roles",
                "update_roles",
                "delete_roles",
                "view_roles",
            ]
        ),
        "created_at": utc_now(),
        "updated_at": utc_now(),
    },
    {
        "id": uuid4(),
        "name": "Operator",
        "description": "IVR Operator role",
        "organization_id": ORGANIZATIONS[1]["id"],
        "parent_role_id": None,  # Will be set to root role's ID
        "permissions": json.dumps(["ivr.*", "patients.read"]),
        "created_at": utc_now(),
        "updated_at": utc_now(),
    },
]

# Update parent role IDs
ROLES[1]["parent_role_id"] = ROLES[0]["id"]  # Admin role's parent is Root
ROLES[2]["parent_role_id"] = ROLES[0]["id"]  # Operator role's parent is Root

# Create users with proper organization IDs
USERS = [
    {
        "id": uuid4(),
        "organization_id": ORGANIZATIONS[0]["id"],
        "email": "admin@demo.com",
        "username": "admin",
        "encrypted_password": pwd_context.hash("demo123"),
        "first_name": "Admin",
        "last_name": "User",
        "is_active": True,
        "is_superuser": True,
        "role_id": None,  # Will be set to Admin role's ID
        "mfa_enabled": False,
        "force_password_change": False,
        "failed_login_attempts": 0,
        "created_at": utc_now(),
        "updated_at": utc_now(),
    },
    {
        "id": uuid4(),
        "organization_id": ORGANIZATIONS[1]["id"],
        "email": "operator@ivrservice.com",
        "username": "operator",
        "encrypted_password": pwd_context.hash("Operator123!"),
        "first_name": "IVR",
        "last_name": "Operator",
        "is_active": True,
        "is_superuser": False,
        "role_id": None,  # Will be set to Operator role's ID
        "mfa_enabled": False,
        "force_password_change": False,
        "failed_login_attempts": 0,
        "created_at": utc_now(),
        "updated_at": utc_now(),
    },
]

# Update user role IDs
USERS[0]["role_id"] = ROLES[1]["id"]  # Admin user gets Admin role
USERS[1]["role_id"] = ROLES[2]["id"]  # Operator user gets Operator role


FACILITIES = [
    {
        "id": uuid4(),
        "name": "Northeast Medical Center",
        "facility_type": "hospital",
        "npi": "1234567890",
        "address_line1": "123 Medical Drive",
        "address_line2": "",
        "city": "Boston",
        "state": "MA",
        "zip_code": "02115",
        "phone": "617-555-0100",
        "fax": "617-555-0101",
        "email": "info@nemedicenter.com",
        "organization_id": ORGANIZATIONS[0]["id"],
        "is_active": True,
        "created_at": utc_now(),
        "updated_at": utc_now(),
    },
    {
        "id": uuid4(),
        "name": "Southwest Clinic Group",
        "facility_type": "clinic",
        "npi": "0987654321",
        "address_line1": "456 Health Parkway",
        "address_line2": "",
        "city": "Phoenix",
        "state": "AZ",
        "zip_code": "85001",
        "phone": "602-555-0200",
        "fax": "602-555-0201",
        "email": "info@swclinic.com",
        "organization_id": ORGANIZATIONS[0]["id"],
        "is_active": True,
        "created_at": utc_now(),
        "updated_at": utc_now(),
    },
]


PROVIDERS = [
    {
        "id": uuid4(),
        "organization_id": ORGANIZATIONS[0]["id"],
        "name": "Northeast Medical Center",
        "npi": "1234567890",
        "tax_id": "12-3456789",
        "email": "info@nemedicenter.com",
        "phone": "617-555-0100",
        "fax": "617-555-0101",
        "address_line1": "123 Medical Drive",
        "city": "Boston",
        "state": "MA",
        "zip_code": "02115",
        "specialty": "Multi-specialty",
        "accepting_new_patients": True,
        "insurance_networks": json.dumps(["Blue Cross", "Aetna", "United"]),
        "office_hours": json.dumps({"Mon-Fri": "8:00-17:00", "Sat": "9:00-13:00"}),
        "is_active": True,
        "created_by_id": None,  # Will be set after creating users
        "created_at": utc_now(),
        "updated_at": utc_now(),
    },
    {
        "id": uuid4(),
        "organization_id": ORGANIZATIONS[0]["id"],
        "name": "Southwest Clinic Group",
        "npi": "0987654321",
        "tax_id": "98-7654321",
        "email": "info@swclinic.com",
        "phone": "602-555-0200",
        "fax": "602-555-0201",
        "address_line1": "456 Health Parkway",
        "city": "Phoenix",
        "state": "AZ",
        "zip_code": "85001",
        "specialty": "Primary Care",
        "accepting_new_patients": True,
        "insurance_networks": json.dumps(["Blue Cross", "Cigna", "Humana"]),
        "office_hours": json.dumps({"Mon-Fri": "9:00-18:00", "Sat": "10:00-14:00"}),
        "is_active": True,
        "created_by_id": None,  # Will be set after creating users
        "created_at": utc_now(),
        "updated_at": utc_now(),
    },
]


async def insert_data(session) -> None:
    """Insert sample data into the database."""
    print("Inserting sample data...")

    # Insert organizations
    for org in ORGANIZATIONS:
        await session.execute(
            text(
                """
                INSERT INTO organizations (
                    id, name, description, settings,
                    security_policy, is_active, status, created_at,
                    updated_at
                )
                VALUES (
                    :id, :name, :description, :settings,
                    :security_policy, :is_active, :status, :created_at,
                    :updated_at
                )
                ON CONFLICT (id) DO NOTHING
            """
            ),
            {
                "id": org["id"],
                "name": org["name"],
                "description": org["description"],
                "settings": org["settings"],
                "security_policy": org["security_policy"],
                "is_active": org["is_active"],
                "status": org["status"],
                "created_at": org["created_at"],
                "updated_at": org["updated_at"],
            },
        )

    # Insert roles
    for role in ROLES:
        await session.execute(
            text(
                """
                INSERT INTO roles (
                    id, name, description, organization_id,
                    parent_role_id, permissions, created_at,
                    updated_at
                )
                VALUES (
                    :id, :name, :description, :organization_id,
                    :parent_role_id, :permissions, :created_at,
                    :updated_at
                )
                ON CONFLICT (id) DO NOTHING
            """
            ),
            {
                "id": role["id"],
                "name": role["name"],
                "description": role["description"],
                "organization_id": role["organization_id"],
                "parent_role_id": role["parent_role_id"],
                "permissions": role["permissions"],
                "created_at": role["created_at"],
                "updated_at": role["updated_at"],
            },
        )

    # Insert users
    for user in USERS:
        await session.execute(
            text(
                """
                INSERT INTO users (
                    id, organization_id, email, username,
                    encrypted_password, first_name, last_name,
                    is_active, is_superuser, role_id,
                    mfa_enabled, force_password_change,
                    failed_login_attempts, created_at, updated_at
                )
                VALUES (
                    :id, :organization_id, :email, :username,
                    :encrypted_password, :first_name, :last_name,
                    :is_active, :is_superuser, :role_id,
                    :mfa_enabled, :force_password_change,
                    :failed_login_attempts, :created_at, :updated_at
                )
                ON CONFLICT (email) DO NOTHING
            """
            ),
            {
                "id": user["id"],
                "organization_id": user["organization_id"],
                "email": user["email"],
                "username": user["username"],
                "encrypted_password": user["encrypted_password"],
                "first_name": user["first_name"],
                "last_name": user["last_name"],
                "is_active": user["is_active"],
                "is_superuser": user["is_superuser"],
                "role_id": user["role_id"],
                "mfa_enabled": user["mfa_enabled"],
                "force_password_change": user["force_password_change"],
                "failed_login_attempts": user["failed_login_attempts"],
                "created_at": user["created_at"],
                "updated_at": user["updated_at"],
            },
        )

    await session.commit()
    print("Sample data inserted successfully.")


async def main():
    """Main function to seed database."""
    try:
        # Initialize database
        if not await init_db():
            raise RuntimeError("Failed to initialize database")

        if not async_session_factory:
            raise RuntimeError("Database session factory not initialized")

        async with async_session_factory() as session:
            print("Connected to database")

            print("Inserting sample data...")
            await insert_data(session)
            await session.commit()
            print("Sample data inserted successfully")

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
