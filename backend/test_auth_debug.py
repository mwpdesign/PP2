#!/usr/bin/env python3
"""
Debug script for testing authentication and user ID resolution.
"""

import asyncio
import sys
import os

# Add the backend directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import get_db
from app.core.security import authenticate_user
from app.services.mock_auth_service import mock_auth_service


async def test_authentication():
    """Test authentication and see what user data is returned."""
    print("🔍 Testing Authentication")
    print("=" * 50)

    try:
        # Get database session
        async for db in get_db():

            # Test 1: Mock authentication
            print("1. Testing mock authentication...")
            mock_user = mock_auth_service.authenticate_mock_user(
                "ivr@healthcare.local", "ivr123"
            )
            if mock_user:
                print(f"✅ Mock auth successful:")
                print(f"   ID: {mock_user['id']}")
                print(f"   Email: {mock_user['email']}")
                print(f"   Role: {mock_user['role_id']}")
                print(f"   Org ID: {mock_user['organization_id']}")
            else:
                print("❌ Mock auth failed")

            # Test 2: Database authentication
            print("\n2. Testing database authentication...")
            db_user = await authenticate_user(
                db, "ivr@healthcare.local", "ivr123"
            )
            if db_user:
                print(f"✅ Database auth successful:")
                print(f"   ID: {db_user['id']}")
                print(f"   Email: {db_user['email']}")
                print(f"   Role: {db_user['role_id']}")
                print(f"   Org ID: {db_user['organization_id']}")
            else:
                print("❌ Database auth failed")

            # Test 3: Check mock user data
            print("\n3. Checking mock user data...")
            mock_users = mock_auth_service.get_all_mock_users()
            for email, user_data in mock_users.items():
                if "ivr" in email:
                    print(f"   {email}: {user_data['id']}")

            break  # Exit the async generator

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(test_authentication())