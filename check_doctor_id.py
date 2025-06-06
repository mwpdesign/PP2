#!/usr/bin/env python3
"""Check doctor user ID in the database."""

import asyncio
import os
import sys

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.app.core.database import get_db  # noqa: E402
from backend.app.models.user import User  # noqa: E402
from sqlalchemy import select  # noqa: E402


async def check_doctor_id():
    """Check doctor user ID in the database."""
    try:
        async for db in get_db():
            result = await db.execute(
                select(User).where(User.email == 'doctor@healthcare.local')
            )
            user = result.scalar_one_or_none()

            if user:
                print(f"Doctor user found:")
                print(f"  ID: {user.id}")
                print(f"  Email: {user.email}")
                print(f"  First Name: {user.first_name}")
                print(f"  Last Name: {user.last_name}")
                print(f"  Role: {user.role}")
            else:
                print("Doctor user not found!")
            break
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    asyncio.run(check_doctor_id())