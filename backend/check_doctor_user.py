#!/usr/bin/env python3
"""
Check if doctor user exists in database.
"""

import asyncio
import sys
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.core.database import get_db
from sqlalchemy import select, text


async def check_doctor_user():
    """Check if doctor user exists."""
    print("🔍 Checking doctor user in database...")

    async for db in get_db():
        try:
            # Check if doctor user exists
            result = await db.execute(
                text("SELECT id, email, role_id FROM users WHERE email = 'doctor@healthcare.local'")
            )
            user = result.fetchone()

            if user:
                print(f"✅ Doctor user found:")
                print(f"   ID: {user[0]}")
                print(f"   Email: {user[1]}")
                print(f"   Role ID: {user[2]}")

                # Check role table
                role_result = await db.execute(
                    text("SELECT id, name FROM roles WHERE id = :role_id"),
                    {"role_id": user[2]}
                )
                role = role_result.fetchone()

                if role:
                    print(f"   Role Name: {role[1]}")
                else:
                    print("   ❌ Role not found")

            else:
                print("❌ Doctor user not found in database")

                # Check what users exist
                all_users = await db.execute(
                    text("SELECT email, role_id FROM users LIMIT 5")
                )
                users = all_users.fetchall()

                print(f"\nFound {len(users)} users:")
                for u in users:
                    print(f"   - {u[0]} (role_id: {u[1]})")

        except Exception as e:
            print(f"❌ Error: {str(e)}")

        break


if __name__ == "__main__":
    asyncio.run(check_doctor_user())