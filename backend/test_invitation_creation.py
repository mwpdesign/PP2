#!/usr/bin/env python3
"""
Test invitation creation via API
Task ID: mbxm2qjdhvvt49x34k9
"""

import asyncio
import sys
import os
import json
import aiohttp

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.core.database import engine


async def test_invitation_creation():
    """Test invitation creation via API and database check."""
    print("🧪 TESTING INVITATION CREATION")
    print("=" * 50)

    # First, check current invitation count
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT COUNT(*) FROM user_invitations"))
        initial_count = result.scalar()
        print(f"📊 Initial invitation count: {initial_count}")

    # Test API invitation creation
    print("\n🌐 TESTING API INVITATION CREATION")

    try:
        # Login first to get auth token
        async with aiohttp.ClientSession() as session:
            # Login
            login_data = {
                "username": "admin@healthcare.local",
                "password": "admin123"
            }

            print("🔑 Logging in...")
            async with session.post(
                "http://localhost:8000/api/v1/auth/login",
                data=login_data
            ) as response:
                if response.status == 200:
                    login_result = await response.json()
                    token = login_result.get("access_token")
                    print(f"✅ Login successful, token: {token[:20]}...")
                else:
                    print(f"❌ Login failed: {response.status}")
                    text = await response.text()
                    print(f"Response: {text}")
                    return

            # Create invitation
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }

            invitation_data = {
                "email": "test.doctor@example.com",
                "invitation_type": "doctor",
                "role_name": "doctor",
                "first_name": "Test",
                "last_name": "Doctor",
                "invitation_message": "Welcome to our platform!"
            }

            print("📧 Creating invitation...")
            async with session.post(
                "http://localhost:8000/api/v1/invitations/",
                headers=headers,
                json=invitation_data
            ) as response:
                print(f"📤 Response status: {response.status}")
                response_text = await response.text()
                print(f"📄 Response body: {response_text}")

                if response.status == 201:
                    result = await response.json()
                    print(f"✅ Invitation created successfully!")
                    print(f"   ID: {result.get('id')}")
                    print(f"   Email: {result.get('email')}")
                    print(f"   Status: {result.get('status')}")
                else:
                    print(f"❌ Invitation creation failed")
                    return

    except Exception as e:
        print(f"💥 API test failed: {e}")
        import traceback
        traceback.print_exc()
        return

    # Check database after creation
    print("\n🔍 CHECKING DATABASE AFTER CREATION")
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT COUNT(*) FROM user_invitations"))
        final_count = result.scalar()
        print(f"📊 Final invitation count: {final_count}")
        print(f"📈 Invitations added: {final_count - initial_count}")

        if final_count > initial_count:
            print("✅ Invitation was saved to database!")

            # Get the latest invitation
            result = await conn.execute(text("""
                SELECT id, email, invitation_type, status, invited_by_id, created_at
                FROM user_invitations
                ORDER BY created_at DESC
                LIMIT 1
            """))

            latest_invitation = result.fetchone()
            if latest_invitation:
                print(f"📋 Latest invitation:")
                print(f"   ID: {latest_invitation.id}")
                print(f"   Email: {latest_invitation.email}")
                print(f"   Type: {latest_invitation.invitation_type}")
                print(f"   Status: {latest_invitation.status}")
                print(f"   Created by: {latest_invitation.invited_by_id}")
                print(f"   Created at: {latest_invitation.created_at}")
        else:
            print("❌ Invitation was NOT saved to database!")

    # Test invitation listing API
    print("\n📋 TESTING INVITATION LISTING API")
    try:
        async with aiohttp.ClientSession() as session:
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }

            async with session.get(
                "http://localhost:8000/api/v1/invitations/",
                headers=headers
            ) as response:
                print(f"📤 List response status: {response.status}")

                if response.status == 200:
                    result = await response.json()
                    invitations = result.get("invitations", [])
                    total_count = result.get("total_count", 0)

                    print(f"✅ API returned {len(invitations)} invitations (total: {total_count})")

                    for inv in invitations:
                        print(f"   - {inv.get('email')} ({inv.get('invitation_type')}) - Status: {inv.get('status')}")
                else:
                    response_text = await response.text()
                    print(f"❌ List API failed: {response_text}")

    except Exception as e:
        print(f"💥 List API test failed: {e}")

    print("\n" + "=" * 50)
    print("🏁 INVITATION CREATION TEST COMPLETE")


if __name__ == "__main__":
    asyncio.run(test_invitation_creation())