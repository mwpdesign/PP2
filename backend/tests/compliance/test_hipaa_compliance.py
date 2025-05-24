"""Tests for HIPAA compliance validation framework."""
import pytest
from datetime import datetime, timedelta
from unittest.mock import MagicMock
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.audit import AuditLog
from tests.compliance.hipaa_compliance_validator import HIPAAComplianceValidator


@pytest.fixture
def mock_db():
    """Create a mock database session."""
    return MagicMock(spec=Session)


@pytest.fixture
def compliance_validator(mock_db):
    """Create a HIPAA compliance validator instance."""
    return HIPAAComplianceValidator(mock_db)


@pytest.fixture
def mock_user():
    """Create a mock user for testing."""
    return User(
        id="test_user_id",
        username="test_user",
        email="test@example.com",
        password_history=["old_password_hash1", "old_password_hash2"]
    )


def test_data_encryption_validation(compliance_validator):
    """Test data encryption validation."""
    test_data = "sensitive_patient_data"
    context = {
        "user_id": "test_user",
        "resource_type": "patient_record",
        "resource_id": "123",
        "ip_address": "127.0.0.1",
        "key_age_days": 30
    }

    result = compliance_validator.validate_data_encryption(test_data, context)

    assert result["is_encrypted"] is True
    assert result["encryption_method"] == "AES-256-GCM"
    assert result["compliance_status"] == "PASS"
    assert "ENCRYPTION_METHOD" in result["checks_performed"]
    assert "KEY_ROTATION" in result["checks_performed"]
    assert len(result["failed_checks"]) == 0


def test_data_encryption_key_rotation(compliance_validator):
    """Test encryption key rotation validation."""
    test_data = "sensitive_patient_data"
    context = {
        "user_id": "test_user",
        "resource_type": "patient_record",
        "resource_id": "123",
        "ip_address": "127.0.0.1",
        "key_age_days": 100  # Exceeds 90-day rotation requirement
    }

    result = compliance_validator.validate_data_encryption(test_data, context)

    assert result["key_rotation_status"] == "ROTATION_REQUIRED"
    assert "KEY_ROTATION" in result["failed_checks"]


def test_password_policy_validation(compliance_validator, mock_db, mock_user):
    """Test password policy validation."""
    mock_db.query.return_value.filter.return_value.first.return_value = mock_user
    
    # Test valid password
    valid_password = "StrongP@ssw0rd123"
    result = compliance_validator.validate_password_policy(
        valid_password,
        mock_user.id
    )

    assert result["is_compliant"] is True
    assert "LENGTH_CHECK" in result["checks_performed"]
    assert "UPPERCASE_CHECK" in result["checks_performed"]
    assert "LOWERCASE_CHECK" in result["checks_performed"]
    assert "NUMBERS_CHECK" in result["checks_performed"]
    assert "SPECIAL_CHARS_CHECK" in result["checks_performed"]
    assert len(result["failed_checks"]) == 0

    # Test invalid password
    weak_password = "weak"
    result = compliance_validator.validate_password_policy(
        weak_password,
        mock_user.id
    )

    assert result["is_compliant"] is False
    assert "PASSWORD_TOO_SHORT" in result["failed_checks"]
    assert "MISSING_UPPERCASE" in result["failed_checks"]
    assert "MISSING_NUMBERS" in result["failed_checks"]
    assert "MISSING_SPECIAL_CHARS" in result["failed_checks"]


def test_audit_logging_validation(compliance_validator):
    """Test audit logging validation."""
    valid_log = {
        "timestamp": datetime.now().isoformat(),
        "user_id": "test_user",
        "operation_type": "VIEW",
        "resource_type": "patient_record",
        "resource_id": "123",
        "ip_address": "127.0.0.1",
        "user_agent": "test_agent",
        "request_method": "GET",
        "request_path": "/api/v1/patients/123",
        "response_status": 200,
        "phi_accessed": True,
        "reason": "Treatment"
    }

    result = compliance_validator.validate_audit_logging(valid_log)

    assert result["is_compliant"] is True
    assert len(result["missing_fields"]) == 0
    assert "TIMESTAMP_VALIDATION" in result["checks_performed"]
    assert "PHI_ACCESS_LOGGING" in result["checks_performed"]

    # Test invalid log
    invalid_log = {
        "timestamp": "invalid_timestamp",
        "user_id": "test_user"
    }

    result = compliance_validator.validate_audit_logging(invalid_log)

    assert result["is_compliant"] is False
    assert "INVALID_TIMESTAMP_FORMAT" in result["failed_checks"]
    assert len(result["missing_fields"]) > 0


def test_session_security_validation(compliance_validator):
    """Test session security validation."""
    valid_session = {
        "last_activity": datetime.now().isoformat(),
        "token": "valid_token",
        "mfa_verified": True
    }

    # Mock JWT decode
    compliance_validator.jwt.decode = MagicMock(return_value={"sub": "test_user"})

    result = compliance_validator.validate_session_security(valid_session)

    assert result["is_compliant"] is True
    assert "TIMEOUT_CHECK" in result["checks_performed"]
    assert "TOKEN_VALIDATION" in result["checks_performed"]
    assert "MFA_CHECK" in result["checks_performed"]

    # Test expired session
    expired_session = {
        "last_activity": (
            datetime.now() - timedelta(minutes=45)
        ).isoformat(),  # 45 min old
        "token": "valid_token",
        "mfa_verified": True
    }

    result = compliance_validator.validate_session_security(expired_session)

    assert result["is_compliant"] is False
    assert "SESSION_TIMEOUT" in result["failed_checks"]


def test_compliance_report_generation(compliance_validator):
    """Test compliance report generation."""
    validation_results = [
        {
            "category": "phi_protection",
            "is_compliant": True,
            "checks_performed": ["ENCRYPTION_METHOD", "KEY_ROTATION"],
            "failed_checks": []
        },
        {
            "category": "access_control",
            "is_compliant": False,
            "checks_performed": ["PASSWORD_POLICY", "MFA_CHECK"],
            "failed_checks": ["MISSING_MFA"]
        },
        {
            "category": "audit_logging",
            "is_compliant": True,
            "checks_performed": ["LOG_VALIDATION"],
            "failed_checks": []
        }
    ]

    report = compliance_validator.generate_compliance_report(
        validation_results,
        "full"
    )

    assert report["overall_compliance_status"] == "FAIL"
    assert report["total_checks"] == 3
    assert report["passed_checks"] == 2
    assert report["failed_checks"] == 1
    assert report["risk_level"] == "LOW"
    assert report["categories"]["access_control"]["status"] == "FAIL"
    assert "MISSING_MFA" in report["categories"]["access_control"]["issues"]
    assert "detailed_results" in report


def test_emergency_access_validation(compliance_validator):
    """Test emergency access validation."""
    emergency_access = {
        "timestamp": datetime.now().isoformat(),
        "user_id": "test_user",
        "reason": "Emergency patient care",
        "patient_id": "123",
        "break_glass": True
    }

    # Add emergency access validation logic
    log_entry = {
        "timestamp": emergency_access["timestamp"],
        "user_id": emergency_access["user_id"],
        "operation_type": "EMERGENCY_ACCESS",
        "resource_type": "patient_record",
        "resource_id": emergency_access["patient_id"],
        "ip_address": "127.0.0.1",
        "phi_accessed": True,
        "reason": emergency_access["reason"],
        "break_glass": True
    }

    result = compliance_validator.validate_audit_logging(log_entry)

    assert result["is_compliant"] is True
    assert "PHI_ACCESS_LOGGING" in result["checks_performed"] 