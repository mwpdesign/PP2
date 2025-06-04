#!/usr/bin/env python3
"""
Test script to simulate frontend authentication requests.
"""

import os
import sys
import requests
import json
from pathlib import Path

# Set environment variables for testing
os.environ["AUTH_MODE"] = "local"
os.environ["ENVIRONMENT"] = "development"
os.environ["DEBUG"] = "true"

def test_frontend_auth_requests():
    """Test various frontend authentication request formats."""
    print("=== Testing Frontend Authentication Requests ===")

    base_url = "http://localhost:8000"
    login_url = f"{base_url}/api/v1/auth/login"

    # Test cases simulating different frontend request formats
    test_cases = [
        {
            "name": "Correct Mock Credentials (URLSearchParams)",
            "method": "POST",
            "headers": {"Content-Type": "application/x-www-form-urlencoded"},
            "data": "username=admin@healthcare.local&password=admin123",
            "expected": 200
        },
        {
            "name": "Correct Mock Credentials (form data)",
            "method": "POST",
            "headers": {"Content-Type": "application/x-www-form-urlencoded"},
            "data": {"username": "admin@healthcare.local", "password": "admin123"},
            "expected": 200
        },
        {
            "name": "Doctor Credentials",
            "method": "POST",
            "headers": {"Content-Type": "application/x-www-form-urlencoded"},
            "data": "username=doctor@healthcare.local&password=doctor123",
            "expected": 200
        },
        {
            "name": "IVR Credentials",
            "method": "POST",
            "headers": {"Content-Type": "application/x-www-form-urlencoded"},
            "data": "username=ivr@healthcare.local&password=ivr123",
            "expected": 200
        },
        {
            "name": "Wrong Credentials (should fail)",
            "method": "POST",
            "headers": {"Content-Type": "application/x-www-form-urlencoded"},
            "data": "username=admin@healthcare.local&password=wrongpassword",
            "expected": 401
        },
        {
            "name": "Old Demo Credentials (should fail)",
            "method": "POST",
            "headers": {"Content-Type": "application/x-www-form-urlencoded"},
            "data": "username=admin@demo.com&password=demo123",
            "expected": 401
        },
        {
            "name": "JSON Format (should work with FastAPI)",
            "method": "POST",
            "headers": {"Content-Type": "application/json"},
            "data": json.dumps({"username": "admin@healthcare.local", "password": "admin123"}),
            "expected": 200
        },
        {
            "name": "Credentials with extra whitespace",
            "method": "POST",
            "headers": {"Content-Type": "application/x-www-form-urlencoded"},
            "data": "username= admin@healthcare.local &password= admin123 ",
            "expected": 200
        }
    ]

    for i, test_case in enumerate(test_cases, 1):
        print(f"\n{i}. Testing: {test_case['name']}")
        print(f"   URL: {login_url}")
        print(f"   Headers: {test_case['headers']}")
        print(f"   Data: {test_case['data']}")

        try:
            if isinstance(test_case['data'], dict):
                response = requests.post(
                    login_url,
                    headers=test_case['headers'],
                    data=test_case['data'],
                    timeout=10
                )
            else:
                response = requests.post(
                    login_url,
                    headers=test_case['headers'],
                    data=test_case['data'],
                    timeout=10
                )

            print(f"   Status: {response.status_code}")

            if response.status_code == test_case['expected']:
                print(f"   ✅ SUCCESS: Got expected status {test_case['expected']}")
                if response.status_code == 200:
                    try:
                        response_data = response.json()
                        print(f"   Token received: {response_data.get('access_token', 'None')[:50]}...")
                        print(f"   Token type: {response_data.get('token_type', 'None')}")
                    except:
                        print(f"   Response: {response.text[:100]}...")
                else:
                    try:
                        error_data = response.json()
                        print(f"   Error: {error_data.get('detail', 'Unknown error')}")
                    except:
                        print(f"   Error response: {response.text[:100]}...")
            else:
                print(f"   ❌ FAILED: Expected {test_case['expected']}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data.get('detail', 'Unknown error')}")
                except:
                    print(f"   Response: {response.text[:100]}...")

        except requests.exceptions.ConnectionError:
            print(f"   ❌ FAILED: Could not connect to server at {login_url}")
            print("   Make sure the backend server is running!")
            break
        except Exception as e:
            print(f"   ❌ FAILED: Unexpected error: {str(e)}")

def test_server_status():
    """Check if the server is running."""
    try:
        response = requests.get("http://localhost:8000/docs", timeout=5)
        if response.status_code == 200:
            print("✅ Server is running and accessible")
            return True
        else:
            print(f"❌ Server responded with status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Server is not running or not accessible")
        return False
    except Exception as e:
        print(f"❌ Error checking server status: {str(e)}")
        return False

if __name__ == "__main__":
    print("=== Frontend Authentication Debug Tool ===")

    # Check server status first
    if test_server_status():
        test_frontend_auth_requests()
    else:
        print("\nPlease start the backend server first:")
        print("cd backend")
        print("export AUTH_MODE=local && export ENVIRONMENT=development && export DEBUG=true")
        print("python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload")