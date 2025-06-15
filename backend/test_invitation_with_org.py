#!/usr/bin/env python3
"""
Invitation Creation Test with Organization ID
Task ID: mbxm2qjdhvvt49x34k9

This script tests invitation creation with organization_id from current user.
"""

import asyncio
import aiohttp
from uuid import uuid4

BASE_URL = "http://localhost:8000"


async def test_invitation_with_org():
    """Test invitation creation with organization_id."""

    print("🧪 Testing Invitation Creation with Organization ID")
    print("=" * 60)

    # Step 1: Login
    print("🔐 Logging in as admin user...")

    async with aiohttp.ClientSession() as session:
        login_data = aiohttp.FormData()
        login_data.add_field("username", "admin@healthcare.local")
        login_data.add_field("password", "admin123")

        async with session.post(f"{BASE_URL}/api/v1/auth/login", data=login_data) as response:
            if response.status == 200:
                result = await response.json()
                token = result.get("access_token")
                print(f"✅ Login successful, token: {token[:20]}...")
            else:
                error_text = await response.text()
                print(f"❌ Login failed: {response.status} - {error_text}")
                return False

    # Step 2: Get current user info to get organization_id
    print("\n🔍 Getting current user info...")

    headers = {"Authorization": f"Bearer {token}"}

    async with aiohttp.ClientSession() as session:
        async with session.get(f"{BASE_URL}/api/v1/auth/debug/test-current-user", headers=headers) as response:
            if response.status == 200:
                result = await response.json()
                current_user = result.get('current_user', {})
                organization_id = current_user.get('organization_id')
                print(f"✅ Current user organization_id: {organization_id}")
            else:
                error_text = await response.text()
                print(f"❌ Failed to get current user: {response.status} - {error_text}")
                return False

    # Step 3: Test invitation creation with organization_id
    print("\n📧 Testing invitation creation with organization_id...")

    invitation_data = {
        "email": f"test-with-org-{uuid4().hex[:8]}@example.com",
        "invitation_type": "doctor",
        "role_name": "doctor",
        "organization_id": organization_id,
        "first_name": "Test",
        "last_name": "Doctor"
    }

    print(f"   Data: {invitation_data}")

    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{BASE_URL}/api/v1/invitations/",
            json=invitation_data,
            headers=headers
        ) as response:
            print(f"   Response status: {response.status}")

            if response.status == 201:
                result = await response.json()
                print(f"✅ Invitation created successfully!")
                print(f"   ID: {result.get('id')}")
                print(f"   Email: {result.get('email')}")
                print(f"   Type: {result.get('invitation_type')}")
                print(f"   Status: {result.get('status')}")
                print(f"   Organization ID: {result.get('organization_id')}")
                return True
            else:
                error_text = await response.text()
                print(f"❌ Invitation creation failed: {response.status}")
                print(f"   Error: {error_text}")

                # Try to parse JSON error for more details
                try:
                    error_json = await response.json()
                    print(f"   Error JSON: {error_json}")
                except:
                    pass

                return False


async def main():
    """Main test function."""
    print("🚀 Starting Invitation Test with Organization ID")
    print("Task ID: mbxm2qjdhvvt49x34k9")
    print()

    success = await test_invitation_with_org()

    print("\n" + "=" * 60)
    if success:
        print("🎉 ORGANIZATION TEST PASSED!")
        print("✅ Invitation creation with organization_id is working correctly")
        print("✅ The invitation system fix is COMPLETE!")
    else:
        print("❌ ORGANIZATION TEST FAILED!")
        print("❌ Invitation creation still has issues")

    return success


if __name__ == "__main__":
    result = asyncio.run(main())
    exit(0 if result else 1)