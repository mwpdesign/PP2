#!/usr/bin/env python3
"""
Test script to check invitation database table and connection
"""

import asyncio
import sys
import os

# Add the backend directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.core.database import get_db


async def test_invitation_db():
    """Test invitation database table and connection."""
    print("Testing invitation database connection...")

    try:
        # Get database session
        async for db in get_db():
            print("✅ Database connection successful")

            # Test if user_invitations table exists
            result = await db.execute(text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_schema = 'public'
                    AND table_name = 'user_invitations'
                );
            """))
            table_exists = result.scalar()

            if table_exists:
                print("✅ user_invitations table exists")

                # Test basic query
                result = await db.execute(text(
                    "SELECT COUNT(*) FROM user_invitations"
                ))
                count = result.scalar()
                print(f"✅ Table query successful - {count} invitations found")

            else:
                print("❌ user_invitations table does not exist")

                # List all tables
                result = await db.execute(text("""
                    SELECT table_name
                    FROM information_schema.tables
                    WHERE table_schema = 'public'
                    ORDER BY table_name
                """))
                tables = result.fetchall()
                print("Available tables:")
                for table in tables:
                    print(f"  - {table[0]}")

            break

    except Exception as e:
        print(f"❌ Database error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(test_invitation_db())