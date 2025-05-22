"""Seed database with initial data for development."""
import asyncio
import os
import sys
from uuid import uuid4

import asyncpg
from passlib.context import CryptContext

# Add backend directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Database configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/healthcare_ivr"
)

# Sample data
ORGANIZATIONS = [
    {
        "id": uuid4(),
        "name": "Healthcare Provider Network",
        "type": "provider_network",
        "status": "active"
    },
    {
        "id": uuid4(),
        "name": "Insurance Verification Services",
        "type": "ivr_company",
        "status": "active"
    }
]

TERRITORIES = [
    {
        "id": uuid4(),
        "organization_id": ORGANIZATIONS[0]["id"],
        "name": "Northeast Region",
        "description": "Coverage for northeastern states"
    },
    {
        "id": uuid4(),
        "organization_id": ORGANIZATIONS[0]["id"],
        "name": "Southwest Region",
        "description": "Coverage for southwestern states"
    }
]

USERS = [
    {
        "id": uuid4(),
        "organization_id": ORGANIZATIONS[0]["id"],
        "email": "admin@healthcareprovider.com",
        "password": "Admin123!",  # Will be hashed
        "first_name": "Admin",
        "last_name": "User",
        "role": "admin",
        "status": "active"
    },
    {
        "id": uuid4(),
        "organization_id": ORGANIZATIONS[1]["id"],
        "email": "operator@ivrservice.com",
        "password": "Operator123!",  # Will be hashed
        "first_name": "IVR",
        "last_name": "Operator",
        "role": "operator",
        "status": "active"
    }
]

PROVIDERS = [
    {
        "id": uuid4(),
        "organization_id": ORGANIZATIONS[0]["id"],
        "territory_id": TERRITORIES[0]["id"],
        "name": "Northeast Medical Center",
        "provider_type": "hospital",
        "npi_number": "1234567890",
        "tax_id": "12-3456789",
        "status": "active"
    },
    {
        "id": uuid4(),
        "organization_id": ORGANIZATIONS[0]["id"],
        "territory_id": TERRITORIES[1]["id"],
        "name": "Southwest Clinic Group",
        "provider_type": "clinic",
        "npi_number": "0987654321",
        "tax_id": "98-7654321",
        "status": "active"
    }
]

async def create_tables(conn: asyncpg.Connection) -> None:
    """Create database tables from SQL file."""
    with open("migrations/001_initial_schema.sql", "r") as f:
        sql = f.read()
    await conn.execute(sql)

async def insert_data(conn: asyncpg.Connection) -> None:
    """Insert sample data into database."""
    # Insert organizations
    for org in ORGANIZATIONS:
        await conn.execute("""
            INSERT INTO organizations (id, name, type, status)
            VALUES ($1, $2, $3, $4)
        """, org["id"], org["name"], org["type"], org["status"])

    # Insert territories
    for territory in TERRITORIES:
        await conn.execute("""
            INSERT INTO territories (id, organization_id, name, description)
            VALUES ($1, $2, $3, $4)
        """, territory["id"], territory["organization_id"],
        territory["name"], territory["description"])

    # Insert users with hashed passwords
    for user in USERS:
        hashed_password = pwd_context.hash(user["password"])
        await conn.execute("""
            INSERT INTO users (
                id, organization_id, email, hashed_password,
                first_name, last_name, role, status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        """, user["id"], user["organization_id"], user["email"],
        hashed_password, user["first_name"], user["last_name"],
        user["role"], user["status"])

    # Insert providers
    for provider in PROVIDERS:
        await conn.execute("""
            INSERT INTO providers (
                id, organization_id, territory_id, name,
                provider_type, npi_number, tax_id, status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        """, provider["id"], provider["organization_id"],
        provider["territory_id"], provider["name"],
        provider["provider_type"], provider["npi_number"],
        provider["tax_id"], provider["status"])

    # Assign users to territories
    for user in USERS:
        if user["organization_id"] == ORGANIZATIONS[0]["id"]:
            for territory in TERRITORIES:
                await conn.execute("""
                    INSERT INTO user_territories (user_id, territory_id)
                    VALUES ($1, $2)
                """, user["id"], territory["id"])

async def main():
    """Main function to seed database."""
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        print("Connected to database")

        print("Creating tables...")
        await create_tables(conn)
        print("Tables created successfully")

        print("Inserting sample data...")
        await insert_data(conn)
        print("Sample data inserted successfully")

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

    finally:
        if conn:
            await conn.close()
            print("Database connection closed")

if __name__ == "__main__":
    asyncio.run(main()) 