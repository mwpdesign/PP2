import asyncio
import os
import uuid
# from datetime import datetime, timezone # Unused imports

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import text
from dotenv import load_dotenv

from app.core.database import Base
from app.models.organization import Organization
from app.models.rbac import Role


async def main():
    """Create initial organization and admin role."""
    load_dotenv()  # Load .env from current dir (e.g., backend/)
    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        print("Error: DATABASE_URL not found in .env file.")
        return

    engine = create_async_engine(database_url)
    async_session = sessionmaker(
        engine, expire_on_commit=False, class_=AsyncSession
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        try:
            # Check if organization exists
            existing_org = await session.execute(
                text("SELECT id FROM organizations WHERE name = :name"),
                {"name": "Healthcare IVR Primary Org"}
            )
            org_result = existing_org.fetchone()

            if org_result:
                organization_id = org_result.id
                print(f"Organization already exists. Using ID: {organization_id}")
            else:
                # Create new organization
                org_id = uuid.uuid4()
                new_org = Organization(
                    id=org_id,
                    name="Healthcare IVR Primary Org",
                    description="Primary org for system init",
                    status="active"
                )
                session.add(new_org)
                await session.flush()
                organization_id = new_org.id
                print(f"Created new organization: {organization_id}")

            # Check if admin role exists
            existing_role = await session.execute(
                text("""
                    SELECT id FROM roles 
                    WHERE name = :name AND organization_id = :org_id
                """),  # This query is fine as a multi-line string
                {"name": "admin", "org_id": organization_id}
            )
            role_result = existing_role.fetchone()

            if role_result:
                role_id = role_result.id
                print(f"Admin role already exists. Using ID: {role_id}")
            else:
                # Create admin role
                role_id = uuid.uuid4()
                new_role = Role(
                    id=role_id,
                    name="admin",
                    description="System administrator role with full access",
                    organization_id=organization_id
                )
                session.add(new_role)
                await session.flush()
                print(f"Created new admin role: {role_id}")

            await session.commit()
            print("Initial data created successfully.")

        except Exception as e:
            await session.rollback()
            print(f"An error occurred: {e}")
        finally:
            await session.close()

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main()) 