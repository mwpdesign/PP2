#!/usr/bin/env python3
"""
Test script for Practice Staff Management API endpoints.
Phase 3.2C: Practice-Level User Delegation
"""

import asyncio
import sys
from pathlib import Path
from datetime import datetime

import httpx

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.core.security import create_access_token  # noqa: E402


async def test_practice_endpoints():
    """Test Practice API endpoints."""
    print("🚀 Testing Practice API Endpoints")
    print("=" * 50)

    # Create doctor token
    doctor_data = {"sub": "doctor@healthcare.local"}
    doctor_token = create_access_token(data=doctor_data)

    headers = {
        "Authorization": f"Bearer {doctor_token}",
        "Content-Type": "application/json"
    }

    base_url = "http://localhost:8000/api/v1"

    async with httpx.AsyncClient() as client:
        # Test 1: Practice Statistics
        print("\n📊 Testing Practice Statistics...")
        response = await client.get(
            f"{base_url}/practice/statistics",
            headers=headers
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Statistics: {data}")
        else:
            print(f"❌ Error: {response.text}")

        # Test 2: List Staff
        print("\n👥 Testing List Staff...")
        response = await client.get(
            f"{base_url}/practice/staff",
            headers=headers
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Staff count: {len(data.get('staff_members', []))}")
        else:
            print(f"❌ Error: {response.text}")

        # Test 3: Invite Staff
        print("\n📧 Testing Staff Invitation...")
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S%f')
        invitation_data = {
            "email": f"test-staff-{timestamp}@example.com",
            "practice_role": "office_admin",
            "first_name": "Test",
            "last_name": "Staff"
        }
        response = await client.post(
            f"{base_url}/practice/staff/invite",
            headers=headers,
            json=invitation_data
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Invitation sent: {data.get('message')}")
        else:
            print(f"❌ Error: {response.text}")

    print("\n🎉 Practice API Tests Completed!")


async def main():
    """Main function."""
    try:
        # Check if server is running
        async with httpx.AsyncClient() as client:
            response = await client.get("http://localhost:8000/health")
            if response.status_code != 200:
                print("❌ Backend server not running")
                return
    except httpx.ConnectError:
        print("❌ Cannot connect to backend server")
        return

    print("✅ Backend server is running")
    await test_practice_endpoints()


if __name__ == "__main__":
    asyncio.run(main())
