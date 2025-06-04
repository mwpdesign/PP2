#!/usr/bin/env python3
"""
🔐 Healthcare IVR Platform - Authentication Verification Script
==============================================================

This script verifies that the authentication system is working correctly.
Perfect for testing after setup or troubleshooting login issues.

Usage: python scripts/verify_auth.py
"""

import asyncio
import os
import sys
from datetime import datetime

# Add backend to path for imports
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)


def print_header():
    """Print a simple header."""
    print("\n" + "="*50)
    print("🔐 Healthcare IVR - Quick Authentication Test")
    print("="*50)
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*50 + "\n")


def print_step(step_num, description):
    """Print a test step."""
    print(f"📋 Step {step_num}: {description}")


def print_success(message):
    """Print a success message."""
    print(f"✅ SUCCESS: {message}")


def print_error(message):
    """Print an error message."""
    print(f"❌ ERROR: {message}")


def print_info(message):
    """Print an info message."""
    print(f"ℹ️  INFO: {message}")


async def test_basic_auth():
    """Test basic authentication functionality."""
    print_header()

    # Check if httpx is available
    try:
        import httpx
    except ImportError:
        print_error("Missing required package 'httpx'")
        print_info("Install with: pip install httpx")
        return False

    base_url = "http://localhost:8000"
    admin_email = "admin@example.com"
    admin_password = "password123"

    # Step 1: Check backend
    print_step(1, "Checking backend server")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{base_url}/test", timeout=5.0)
            if response.status_code == 200:
                print_success("Backend server is running")
            else:
                print_error(f"Backend error (status {response.status_code})")
                return False
    except Exception:
        print_error("Cannot connect to backend")
        print_info("Make sure backend is running:")
        print_info("cd backend && python -m uvicorn app.main:app --reload")
        return False

    print()

    # Step 2: Test login
    print_step(2, "Testing admin login")
    try:
        async with httpx.AsyncClient() as client:
            login_data = {
                "username": admin_email,
                "password": admin_password
            }

            response = await client.post(
                f"{base_url}/api/v1/auth/login",
                data=login_data,
                timeout=10.0
            )

            if response.status_code == 200:
                data = response.json()
                if "access_token" in data:
                    print_success("Admin login successful")
                    token = data["access_token"]
                else:
                    print_error("Login response missing token")
                    return False
            elif response.status_code == 401:
                print_error("Invalid credentials")
                print_info("Run: python scripts/seed_admin_user.py")
                return False
            else:
                print_error(f"Login failed (status {response.status_code})")
                return False

    except Exception as e:
        print_error(f"Login test failed: {str(e)}")
        return False

    print()

    # Step 3: Test token
    print_step(3, "Testing authentication token")
    try:
        headers = {"Authorization": f"Bearer {token}"}

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{base_url}/api/v1/auth/me",
                headers=headers,
                timeout=10.0
            )

            if response.status_code == 200:
                user_data = response.json()
                print_success("Token validation successful")
                email = user_data.get('email', 'Unknown')
                print_info(f"Logged in as: {email}")
            else:
                print_error("Token validation failed")
                return False

    except Exception as e:
        print_error(f"Token test failed: {str(e)}")
        return False

    print()

    # Summary
    print("="*50)
    print("🎉 ALL TESTS PASSED!")
    print("Authentication system is working correctly.")
    print("="*50 + "\n")

    return True


async def main():
    """Main function."""
    try:
        success = await test_basic_auth()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n⚠️  Test cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
