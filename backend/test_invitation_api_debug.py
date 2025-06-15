#!/usr/bin/env python3
"""
Comprehensive API Debug Test for Invitation System
This script will test the invitation API endpoints and capture exact errors.
"""

import asyncio
import json
import requests
import sys
from datetime import datetime

# Test configuration
BASE_URL = "http://localhost:8000"
LOGIN_URL = f"{BASE_URL}/api/v1/auth/login"
INVITATION_URL = f"{BASE_URL}/api/v1/invitations/"

# Test credentials
TEST_CREDENTIALS = {
    "username": "admin@healthcare.local",
    "password": "admin123"
}

# Test invitation data
TEST_INVITATION = {
    "email": "test.doctor@example.com",
    "invitation_type": "doctor",
    "role_name": "doctor",
    "organization_id": "2276e0c1-6a32-470e-b7e7-dcdbb286d76b",  # Admin user's organization
    "first_name": "Test",
    "last_name": "Doctor",
    "invitation_message": "Welcome to our healthcare platform",
    "expires_in_days": 7
}

def print_section(title):
    """Print a formatted section header"""
    print(f"\n{'='*60}")
    print(f"🔍 {title}")
    print(f"{'='*60}")

def print_step(step, description):
    """Print a formatted step"""
    print(f"\n📋 STEP {step}: {description}")
    print("-" * 50)

def print_success(message):
    """Print success message"""
    print(f"✅ {message}")

def print_error(message):
    """Print error message"""
    print(f"❌ {message}")

def print_info(message):
    """Print info message"""
    print(f"ℹ️  {message}")

def test_login():
    """Test login and return auth token"""
    print_step(1, "Testing Login")

    try:
        # Use form data instead of JSON for OAuth2PasswordRequestForm
        form_data = {
            "username": TEST_CREDENTIALS["username"],
            "password": TEST_CREDENTIALS["password"]
        }

        response = requests.post(
            LOGIN_URL,
            data=form_data,  # Use data instead of json
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=10
        )

        print_info(f"Login URL: {LOGIN_URL}")
        print_info(f"Request data: {form_data}")
        print_info(f"Response status: {response.status_code}")
        print_info(f"Response headers: {dict(response.headers)}")

        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            if token:
                print_success(f"Login successful! Token: {token[:20]}...")
                return token
            else:
                print_error("Login response missing access_token")
                print_info(f"Response data: {json.dumps(data, indent=2)}")
                return None
        else:
            print_error(f"Login failed with status {response.status_code}")
            try:
                error_data = response.json()
                print_info(f"Error response: {json.dumps(error_data, indent=2)}")
            except:
                print_info(f"Raw response: {response.text}")
            return None

    except requests.exceptions.RequestException as e:
        print_error(f"Login request failed: {str(e)}")
        return None
    except Exception as e:
        print_error(f"Unexpected error during login: {str(e)}")
        return None

def test_invitation_creation(auth_token):
    """Test invitation creation with detailed error capture"""
    print_step(2, "Testing Invitation Creation")

    if not auth_token:
        print_error("No auth token available - skipping invitation test")
        return False

    headers = {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }

    try:
        print_info(f"Invitation URL: {INVITATION_URL}")
        print_info(f"Headers: {json.dumps(headers, indent=2)}")
        print_info(f"Request data: {json.dumps(TEST_INVITATION, indent=2)}")

        response = requests.post(
            INVITATION_URL,
            json=TEST_INVITATION,
            headers=headers,
            timeout=30
        )

        print_info(f"Response status: {response.status_code}")
        print_info(f"Response headers: {dict(response.headers)}")

        if response.status_code == 201:
            data = response.json()
            print_success("Invitation created successfully!")
            print_info(f"Response data: {json.dumps(data, indent=2)}")
            return True
        else:
            print_error(f"Invitation creation failed with status {response.status_code}")
            try:
                error_data = response.json()
                print_info(f"Error response: {json.dumps(error_data, indent=2)}")
            except:
                print_info(f"Raw response: {response.text}")
            return False

    except requests.exceptions.RequestException as e:
        print_error(f"Invitation request failed: {str(e)}")
        return False
    except Exception as e:
        print_error(f"Unexpected error during invitation creation: {str(e)}")
        return False

def test_invitation_list(auth_token):
    """Test invitation listing"""
    print_step(3, "Testing Invitation List")

    if not auth_token:
        print_error("No auth token available - skipping list test")
        return False

    headers = {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.get(
            INVITATION_URL,
            headers=headers,
            timeout=10
        )

        print_info(f"List URL: {INVITATION_URL}")
        print_info(f"Response status: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print_success("Invitation list retrieved successfully!")
            print_info(f"Total invitations: {data.get('total_count', 0)}")
            print_info(f"Response data: {json.dumps(data, indent=2)}")
            return True
        else:
            print_error(f"Invitation list failed with status {response.status_code}")
            try:
                error_data = response.json()
                print_info(f"Error response: {json.dumps(error_data, indent=2)}")
            except:
                print_info(f"Raw response: {response.text}")
            return False

    except requests.exceptions.RequestException as e:
        print_error(f"List request failed: {str(e)}")
        return False
    except Exception as e:
        print_error(f"Unexpected error during list: {str(e)}")
        return False

def check_backend_status():
    """Check if backend is running"""
    print_step(0, "Checking Backend Status")

    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            print_success("Backend is running!")
            return True
        else:
            print_error(f"Backend health check failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print_error(f"Backend is not accessible: {str(e)}")
        print_info("Make sure backend is running on localhost:8000")
        return False

def main():
    """Main test function"""
    print_section("INVITATION API DEBUG TEST")
    print_info(f"Test started at: {datetime.now()}")
    print_info(f"Backend URL: {BASE_URL}")

    # Check backend status
    if not check_backend_status():
        print_error("Backend is not running. Please start the backend server first.")
        sys.exit(1)

    # Test login
    auth_token = test_login()
    if not auth_token:
        print_error("Login failed. Cannot proceed with invitation tests.")
        sys.exit(1)

    # Test invitation creation
    creation_success = test_invitation_creation(auth_token)

    # Test invitation listing
    list_success = test_invitation_list(auth_token)

    # Summary
    print_section("TEST SUMMARY")
    print_info(f"Login: {'✅ PASSED' if auth_token else '❌ FAILED'}")
    print_info(f"Invitation Creation: {'✅ PASSED' if creation_success else '❌ FAILED'}")
    print_info(f"Invitation List: {'✅ PASSED' if list_success else '❌ FAILED'}")

    if creation_success and list_success:
        print_success("All tests passed! Invitation system is working correctly.")
        sys.exit(0)
    else:
        print_error("Some tests failed. Check the detailed output above.")
        sys.exit(1)

if __name__ == "__main__":
    main()