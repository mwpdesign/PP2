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
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/healthcare_ivr"
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
        "created_at": utc_now(),
        "updated_at": utc_now()
    },
    {
        "id": uuid4(),
        "name": "Insurance Verification Services",
        "description": "IVR services for insurance verification",
        "settings": json.dumps({}),
        "security_policy": json.dumps({}),
        "is_active": True,
        "created_at": utc_now(),
        "updated_at": utc_now()
    }
]


# Create root role first
ROOT_ROLE = {
    "id": uuid4(),
    "name": "Root",
    "description": "Root role",
    "organization_id": ORGANIZATIONS[0]["id"],
    "parent_role_id": None,  # Root role has no parent
    "permissions": json.dumps(["*"]),
    "created_at": utc_now(),
    "updated_at": utc_now()
}


ROLES = [
    {
        "id": uuid4(),
        "name": "Admin",
        "description": "Administrator role",
        "organization_id": ORGANIZATIONS[0]["id"],
        "parent_role_id": ROOT_ROLE["id"],
        "permissions": json.dumps(["*"]),
        "created_at": utc_now(),
        "updated_at": utc_now()
    },
    {
        "id": uuid4(),
        "name": "Operator",
        "description": "IVR Operator role",
        "organization_id": ORGANIZATIONS[1]["id"],
        "parent_role_id": ROOT_ROLE["id"],
        "permissions": json.dumps(["ivr.*", "patients.read"]),
        "created_at": utc_now(),
        "updated_at": utc_now()
    }
]


TERRITORIES = [
    {
        "id": uuid4(),
        "organization_id": ORGANIZATIONS[0]["id"],
        "name": "Northeast Region",
        "code": "NE",
        "description": "Coverage for northeastern states",
        "latitude": 42.3601,
        "longitude": -71.0589,
        "radius_miles": 500.0,
        "boundaries": json.dumps({
            "type": "Polygon",
            "coordinates": [[
                [-75.0, 40.0],
                [-70.0, 40.0],
                [-70.0, 45.0],
                [-75.0, 45.0],
                [-75.0, 40.0]
            ]]
        }),
        "settings": json.dumps({}),
        "created_at": utc_now(),
        "updated_at": utc_now()
    },
    {
        "id": uuid4(),
        "organization_id": ORGANIZATIONS[0]["id"],
        "name": "Southwest Region",
        "code": "SW",
        "description": "Coverage for southwestern states",
        "latitude": 33.4484,
        "longitude": -112.0740,
        "radius_miles": 600.0,
        "boundaries": json.dumps({
            "type": "Polygon",
            "coordinates": [[
                [-115.0, 30.0],
                [-110.0, 30.0],
                [-110.0, 35.0],
                [-115.0, 35.0],
                [-115.0, 30.0]
            ]]
        }),
        "settings": json.dumps({}),
        "created_at": utc_now(),
        "updated_at": utc_now()
    }
]


USERS = [
    {
        "id": uuid4(),
        "organization_id": ORGANIZATIONS[0]["id"],
        "email": "admin@healthcareprovider.com",
        "username": "admin",
        "encrypted_password": pwd_context.hash("Admin123!"),
        "first_name": "Admin",
        "last_name": "User",
        "is_active": True,
        "is_superuser": True,
        "role_id": None,  # Will be set after creating roles
        "mfa_enabled": False,
        "force_password_change": False,
        "failed_login_attempts": 0
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
        "role_id": None,  # Will be set after creating roles
        "mfa_enabled": False,
        "force_password_change": False,
        "failed_login_attempts": 0
    }
]


FACILITIES = [
    {
        "id": uuid4(),
        "name": "Northeast Medical Center",
        "facility_type": "hospital",
        "npi": "1234567890",
        "address_line1": "123 Medical Drive",
        "address_line2": None,
        "city": "Boston",
        "state": "MA",
        "zip_code": "02115",
        "phone": "617-555-0100",
        "fax": "617-555-0101",
        "email": "info@nemedicenter.com",
        "organization_id": ORGANIZATIONS[0]["id"],
        "territory_id": TERRITORIES[0]["id"],
        "is_active": True,
        "created_at": utc_now(),
        "updated_at": utc_now()
    },
    {
        "id": uuid4(),
        "name": "Southwest Clinic Group",
        "facility_type": "clinic",
        "npi": "0987654321",
        "address_line1": "456 Health Parkway",
        "address_line2": None,
        "city": "Phoenix",
        "state": "AZ",
        "zip_code": "85001",
        "phone": "602-555-0200",
        "fax": "602-555-0201",
        "email": "info@swclinic.com",
        "organization_id": ORGANIZATIONS[0]["id"],
        "territory_id": TERRITORIES[1]["id"],
        "is_active": True,
        "created_at": utc_now(),
        "updated_at": utc_now()
    }
]


PROVIDERS = [
    {
        "id": uuid4(),
        "organization_id": ORGANIZATIONS[0]["id"],
        "territory_id": TERRITORIES[0]["id"],
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
        "office_hours": json.dumps({
            "Mon-Fri": "8:00-17:00",
            "Sat": "9:00-13:00"
        }),
        "is_active": True,
        "created_by_id": USERS[0]["id"],  # Admin user
        "created_at": utc_now(),
        "updated_at": utc_now()
    },
    {
        "id": uuid4(),
        "organization_id": ORGANIZATIONS[0]["id"],
        "territory_id": TERRITORIES[1]["id"],
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
        "office_hours": json.dumps({
            "Mon-Fri": "9:00-18:00",
            "Sat": "10:00-14:00"
        }),
        "is_active": True,
        "created_by_id": USERS[0]["id"],  # Admin user
        "created_at": utc_now(),
        "updated_at": utc_now()
    }
]


