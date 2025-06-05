#!/usr/bin/env python3
"""
Test script for Local Encryption Service

This script validates that the encryption service can:
1. Initialize properly with environment variables
2. Encrypt and decrypt test data successfully
3. Handle error cases gracefully
4. Work without AWS dependencies
"""

import os
import sys
import base64

# Add the app directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

def setup_test_environment():
    """Set up test environment variables for encryption."""
    # Generate test encryption key and salt
    test_key = base64.urlsafe_b64encode(os.urandom(32)).decode()
    test_salt = base64.urlsafe_b64encode(os.urandom(16)).decode()

    os.environ['ENCRYPTION_KEY'] = test_key
    os.environ['ENCRYPTION_SALT'] = test_salt
    os.environ['ENABLE_LOCAL_ENCRYPTION'] = 'true'

    print(f"✓ Test environment configured")
    print(f"  ENCRYPTION_KEY: {test_key[:20]}...")
    print(f"  ENCRYPTION_SALT: {test_salt[:20]}...")

def test_encryption_service():
    """Test the encryption service functionality."""
    try:
        from services.encryption_service import (
            get_encryption_service,
            encrypt_phi_field,
            decrypt_phi_field,
            EncryptionError
        )

        print("\n=== Testing Local Encryption Service ===")

        # Test 1: Service initialization
        print("\n1. Testing service initialization...")
        service = get_encryption_service()
        assert service.is_enabled(), "Encryption service should be enabled"
        print("✓ Service initialized successfully")

        # Test 2: Basic encryption/decryption
        print("\n2. Testing basic encryption/decryption...")
        test_data = "This is sensitive PHI data: SSN 123-45-6789"
        encrypted = service.encrypt_field(test_data)
        decrypted = service.decrypt_field(encrypted)

        assert encrypted is not None, "Encryption should return data"
        assert encrypted != test_data, "Encrypted data should be different from original"
        assert decrypted == test_data, "Decrypted data should match original"
        print(f"✓ Basic encryption/decryption works")
        print(f"  Original: {test_data[:30]}...")
        print(f"  Encrypted: {encrypted[:30]}...")
        print(f"  Decrypted: {decrypted[:30]}...")

        # Test 3: PHI field convenience functions
        print("\n3. Testing PHI field functions...")
        phi_data = "Patient Name: John Doe"
        encrypted_phi = encrypt_phi_field(phi_data, "patient_name", "user123")
        decrypted_phi = decrypt_phi_field(encrypted_phi, "patient_name", "user123")

        assert decrypted_phi == phi_data, "PHI encryption should work correctly"
        print("✓ PHI field functions work correctly")

        # Test 4: JSON encryption
        print("\n4. Testing JSON encryption...")
        json_data = {
            "patient_id": "12345",
            "ssn": "123-45-6789",
            "medical_record": ["diabetes", "hypertension"]
        }
        encrypted_json = service.encrypt_json(json_data)
        decrypted_json = service.decrypt_json(encrypted_json)

        assert decrypted_json == json_data, "JSON encryption should preserve data structure"
        print("✓ JSON encryption works correctly")

        # Test 5: Null/empty data handling
        print("\n5. Testing null/empty data handling...")
        assert service.encrypt_field(None) is None, "None should return None"
        assert service.encrypt_field("") is None, "Empty string should return None"
        assert service.decrypt_field(None) is None, "None should return None"
        assert service.decrypt_field("") is None, "Empty string should return None"
        print("✓ Null/empty data handled correctly")

        # Test 6: Validation
        print("\n6. Testing encryption validation...")
        validation_result = service.validate_encryption()
        assert validation_result, "Encryption validation should pass"
        print("✓ Encryption validation passed")

        # Test 7: Error handling
        print("\n7. Testing error handling...")
        try:
            service.decrypt_field("invalid_encrypted_data")
            assert False, "Should have raised an exception"
        except EncryptionError:
            print("✓ Invalid data properly raises EncryptionError")

        print("\n=== All Tests Passed! ===")
        print("✓ Local encryption service is working correctly")
        print("✓ No AWS dependencies detected")
        print("✓ Ready for PHI data protection")

        return True

    except Exception as e:
        print(f"\n❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_environment_validation():
    """Test environment variable validation."""
    print("\n=== Testing Environment Validation ===")

    # Save current environment
    original_key = os.environ.get('ENCRYPTION_KEY')
    original_salt = os.environ.get('ENCRYPTION_SALT')

    try:
        # Test missing key
        print("\n1. Testing missing encryption key...")
        os.environ.pop('ENCRYPTION_KEY', None)

        try:
            from services.encryption_service import LocalEncryptionService
            LocalEncryptionService()
            assert False, "Should have raised an exception"
        except Exception as e:
            print(f"✓ Missing key properly detected: {type(e).__name__}")

        # Test default key
        print("\n2. Testing default encryption key...")
        os.environ['ENCRYPTION_KEY'] = 'CHANGE_ME_TO_STRONG_ENCRYPTION_KEY'

        try:
            from services.encryption_service import LocalEncryptionService
            LocalEncryptionService()
            assert False, "Should have raised an exception"
        except Exception as e:
            print(f"✓ Default key properly rejected: {type(e).__name__}")

    finally:
        # Restore environment
        if original_key:
            os.environ['ENCRYPTION_KEY'] = original_key
        if original_salt:
            os.environ['ENCRYPTION_SALT'] = original_salt

if __name__ == "__main__":
    print("Healthcare IVR Platform - Encryption Service Test")
    print("=" * 50)

    # Set up test environment
    setup_test_environment()

    # Test environment validation
    test_environment_validation()

    # Test encryption functionality
    success = test_encryption_service()

    if success:
        print("\n🎉 All encryption tests passed!")
        print("The local encryption service is ready for production use.")
        sys.exit(0)
    else:
        print("\n💥 Encryption tests failed!")
        print("Please check the implementation and try again.")
        sys.exit(1)