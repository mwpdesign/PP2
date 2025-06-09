#!/usr/bin/env python3
"""
Test the IVR API endpoints for multi-size product selection.
"""

import asyncio
import json
from decimal import Decimal

import httpx

# Test data for multi-size product selection
test_data = {
    "patient_id": "4b76e6bf-d48c-40bc-be25-27e6fed48ac1",
    "provider_id": "22222222-2222-2222-2222-222222222222",
    "facility_id": "11111111-1111-1111-1111-111111111111",
    "service_type": "Wound Care Authorization",
    "priority": "high",
    "selected_products": [
        {
            "product_name": "RAMPART Wound Care Matrix",
            "q_code": "Q4347",
            "total_quantity": 7,
            "total_cost": "1475.00",
            "sizes": [
                {
                    "size": "2X2",
                    "dimensions": "2x2 cm",
                    "unit_price": "125.00",
                    "quantity": 5,
                    "total": "625.00"
                },
                {
                    "size": "4X4",
                    "dimensions": "4x4 cm",
                    "unit_price": "425.00",
                    "quantity": 2,
                    "total": "850.00"
                }
            ]
        }
    ],
    "notes": "Test IVR request with multi-size products"
}


async def test_ivr_api():
    """Test the IVR API endpoints."""

    base_url = "http://localhost:8000"

    async with httpx.AsyncClient() as client:
        # First, login to get a token
        login_data = {
            "username": "doctor@healthcare.local",
            "password": "doctor123"
        }

        print("🔐 Logging in...")
        login_response = await client.post(
            f"{base_url}/api/v1/auth/login",
            data=login_data
        )

        if login_response.status_code != 200:
            print(f"❌ Login failed: {login_response.status_code}")
            print(login_response.text)
            return False

        token_data = login_response.json()
        token = token_data.get("access_token")

        if not token:
            print("❌ No access token received")
            return False

        print("✅ Login successful")

        # Set authorization header
        headers = {"Authorization": f"Bearer {token}"}

        # Test creating IVR request with multi-size products
        print("📝 Creating IVR request with multi-size products...")

        create_response = await client.post(
            f"{base_url}/api/v1/ivr/requests",
            json=test_data,
            headers=headers
        )

        print(f"Response status: {create_response.status_code}")
        print(f"Response body: {create_response.text}")

        if create_response.status_code == 201:
            print("✅ IVR request created successfully!")

            # Get the created request
            response_data = create_response.json()
            request_id = response_data.get("id")

            if request_id:
                print(f"📋 Retrieving IVR request: {request_id}")

                get_response = await client.get(
                    f"{base_url}/api/v1/ivr/requests/{request_id}",
                    headers=headers
                )

                if get_response.status_code == 200:
                    print("✅ IVR request retrieved successfully!")
                    retrieved_data = get_response.json()
                    print(f"Products: {len(retrieved_data.get('products', []))}")
                    return True
                else:
                    print(f"❌ Failed to retrieve IVR request: {get_response.status_code}")
                    print(get_response.text)
                    return False
            else:
                print("❌ No request ID in response")
                return False
        else:
            print(f"❌ Failed to create IVR request: {create_response.status_code}")
            return False


if __name__ == "__main__":
    success = asyncio.run(test_ivr_api())
    if success:
        print("🎉 All tests passed!")
    else:
        print("💥 Tests failed!")