async def insert_data(session) -> None:
    """Insert sample data into database."""
    # Insert organizations
    for org in ORGANIZATIONS:
        await session.execute(
            text("""
                INSERT INTO organizations (
                    id, name, description, settings,
                    security_policy, is_active, created_at,
                    updated_at
                )
                VALUES (
                    :id, :name, :description, :settings,
                    :security_policy, :is_active, :created_at,
                    :updated_at
                )
            """),
            {
                "id": org["id"],
                "name": org["name"],
                "description": org["description"],
                "settings": org["settings"],
                "security_policy": org["security_policy"],
                "is_active": org["is_active"],
                "created_at": org["created_at"],
                "updated_at": org["updated_at"]
            }
        )

    # Insert root role first
    await session.execute(
        text("""
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
        """),
        {
            "id": ROOT_ROLE["id"],
            "name": ROOT_ROLE["name"],
            "description": ROOT_ROLE["description"],
            "organization_id": ROOT_ROLE["organization_id"],
            "parent_role_id": None,  # Root role has no parent
            "permissions": ROOT_ROLE["permissions"],
            "created_at": ROOT_ROLE["created_at"],
            "updated_at": ROOT_ROLE["updated_at"]
        }
    )

    # Insert roles
    for role in ROLES:
        await session.execute(
            text("""
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
            """),
            {
                "id": role["id"],
                "name": role["name"],
                "description": role["description"],
                "organization_id": role["organization_id"],
                "parent_role_id": role["parent_role_id"],
                "permissions": role["permissions"],
                "created_at": role["created_at"],
                "updated_at": role["updated_at"]
            }
        )

    # Update users with role IDs
    USERS[0]["role_id"] = ROLES[0]["id"]  # Admin role
    USERS[1]["role_id"] = ROLES[1]["id"]  # Operator role

    # Insert users
    for user in USERS:
        await session.execute(
            text("""
                INSERT INTO users (
                    id, organization_id, email, username,
                    encrypted_password, first_name, last_name,
                    is_active, is_superuser, role_id,
                    mfa_enabled, force_password_change,
                    failed_login_attempts
                )
                VALUES (
                    :id, :organization_id, :email, :username,
                    :encrypted_password, :first_name, :last_name,
                    :is_active, :is_superuser, :role_id,
                    :mfa_enabled, :force_password_change,
                    :failed_login_attempts
                )
            """),
            user
        )

    # Insert territories
    for territory in TERRITORIES:
        await session.execute(
            text("""
                INSERT INTO territories (
                    id, organization_id, name, code,
                    description, latitude, longitude,
                    radius_miles, boundaries, settings,
                    created_at, updated_at
                )
                VALUES (
                    :id, :organization_id, :name, :code,
                    :description, :latitude, :longitude,
                    :radius_miles, :boundaries, :settings,
                    :created_at, :updated_at
                )
            """),
            territory
        )

    # Insert facilities
    for facility in FACILITIES:
        await session.execute(
            text("""
                INSERT INTO facilities (
                    id, name, facility_type, npi,
                    address_line1, address_line2, city,
                    state, zip_code, phone, fax, email,
                    organization_id, territory_id, is_active,
                    created_at, updated_at
                )
                VALUES (
                    :id, :name, :facility_type, :npi,
                    :address_line1, :address_line2, :city,
                    :state, :zip_code, :phone, :fax, :email,
                    :organization_id, :territory_id, :is_active,
                    :created_at, :updated_at
                )
            """),
            facility
        )

    # Insert providers
    for provider in PROVIDERS:
        await session.execute(
            text("""
                INSERT INTO providers (
                    id, organization_id, territory_id, name,
                    npi, tax_id, email, phone, fax,
                    address_line1, city, state, zip_code,
                    specialty, accepting_new_patients,
                    insurance_networks, office_hours,
                    is_active, created_by_id, created_at,
                    updated_at
                )
                VALUES (
                    :id, :organization_id, :territory_id, :name,
                    :npi, :tax_id, :email, :phone, :fax,
                    :address_line1, :city, :state, :zip_code,
                    :specialty, :accepting_new_patients,
                    :insurance_networks, :office_hours,
                    :is_active, :created_by_id, :created_at,
                    :updated_at
                )
            """),
            provider
        )

    # Assign users to territories
    for user in USERS:
        if user["organization_id"] == ORGANIZATIONS[0]["id"]:
            for territory in TERRITORIES:
                await session.execute(
                    text("""
                        INSERT INTO user_territories (user_id, territory_id)
                        VALUES (:user_id, :territory_id)
                    """),
                    {
                        "user_id": user["id"],
                        "territory_id": territory["id"]
                    }
                )

    # Assign territory access to roles
    for role in [ROOT_ROLE] + ROLES:
        for territory in TERRITORIES:
            if role["organization_id"] == territory["organization_id"]:
                await session.execute(
                    text("""
                        INSERT INTO territory_role_access (
                            territory_id, role_id, access_level
                        )
                        VALUES (
                            :territory_id, :role_id, :access_level
                        )
                    """),
                    {
                        "territory_id": territory["id"],
                        "role_id": role["id"],
                        "access_level": "full"
                    }
                )


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