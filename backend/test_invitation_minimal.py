#!/usr/bin/env python3
"""
Minimal Invitation Creation Test
Task ID: mbxm2qjdhvvt49x34k9

This script tests invitation creation with minimal required fields.
"""

import asyncio
import aiohttp
from uuid import uuid4

BASE_URL = "http://localhost:8000"


async def test_minimal_invitation():
    """Test invitation creation with minimal data."""

    print("🧪 Testing Minimal Invitation Creation")
    print("=" * 50)

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

    # Step 2: Test invitation creation with minimal data
    print("\n📧 Testing minimal invitation creation...")

    headers = {"Authorization": f"Bearer {token}"}

    # Try with minimal required fields only
    invitation_data = {
        "email": f"test-minimal-{uuid4().hex[:8]}@example.com",
        "invitation_type": "doctor",
        "role_name": "doctor"
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
    print("🚀 Starting Minimal Invitation Test")
    print("Task ID: mbxm2qjdhvvt49x34k9")
    print()

    success = await test_minimal_invitation()

    print("\n" + "=" * 50)
    if success:
        print("🎉 MINIMAL TEST PASSED!")
        print("✅ Invitation creation is working correctly")
    else:
        print("❌ MINIMAL TEST FAILED!")
        print("❌ Invitation creation has issues")

    return success


if __name__ == "__main__":
    result = asyncio.run(main())
    exit(0 if result else 1)