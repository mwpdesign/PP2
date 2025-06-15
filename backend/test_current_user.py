#!/usr/bin/env python3
"""
Test Current User Object
Task ID: mbxm2qjdhvvt49x34k9

This script tests what the current_user object looks like when calling the API.
"""

import asyncio
import aiohttp

BASE_URL = "http://localhost:8000"


async def test_current_user():
    """Test what the current_user object looks like."""

    print("🧪 Testing Current User Object")
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

    # Step 2: Test the debug endpoint to see current_user
    print("\n🔍 Testing current_user debug endpoint...")

    headers = {"Authorization": f"Bearer {token}"}

    async with aiohttp.ClientSession() as session:
        async with session.get(f"{BASE_URL}/api/v1/auth/debug/test-current-user", headers=headers) as response:
            if response.status == 200:
                result = await response.json()
                print(f"✅ Current user debug successful!")
                print(f"   Status: {result.get('status')}")
                print(f"   Message: {result.get('message')}")
                print(f"   Current user: {result.get('current_user')}")
                print(f"   Current user type: {result.get('current_user_type')}")
                return True
            else:
                error_text = await response.text()
                print(f"❌ Current user debug failed: {response.status}")
                print(f"   Error: {error_text}")
                return False


async def main():
    """Main test function."""
    print("🚀 Starting Current User Test")
    print("Task ID: mbxm2qjdhvvt49x34k9")
    print()

    success = await test_current_user()

    print("\n" + "=" * 50)
    if success:
        print("🎉 CURRENT USER TEST PASSED!")
        print("✅ Current user object is working correctly")
    else:
        print("❌ CURRENT USER TEST FAILED!")
        print("❌ Current user object has issues")

    return success


if __name__ == "__main__":
    result = asyncio.run(main())
    exit(0 if result else 1)