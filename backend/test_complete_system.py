#!/usr/bin/env python3
"""
Comprehensive test for Authentication and Practice Delegation System
"""

import asyncio
import httpx
import sys
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Set environment variables for testing
import os
os.environ["AUTH_MODE"] = "local"
os.environ["ENVIRONMENT"] = "development"
os.environ["DEBUG"] = "true"

BASE_URL = "http://localhost:8000"

async def test_authentication():
    """Test authentication system."""
    print("=== Testing Authentication ===")

    async with httpx.AsyncClient() as client:
        # Test login
        login_data = {
            "username": "doctor@healthcare.local",
            "password": "doctor123"
        }

        try:
            response = await client.post(
                f"{BASE_URL}/api/v1/auth/login",
                data=login_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )

            if response.status_code == 200:
                data = response.json()
                token = data.get("access_token")
                print(f"✅ Authentication successful")
                print(f"   Token: {token[:50]}...")
                return token
            else:
                print(f"❌ Authentication failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return None

        except Exception as e:
            print(f"❌ Authentication error: {e}")
            return None

async def test_profile(token):
    """Test profile endpoint."""
    print("\n=== Testing Profile Endpoint ===")

    if not token:
        print("❌ No token available for profile test")
        return

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{BASE_URL}/api/v1/auth/profile",
                headers={"Authorization": f"Bearer {token}"}
            )

            if response.status_code == 200:
                data = response.json()
                print(f"✅ Profile retrieved successfully")
                print(f"   Email: {data.get('email')}")
                print(f"   Role: {data.get('role')}")
                print(f"   Name: {data.get('first_name')} {data.get('last_name')}")
            else:
                print(f"❌ Profile request failed: {response.status_code}")
                print(f"   Response: {response.text}")

        except Exception as e:
            print(f"❌ Profile error: {e}")

async def test_practice_endpoints(token):
    """Test practice delegation endpoints."""
    print("\n=== Testing Practice Delegation Endpoints ===")

    if not token:
        print("❌ No token available for practice tests")
        return

    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {token}"}

        # Test practice scope
        try:
            response = await client.get(
                f"{BASE_URL}/api/v1/team/practice-scope",
                headers=headers
            )

            if response.status_code == 200:
                data = response.json()
                print(f"✅ Practice scope retrieved")
                print(f"   User ID: {data.get('user_id')}")
                print(f"   Practice Scope: {data.get('practice_scope')}")
                print(f"   Is Doctor: {data.get('is_doctor')}")
            else:
                print(f"❌ Practice scope failed: {response.status_code}")
                print(f"   Response: {response.text}")

        except Exception as e:
            print(f"❌ Practice scope error: {e}")

        # Test get staff
        try:
            response = await client.get(
                f"{BASE_URL}/api/v1/team/staff",
                headers=headers
            )

            if response.status_code == 200:
                data = response.json()
                print(f"✅ Staff list retrieved")
                print(f"   Staff count: {len(data)}")
            else:
                print(f"❌ Staff list failed: {response.status_code}")
                print(f"   Response: {response.text}")

        except Exception as e:
            print(f"❌ Staff list error: {e}")

async def test_health_endpoint():
    """Test health endpoint."""
    print("\n=== Testing Health Endpoint ===")

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{BASE_URL}/health")

            if response.status_code == 200:
                data = response.json()
                print(f"✅ Health check successful")
                print(f"   Status: {data.get('status')}")
                print(f"   Service: {data.get('service')}")
                return True
            else:
                print(f"❌ Health check failed: {response.status_code}")
                return False

        except Exception as e:
            print(f"❌ Health check error: {e}")
            return False

async def main():
    """Run all tests."""
    print("🚀 Starting Comprehensive System Test")
    print("=" * 50)

    # Test health first
    health_ok = await test_health_endpoint()
    if not health_ok:
        print("\n❌ Backend is not responding. Please start the backend server first.")
        return

    # Test authentication
    token = await test_authentication()

    # Test profile
    await test_profile(token)

    # Test practice delegation
    await test_practice_endpoints(token)

    print("\n" + "=" * 50)
    print("🎉 Comprehensive System Test Complete")

if __name__ == "__main__":
    asyncio.run(main())