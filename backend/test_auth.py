#!/usr/bin/env python3
"""
Test script to verify authentication functionality.
"""

import os
import sys
import logging
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Set environment variables for testing
os.environ["AUTH_MODE"] = "local"
os.environ["ENVIRONMENT"] = "development"
os.environ["DEBUG"] = "true"

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Import after path setup
from app.services.mock_auth_service import mock_auth_service  # noqa: E402
from app.core.config import settings  # noqa: E402


def test_mock_auth_service():
    """Test the mock authentication service."""
    print("=== Testing Mock Authentication Service ===")

    # Test environment detection
    print(f"Environment: {os.getenv('ENVIRONMENT')}")
    print(f"AUTH_MODE: {settings.AUTH_MODE}")
    print(f"Is development mode: {mock_auth_service.is_development_mode()}")

    # Test available mock users
    print("\nAvailable mock users:")
    mock_users = mock_auth_service.get_mock_credentials()
    for email, creds in mock_users.items():
        role = creds['role']
        password = creds['password']
        print(f"  {email}: {password} (Role: {role})")

    # Test authentication with correct credentials
    print("\n=== Testing Authentication ===")

    test_cases = [
        ("admin@healthcare.local", "admin123", True),
        ("doctor@healthcare.local", "doctor123", True),
        ("ivr@healthcare.local", "ivr123", True),
        ("admin@healthcare.local", "wrong_password", False),
        ("nonexistent@healthcare.local", "password", False),
    ]

    for email, password, should_succeed in test_cases:
        print(f"\nTesting: {email} / {password}")
        result = mock_auth_service.authenticate_mock_user(email, password)

        if should_succeed:
            if result:
                first_name = result['first_name']
                last_name = result['last_name']
                role_id = result['role_id']
                print(f"  ✅ SUCCESS: {first_name} {last_name} ({role_id})")
            else:
                print("  ❌ FAILED: Expected success but got None")
        else:
            if result is None:
                print("  ✅ SUCCESS: Correctly rejected invalid credentials")
            else:
                print(f"  ❌ FAILED: Expected failure but got: {result}")


if __name__ == "__main__":
    test_mock_auth_service()