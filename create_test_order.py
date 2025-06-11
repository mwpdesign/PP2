#!/usr/bin/env python3
"""
Script to create test IVR and order data for testing the Order Detail page.
"""

import requests
import sys
from uuid import uuid4


# API Configuration
API_BASE = "http://localhost:8000"
LOGIN_ENDPOINT = f"{API_BASE}/api/v1/auth/login"
IVR_ENDPOINT = f"{API_BASE}/api/v1/ivr/requests/"
ORDER_ENDPOINT = f"{API_BASE}/api/v1/orders/"

# Test credentials
USERNAME = "doctor@healthcare.local"
PASSWORD = "doctor123"


def get_auth_token():
    """Get authentication token"""
    try:
        response = requests.post(
            LOGIN_ENDPOINT,
            data={
                "username": USERNAME,
                "password": PASSWORD
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )

        if response.status_code == 200:
            data = response.json()
            return data.get("access_token")
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(response.text)
            return None
    except Exception as e:
        print(f"❌ Login error: {e}")
        return None

def create_approved_ivr(token):
    """Create an approved IVR request"""
    ivr_data = {
        "patient_id": str(uuid4()),
        "patient_name": "John Smith",
        "provider_id": str(uuid4()),
        "provider_name": "Dr. Sarah Johnson",
        "facility_id": str(uuid4()),
        "status": "approved",
        "priority": "medium",
        "service_type": "wound_care",
        "diagnosis_code": "L89.90",
        "treatment_plan": "Advanced wound care with skin graft application for chronic wound management",
        "insurance_carrier": "Blue Cross Blue Shield",
        "policy_number": "BCBS123456789",
        "group_number": "GRP001",
        "selected_products": [
            {
                "product_name": "Advanced Skin Graft - Type A",
                "q_code": "Q4100",
                "total_quantity": 2,
                "total_cost": 1500.00,
                "sizes": [
                    {
                        "size": "2x2 cm",
                        "dimensions": "2x2",
                        "unit_price": 750.00,
                        "quantity": 2,
                        "total": 1500.00
                    }
                ]
            },
            {
                "product_name": "Antimicrobial Wound Dressing",
                "q_code": "A6196",
                "total_quantity": 5,
                "total_cost": 250.00,
                "sizes": [
                    {
                        "size": "4x4 inch",
                        "dimensions": "4x4",
                        "unit_price": 50.00,
                        "quantity": 5,
                        "total": 250.00
                    }
                ]
            }
        ]
    }

    try:
        response = requests.post(
            IVR_ENDPOINT,
            json=ivr_data,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
        )

        if response.status_code in [200, 201]:
            ivr = response.json()
            print(f"✅ Created approved IVR: {ivr.get('id', 'Unknown ID')}")
            return ivr
        else:
            print(f"❌ Failed to create IVR: {response.status_code}")
            print(response.text)
            return None
    except Exception as e:
        print(f"❌ IVR creation error: {e}")
        return None

def create_order_from_ivr(token, ivr_id):
    """Create an order from an approved IVR"""
    try:
        response = requests.post(
            f"{ORDER_ENDPOINT}create-from-ivr/{ivr_id}",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
        )

        if response.status_code in [200, 201]:
            order = response.json()
            print(f"✅ Created order: {order.get('order_number', 'Unknown')}")
            print(f"   Order ID: {order.get('id', 'Unknown')}")
            print(f"   Patient: {order.get('patient_name', 'Unknown')}")
            print(f"   Total: ${order.get('total_amount', '0.00')}")
            return order
        else:
            print(f"❌ Failed to create order: {response.status_code}")
            print(response.text)
            return None
    except Exception as e:
        print(f"❌ Order creation error: {e}")
        return None

def list_orders(token):
    """List existing orders"""
    try:
        response = requests.get(
            ORDER_ENDPOINT,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
        )

        if response.status_code == 200:
            data = response.json()
            orders = data.get('items', [])
            print(f"📦 Found {len(orders)} orders:")
            for order in orders:
                print(f"   - {order.get('order_number', 'Unknown')}: {order.get('status', 'Unknown')} (${order.get('total_amount', '0.00')})")
            return orders
        else:
            print(f"❌ Failed to list orders: {response.status_code}")
            print(response.text)
            return []
    except Exception as e:
        print(f"❌ Order listing error: {e}")
        return []

def main():
    print("🛒 Creating Test Order for Order Detail Page")
    print("=" * 50)

    # Step 1: Authenticate
    print("\n1. Authenticating...")
    token = get_auth_token()
    if not token:
        print("❌ Authentication failed. Exiting.")
        sys.exit(1)
    print("✅ Authentication successful")

    # Step 2: Check existing orders
    print("\n2. Checking existing orders...")
    existing_orders = list_orders(token)

    if existing_orders:
        print(f"✅ Found {len(existing_orders)} existing orders")
        print("\n🔗 Test the Order Detail page with these orders:")
        for order in existing_orders:
            order_id = order.get('id', 'unknown')
            order_number = order.get('order_number', 'Unknown')
            print(f"   http://localhost:3000/doctor/orders/{order_id}")
        return

    # Step 3: Create approved IVR
    print("\n3. Creating approved IVR...")
    ivr = create_approved_ivr(token)
    if not ivr:
        print("❌ Failed to create IVR. Exiting.")
        sys.exit(1)

    # Step 4: Create order from IVR
    print("\n4. Creating order from IVR...")
    order = create_order_from_ivr(token, ivr.get('id'))
    if not order:
        print("❌ Failed to create order. Exiting.")
        sys.exit(1)

    # Step 5: Provide test links
    print("\n🎉 Test Order Created Successfully!")
    print("=" * 50)
    order_id = order.get('id')
    order_number = order.get('order_number')

    print(f"\n📋 Order Details:")
    print(f"   Order Number: {order_number}")
    print(f"   Order ID: {order_id}")
    print(f"   Patient: {order.get('patient_name', 'Unknown')}")
    print(f"   Status: {order.get('status', 'Unknown')}")
    print(f"   Total: ${order.get('total_amount', '0.00')}")

    print(f"\n🔗 Test Links:")
    print(f"   Order Detail Page: http://localhost:3000/doctor/orders/{order_id}")
    print(f"   Order Management: http://localhost:3000/doctor/orders")
    print(f"   Test Page: http://localhost:3000/test_order_detail_page.html")
    print(f"   Create Order Page: http://localhost:3000/test_create_order.html")

    print(f"\n✅ Ready to test the Order Detail page!")

if __name__ == "__main__":
    main()