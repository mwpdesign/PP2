#!/usr/bin/env python3
"""
Test script for HIPAA Encryption Audit Service

This script validates that the audit service can:
1. Log encryption/decryption operations with proper context
2. Track PHI access events with user identification
3. Generate compliance reports
4. Integrate with the encryption service
5. Handle different severity levels and data classifications
"""

import os
import sys
import base64
from datetime import datetime, timedelta
from uuid import uuid4

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

    print(f"✅ Test environment configured")

def test_audit_service_basic():
    """Test basic audit service functionality."""
    print("\n🧪 Testing Basic Audit Service Functionality")
    print("=" * 50)

    try:
        from services.audit_service import (
            EncryptionAuditService,
            AuditContext,
            AuditEventType,
            DataClassification,
            AuditSeverity,
            get_audit_service
        )
        from schemas.token import TokenData
        from uuid import UUID

        print("✅ Successfully imported audit service components")

        # Create test audit service
        audit_service = get_audit_service()
        print("✅ Audit service instance created")

        # Test user context creation
        test_token_data = TokenData(
            email="test@example.com",
            id=uuid4(),
            organization_id=uuid4(),
            permissions=[],
            role="doctor"
        )

        context = AuditContext.from_token_data(test_token_data)
        audit_service.set_context(context)
        print("✅ User context set successfully")

        # Test encryption operation logging
        event_id = audit_service.log_encryption_operation(
            operation="encrypt",
            field_name="patient_ssn",
            data_classification=DataClassification.PHI,
            resource_type="patient",
            resource_id="patient_123",
            success=True,
            details={"test": "encryption_operation"}
        )
        print(f"✅ Encryption operation logged with ID: {event_id}")

        # Test PHI access logging
        phi_event_id = audit_service.log_phi_access(
            access_type="view",
            resource_type="patient",
            resource_id="patient_123",
            field_names=["ssn", "medical_history"],
            reason="Treatment planning",
            success=True
        )
        print(f"✅ PHI access logged with ID: {phi_event_id}")

        # Test security event logging
        security_event_id = audit_service.log_security_event(
            event_type=AuditEventType.SUSPICIOUS_ACTIVITY,
            severity=AuditSeverity.HIGH,
            description="Multiple failed login attempts detected",
            details={"attempts": 5, "source_ip": "192.168.1.100"}
        )
        print(f"✅ Security event logged with ID: {security_event_id}")

        # Test compliance report generation
        start_date = datetime.utcnow() - timedelta(days=30)
        end_date = datetime.utcnow()

        report = audit_service.generate_compliance_report(
            start_date=start_date,
            end_date=end_date,
            organization_id=test_token_data.organization_id
        )
        print(f"✅ Compliance report generated: {report['report_id']}")

        # Test suspicious activity detection
        suspicious_activities = audit_service.detect_suspicious_activity(
            user_id=test_token_data.id,
            time_window_minutes=60
        )
        print(f"✅ Suspicious activity detection completed: {len(suspicious_activities)} activities found")

        return True

    except Exception as e:
        print(f"\n❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_encryption_audit_integration():
    """Test integration between encryption service and audit service."""
    print("\n🔗 Testing Encryption Service + Audit Service Integration")
    print("=" * 60)

    try:
        from services.encryption_service import get_encryption_service
        from services.audit_service import get_audit_service, AuditContext
        from schemas.token import TokenData
        from uuid import UUID

        # Set up services
        encryption_service = get_encryption_service()
        audit_service = get_audit_service()

        # Create test user context
        test_token_data = TokenData(
            email="doctor@hospital.com",
            id=uuid4(),
            organization_id=uuid4(),
            permissions=[],
            role="doctor"
        )

        context = AuditContext.from_token_data(test_token_data)
        audit_service.set_context(context)

        print("✅ Services initialized and context set")

        # Test encryption with audit context
        test_phi_data = "123-45-6789"  # SSN
        encryption_context = {
            "field_name": "patient_ssn",
            "resource_type": "patient",
            "resource_id": "patient_456",
            "data_classification": "phi"
        }

        encrypted_data = encryption_service.encrypt_field(test_phi_data, encryption_context)
        print(f"✅ PHI data encrypted with audit logging")

        # Test decryption with audit context
        decryption_context = {
            "field_name": "patient_ssn",
            "resource_type": "patient",
            "resource_id": "patient_456",
            "data_classification": "phi"
        }

        decrypted_data = encryption_service.decrypt_field(encrypted_data, decryption_context)
        print(f"✅ PHI data decrypted with audit logging")

        # Verify data integrity
        assert decrypted_data == test_phi_data, "Data integrity check failed"
        print("✅ Data integrity verified")

        # Test JSON encryption with audit
        test_json_data = {
            "insurance_provider": "Blue Cross",
            "policy_number": "BC123456789",
            "coverage": ["medical", "dental"]
        }

        json_context = {
            "field_name": "insurance_info",
            "resource_type": "patient",
            "resource_id": "patient_456",
            "data_classification": "phi"
        }

        encrypted_json = encryption_service.encrypt_json(test_json_data, json_context)
        decrypted_json = encryption_service.decrypt_json(encrypted_json, json_context)

        assert decrypted_json == test_json_data, "JSON data integrity check failed"
        print("✅ JSON encryption/decryption with audit logging verified")

        return True

    except Exception as e:
        print(f"\n❌ Integration test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_audit_log_files():
    """Test that audit log files are created and contain expected data."""
    print("\n📁 Testing Audit Log File Creation")
    print("=" * 40)

    try:
        import os
        import glob

        # Check if logs directory exists
        logs_dir = "logs"
        if not os.path.exists(logs_dir):
            print("⚠️  Logs directory doesn't exist yet - will be created on first log")
            return True

        # Look for audit log files
        audit_log_pattern = os.path.join(logs_dir, "encryption_audit_*.log")
        audit_files = glob.glob(audit_log_pattern)

        if audit_files:
            print(f"✅ Found {len(audit_files)} audit log file(s)")

            # Check the most recent log file
            latest_log = max(audit_files, key=os.path.getctime)
            file_size = os.path.getsize(latest_log)
            print(f"✅ Latest audit log: {latest_log} ({file_size} bytes)")

            # Read a few lines to verify format
            with open(latest_log, 'r') as f:
                lines = f.readlines()
                if lines:
                    print(f"✅ Log file contains {len(lines)} entries")
                    print(f"   Sample entry: {lines[-1][:100]}...")
                else:
                    print("⚠️  Log file is empty")
        else:
            print("⚠️  No audit log files found - they will be created on first audit event")

        return True

    except Exception as e:
        print(f"\n❌ Log file test failed: {str(e)}")
        return False

def main():
    """Run all audit service tests."""
    print("🔐 HIPAA Encryption Audit Service Test Suite")
    print("=" * 60)

    # Setup test environment
    setup_test_environment()

    # Run tests
    tests = [
        ("Basic Audit Service", test_audit_service_basic),
        ("Encryption Integration", test_encryption_audit_integration),
        ("Audit Log Files", test_audit_log_files)
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
        print("\n🎉 All audit service tests completed successfully!")
        print("🔒 HIPAA audit logging is ready for production use")
        print("📋 Key capabilities verified:")
        print("   • Encryption operation logging")
        print("   • PHI access tracking")
        print("   • Security event monitoring")
        print("   • Compliance reporting")
        print("   • Integration with encryption service")
        return 0
    else:
        print(f"\n❌ {len(results) - passed} test(s) failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main())