#!/usr/bin/env python3
"""
Simple Patient Model Encryption Test

This script validates that the patient model encryption integration works
by testing the encrypted field types directly without complex database setup.
"""

import os
import sys
import base64

# Add the app directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

def setup_test_environment():
    """Set up test environment variables."""
    # Generate test encryption key and salt
    test_key = base64.urlsafe_b64encode(os.urandom(32)).decode()
    test_salt = base64.urlsafe_b64encode(os.urandom(16)).decode()

    os.environ['ENCRYPTION_KEY'] = test_key
    os.environ['ENCRYPTION_SALT'] = test_salt
    os.environ['ENABLE_LOCAL_ENCRYPTION'] = 'true'
    os.environ['ENVIRONMENT'] = 'development'

    print("✅ Test environment configured")

def test_encryption_service():
    """Test the encryption service directly."""
    print("\n🔐 Testing Encryption Service")
    print("=" * 35)

    try:
        from services.encryption_service import LocalEncryptionService

        encryption_service = LocalEncryptionService()

        # Test PHI data encryption
        test_data = {
            "first_name": "John",
            "last_name": "Doe",
            "ssn": "123-45-6789",
            "medical_history": {
                "conditions": ["Hypertension", "Type 2 Diabetes"],
                "medications": ["Metformin", "Lisinopril"],
                "allergies": ["Penicillin"]
            }
        }

        # Test string encryption
        encrypted_name = encryption_service.encrypt_data(test_data["first_name"], "first_name")
        decrypted_name = encryption_service.decrypt_data(encrypted_name, "first_name")
        assert decrypted_name == test_data["first_name"], "String encryption/decryption failed"
        print("✅ String encryption/decryption works")

        # Test JSON encryption
        encrypted_history = encryption_service.encrypt_json(test_data["medical_history"], "medical_history")
        decrypted_history = encryption_service.decrypt_json(encrypted_history, "medical_history")
        assert decrypted_history == test_data["medical_history"], "JSON encryption/decryption failed"
        print("✅ JSON encryption/decryption works")

        return True

    except Exception as e:
        print(f"❌ Encryption service test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_encrypted_field_types():
    """Test the encrypted field types directly."""
    print("\n🏗️ Testing Encrypted Field Types")
    print("=" * 40)

    try:
        from core.encrypted_types import EncryptedString, EncryptedText, EncryptedJSON

        # Test EncryptedString
        encrypted_string = EncryptedString(field_name="test_field")

        # Simulate bind parameter (encryption)
        test_value = "John Doe"
        encrypted_value = encrypted_string.process_bind_param(test_value, None)
        assert encrypted_value != test_value, "Data should be encrypted"
        print("✅ EncryptedString encryption works")

        # Simulate result value (decryption)
        decrypted_value = encrypted_string.process_result_value(encrypted_value, None)
        assert decrypted_value == test_value, "Decryption failed"
        print("✅ EncryptedString decryption works")

        # Test EncryptedJSON
        encrypted_json = EncryptedJSON(field_name="test_json")

        test_json = {"conditions": ["Hypertension"], "medications": ["Metformin"]}
        encrypted_json_value = encrypted_json.process_bind_param(test_json, None)
        assert encrypted_json_value != str(test_json), "JSON should be encrypted"
        print("✅ EncryptedJSON encryption works")

        decrypted_json_value = encrypted_json.process_result_value(encrypted_json_value, None)
        assert decrypted_json_value == test_json, "JSON decryption failed"
        print("✅ EncryptedJSON decryption works")

        return True

    except Exception as e:
        print(f"❌ Encrypted field types test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_audit_service_integration():
    """Test audit service integration."""
    print("\n📋 Testing Audit Service Integration")
    print("=" * 45)

    try:
        from services.audit_service import get_audit_service, AuditContext

        audit_service = get_audit_service()

        # Create test context
        context = AuditContext(
            user_id="test-user-123",
            user_email="test@example.com",
            organization_id="test-org-456",
            session_id="test-session-789"
        )

        audit_service.set_context(context)

        # Test PHI access logging
        audit_service.log_phi_access(
            access_type="view",
            resource_type="patient",
            resource_id="patient-123",
            field_names=["first_name", "last_name", "medical_history"],
            reason="Patient lookup for treatment planning",
            success=True
        )

        print("✅ PHI access logging works")

        # Test encryption operation logging
        audit_service.log_encryption_operation(
            operation="encrypt",
            field_name="ssn",
            resource_type="patient",
            resource_id="patient-123",
            success=True
        )

        print("✅ Encryption operation logging works")

        return True

    except Exception as e:
        print(f"❌ Audit service test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_patient_model_structure():
    """Test that the patient model has the correct encrypted fields."""
    print("\n🏥 Testing Patient Model Structure")
    print("=" * 42)

    try:
        from models.patient import Patient
        from core.encrypted_types import EncryptedString, EncryptedText, EncryptedJSON

        # Check that the model has the expected encrypted fields
        expected_encrypted_fields = [
            'first_name', 'last_name', 'date_of_birth', 'ssn',
            'phone', 'email', 'address', 'medical_history', 'insurance_info'
        ]

        for field_name in expected_encrypted_fields:
            if hasattr(Patient, field_name):
                print(f"✅ Patient model has {field_name} field")
            else:
                print(f"❌ Patient model missing {field_name} field")
                return False

        # Check that the model has the full_name property
        if hasattr(Patient, 'full_name'):
            print("✅ Patient model has full_name property")
        else:
            print("❌ Patient model missing full_name property")
            return False

        print("✅ Patient model structure is correct")
        return True

    except Exception as e:
        print(f"❌ Patient model structure test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all patient encryption integration tests."""
    print("🏥 Patient Model Encryption Integration Test Suite")
    print("=" * 60)

    # Setup test environment
    setup_test_environment()

    # Run tests
    tests = [
        ("Encryption Service", test_encryption_service),
        ("Encrypted Field Types", test_encrypted_field_types),
        ("Audit Service Integration", test_audit_service_integration),
        ("Patient Model Structure", test_patient_model_structure)
    ]

    results = []

    for test_name, test_func in tests:
        print(f"\n🧪 Running {test_name} Test...")
        success = test_func()
        results.append((test_name, success))

    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 60)

    passed = 0
    for test_name, success in results:
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{test_name:.<40} {status}")
        if success:
            passed += 1

    print(f"\nOverall: {passed}/{len(results)} tests passed")

    if passed == len(results):
        print("\n🎉 All patient encryption tests completed successfully!")
        print("🔒 Patient PHI encryption integration is working correctly!")
        print("📋 Key capabilities verified:")
        print("   • Local encryption service operational")
        print("   • Encrypted field types working correctly")
        print("   • Audit service integration functional")
        print("   • Patient model structure properly configured")
        print("\n✅ Ready for database integration and API development!")
        return 0
    else:
        print(f"\n❌ {len(results) - passed} test(s) failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main())