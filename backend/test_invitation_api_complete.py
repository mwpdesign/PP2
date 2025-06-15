#!/usr/bin/env python3
"""
Comprehensive Invitation API Test
Task ID: mbxm2qjdhvvt49x34k9

This script tests the complete invitation workflow:
1. Login as admin user
2. Create a new invitation
3. List invitations to verify it appears
4. Clean up test data
"""

import asyncio
import sys
import os
import json
import aiohttp
from uuid import uuid4

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

BASE_URL = "http://localhost:8000"


async def login_admin():
    """Login as admin user and get JWT token."""
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
                return token
            else:
                error_text = await response.text()
                print(f"❌ Login failed: {response.status} - {error_text}")
                return None


async def create_invitation(token):
    """Create a new invitation via API."""
    print("\n📧 Creating new invitation...")

    headers = {"Authorization": f"Bearer {token}"}
    invitation_data = {
        "email": f"test-api-{uuid4().hex[:8]}@example.com",
        "invitation_type": "doctor",
        "role_name": "doctor",
        "first_name": "Test",
        "last_name": "Doctor",
        "invitation_message": "Welcome to the Healthcare IVR Platform!"
    }

    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{BASE_URL}/api/v1/invitations/",
            json=invitation_data,
            headers=headers
        ) as response:
            if response.status == 201:
                result = await response.json()
                print(f"✅ Invitation created successfully!")
                print(f"   ID: {result.get('id')}")
                print(f"   Email: {result.get('email')}")
                print(f"   Type: {result.get('invitation_type')}")
                print(f"   Status: {result.get('status')}")
                return result
            else:
                error_text = await response.text()
                print(f"❌ Invitation creation failed: {response.status}")
                print(f"   Error: {error_text}")
                return None


async def list_invitations(token):
    """List all invitations via API."""
    print("\n📋 Listing invitations...")

    headers = {"Authorization": f"Bearer {token}"}

    async with aiohttp.ClientSession() as session:
        async with session.get(
            f"{BASE_URL}/api/v1/invitations/",
            headers=headers
        ) as response:
            if response.status == 200:
                result = await response.json()
                invitations = result.get("invitations", [])
                total_count = result.get("total_count", 0)

                print(f"✅ Found {total_count} invitations")

                for invitation in invitations[:5]:  # Show first 5
                    print(f"   - {invitation.get('email')} ({invitation.get('invitation_type')}) - {invitation.get('status')}")

                if len(invitations) > 5:
                    print(f"   ... and {len(invitations) - 5} more")

                return invitations
            else:
                error_text = await response.text()
                print(f"❌ Failed to list invitations: {response.status}")
                print(f"   Error: {error_text}")
                return []


async def delete_invitation(token, invitation_id):
    """Delete a test invitation via API."""
    print(f"\n🗑️ Cleaning up test invitation {invitation_id}...")

    headers = {"Authorization": f"Bearer {token}"}

    async with aiohttp.ClientSession() as session:
        async with session.delete(
            f"{BASE_URL}/api/v1/invitations/{invitation_id}",
            headers=headers
        ) as response:
            if response.status in [200, 204]:
                print("✅ Test invitation cleaned up")
                return True
            else:
                error_text = await response.text()
                print(f"⚠️ Failed to delete invitation: {response.status}")
                print(f"   Error: {error_text}")
                return False


async def test_invitation_workflow():
    """Test the complete invitation workflow."""
    print("🧪 Testing Complete Invitation API Workflow")
    print("=" * 60)

    # Step 1: Login
    token = await login_admin()
    if not token:
        return False

    # Step 2: List invitations before (to get baseline count)
    print("\n📊 Getting baseline invitation count...")
    initial_invitations = await list_invitations(token)
    initial_count = len(initial_invitations)
    print(f"   Initial count: {initial_count}")

    # Step 3: Create invitation
    invitation = await create_invitation(token)
    if not invitation:
        return False

    # Step 4: List invitations after (should have +1)
    print("\n📊 Verifying invitation was created...")
    final_invitations = await list_invitations(token)
    final_count = len(final_invitations)
    print(f"   Final count: {final_count}")

    if final_count > initial_count:
        print("✅ Invitation count increased - creation successful!")
    else:
        print("❌ Invitation count did not increase - creation may have failed")
        return False

    # Step 5: Verify our specific invitation is in the list
    invitation_email = invitation.get("email")
    found_invitation = None
    for inv in final_invitations:
        if inv.get("email") == invitation_email:
            found_invitation = inv
            break

    if found_invitation:
        print(f"✅ Found our test invitation in the list: {invitation_email}")
    else:
        print(f"❌ Could not find our test invitation in the list: {invitation_email}")
        return False

    # Step 6: Clean up (optional - comment out if you want to keep test data)
    invitation_id = invitation.get("id")
    if invitation_id:
        await delete_invitation(token, invitation_id)

    return True


async def main():
    """Main test function."""
    print("🚀 Starting Comprehensive Invitation API Test")
    print("Task ID: mbxm2qjdhvvt49x34k9")
    print()

    try:
        success = await test_invitation_workflow()

        print("\n" + "=" * 60)
        if success:
            print("🎉 ALL TESTS PASSED!")
            print("✅ Invitation API workflow is working correctly")
            print("✅ Users can now create and view invitations")
            print("✅ The 'invitations not showing' issue is RESOLVED")
        else:
            print("❌ TESTS FAILED!")
            print("❌ Invitation API workflow has issues")

        return success

    except Exception as e:
        print(f"\n❌ Test failed with exception: {e}")
        return False


if __name__ == "__main__":
    result = asyncio.run(main())
    sys.exit(0 if result else 1)