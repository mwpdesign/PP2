import asyncio
import os
import bcrypt
import uuid
from datetime import datetime

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.sql import text
from dotenv import load_dotenv

# --- Configuration ---
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@example.com")
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")
ADMIN_ROLE_NAME = "admin"  # Case-insensitive search for this role name
# --- End Configuration ---

if not ADMIN_PASSWORD:
    print("Error: ADMIN_PASSWORD environment variable is required.")
    print("Set ADMIN_PASSWORD=your_secure_password before running.")
    exit(1)


def get_password_hash(password: str) -> str:
    """Generate password hash using bcrypt, matching backend's method."""
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(12)).decode()

async def main():
    """Main function to create or update the admin user."""
    load_dotenv()  # Load .env from current dir (backend/)
    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        print("Error: DATABASE_URL not found in .env file.")
        print("Ensure .env is in 'backend/' with DATABASE_URL.")
        return

    print(f"Using DB URL (truncated): {database_url[:30]}...")

    engine = create_async_engine(database_url)
    hashed_password = get_password_hash(ADMIN_PASSWORD)
    print(f"Hashed '{ADMIN_PASSWORD}' (truncated): {hashed_password[:20]}...")

    async with engine.connect() as conn:
        try:
            org_result = await conn.execute(text(
                "SELECT id FROM organizations LIMIT 1"
            ))
            organization = org_result.fetchone()
            if not organization:
                print("Error: No organizations found.")
                print("Please create an organization first.")
                return
            organization_id = organization.id
            print(f"Using Org ID: {organization_id}")

            role_result = await conn.execute(
                text("SELECT id FROM roles WHERE lower(name) = :r_name LIMIT 1"),
                {"r_name": ADMIN_ROLE_NAME.lower()}
            )
            admin_role = role_result.fetchone()
            if not admin_role:
                print(f"Error: Role '{ADMIN_ROLE_NAME}' not found.")
                print("Create admin role or update script.")
                return
            admin_role_id = admin_role.id
            print(f"Using Admin Role ID: {admin_role_id}")

            user_result = await conn.execute(
                text("SELECT id FROM users WHERE email = :email"),
                {"email": ADMIN_EMAIL}
            )
            existing_user = user_result.fetchone()

            now_utc = datetime.utcnow()

            if existing_user:
                user_id = existing_user.id
                print(f"User {ADMIN_EMAIL} exists (ID: {user_id}).")
                print("Updating password and superuser status.")
                update_query = text("""
                    UPDATE users
                    SET encrypted_password = :hashed_pwd,
                        is_superuser = TRUE,
                        updated_at = :now
                    WHERE id = :user_id
                """)
                await conn.execute(
                    update_query,
                    {"hashed_pwd": hashed_password, "user_id": user_id, "now": now_utc}
                )
                print(f"User {ADMIN_EMAIL} updated.")
            else:
                new_user_id = uuid.uuid4()
                print(f"User {ADMIN_EMAIL} not found. Creating new user.")
                insert_query = text("""
                    INSERT INTO users (id, username, email, encrypted_password,
                                     role_id, organization_id, first_name,
                                     last_name, is_active, is_superuser,
                                     created_at, updated_at)
                    VALUES (:id, :username, :email, :hashed_pwd,
                            :role_id, :org_id, :first_name,
                            :last_name, TRUE, TRUE, :now, :now)
                """)
                await conn.execute(
                    insert_query,
                    {
                        "id": new_user_id,
                        "username": ADMIN_USERNAME,
                        "email": ADMIN_EMAIL,
                        "hashed_pwd": hashed_password,
                        "role_id": admin_role_id,
                        "org_id": organization_id,
                        "first_name": "Admin",
                        "last_name": "User",
                        "now": now_utc
                    }
                )
                print(f"User {ADMIN_EMAIL} (ID: {new_user_id}) created.")

            await conn.commit()

        except Exception as e:
            print(f"An error occurred: {e}")
            await conn.rollback()
        finally:
            await conn.close()

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())