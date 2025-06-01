"""
Security tests focusing on HIPAA compliance and data protection.
"""

from datetime import datetime, timedelta
from fastapi.testclient import TestClient
import pytest
from uuid import uuid4

from app.services.hipaa_audit_service import HIPAAComplianceService
from app.models.security import SecurityEvent
from app.models.order import Order
from app.core.encryption import encrypt_phi, decrypt_phi
from app.core.database import get_db


async def test_phi_encryption(db, test_user, mock_aws):
    """Test PHI encryption/decryption."""
    # Test data
    phi_data = {
        "name": "John Doe",
        "ssn": "123-45-6789",
        "dob": "1980-01-01",
        "medical_record": "Patient has history of...",
    }

    # Encrypt data
    encrypted_data = await encrypt_phi(phi_data)

    # Verify data is encrypted
    assert isinstance(encrypted_data, dict)
    for key, value in encrypted_data.items():
        assert value != phi_data[key]

    # Decrypt data
    decrypted_data = await decrypt_phi(encrypted_data)

    # Verify data matches original
    assert decrypted_data == phi_data

    # Verify AWS KMS used
    mock_aws["kms"].encrypt.assert_called()
    mock_aws["kms"].decrypt.assert_called()


async def test_phi_access_logging(client: TestClient, db, test_user, test_order):
    """Test PHI access logging."""
    service = HIPAAComplianceService(db)

    # Log PHI access
    await service.log_phi_access(
        user_id=test_user.id,
        patient_id=test_order.patient_id,
        action="view",
        territory_id=test_user.primary_territory_id,
        resource_type="order",
        resource_id=test_order.id,
        accessed_fields=["medical_history", "medications"],
        request_metadata={"ip_address": "192.168.1.1", "user_agent": "test-browser"},
    )

    # Verify access logged
    events = (
        db.query(SecurityEvent).filter(SecurityEvent.event_type == "phi_access").all()
    )
    assert len(events) == 1
    assert events[0].user_id == test_user.id
    assert events[0].details["action"] == "view"
    assert "medical_history" in events[0].details["accessed_fields"]


async def test_territory_based_access_control(client: TestClient, db, test_user):
    """Test territory-based access control."""
    # Create order with PHI
    order_data = {
        "patient_id": test_user.id,
        "provider_id": test_user.id,
        "territory_id": test_user.primary_territory_id,
        "phi_data": {"diagnosis": "Test condition", "medications": ["Med A", "Med B"]},
    }

    # Create in correct territory
    response = client.post(
        "/api/v1/orders",
        json=order_data,
        headers={"X-Territory-ID": str(test_user.primary_territory_id)},
    )
    assert response.status_code == 201
    order_id = response.json()["id"]

    # Try to access from wrong territory
    wrong_territory = test_user.primary_territory_id + 1
    response = client.get(
        f"/api/v1/orders/{order_id}", headers={"X-Territory-ID": str(wrong_territory)}
    )
    assert response.status_code == 403

    # Verify access denied logged
    events = (
        db.query(SecurityEvent)
        .filter(SecurityEvent.event_type == "unauthorized_phi_access")
        .all()
    )
    assert len(events) > 0


async def test_audit_trail_completeness(client: TestClient, db, test_user, test_order):
    """Test completeness of audit trail."""
    service = HIPAAComplianceService(db)

    # Perform various PHI operations
    operations = [
        ("view", ["demographics"]),
        ("update", ["medical_history"]),
        ("delete", ["old_records"]),
    ]

    for action, fields in operations:
        await service.log_phi_access(
            user_id=test_user.id,
            patient_id=test_order.patient_id,
            action=action,
            territory_id=test_user.primary_territory_id,
            resource_type="order",
            resource_id=test_order.id,
            accessed_fields=fields,
            request_metadata={
                "ip_address": "192.168.1.1",
                "user_agent": "test-browser",
            },
        )

    # Get audit trail
    audit_trail = await service.get_phi_access_audit_trail(
        patient_id=test_order.patient_id,
        start_date=datetime.utcnow() - timedelta(days=1),
        end_date=datetime.utcnow(),
    )

    # Verify all operations logged
    assert len(audit_trail) == len(operations)
    for entry in audit_trail:
        assert entry.user_id == test_user.id
        assert entry.patient_id == test_order.patient_id
        assert entry.resource_type == "order"
        assert entry.resource_id == test_order.id


async def test_phi_data_retention(
    client: TestClient, db, test_user, test_order, mock_aws
):
    """Test PHI data retention policies."""
    service = HIPAAComplianceService(db)

    # Add PHI to order
    phi_data = {
        "diagnosis": "Test condition",
        "medications": ["Med A", "Med B"],
        "notes": "Patient reported...",
    }

    encrypted_phi = await encrypt_phi(phi_data)
    test_order.phi_data = encrypted_phi
    db.commit()

    # Request data deletion
    await service.delete_phi_data(
        patient_id=test_order.patient_id,
        resource_type="order",
        resource_id=test_order.id,
    )

    # Verify data deleted
    order = db.query(Order).get(test_order.id)
    assert not order.phi_data

    # Verify deletion logged
    events = (
        db.query(SecurityEvent).filter(SecurityEvent.event_type == "phi_deletion").all()
    )
    assert len(events) > 0

    # Verify AWS S3 backup created
    mock_aws["s3"].upload_fileobj.assert_called()


async def test_emergency_access_procedures(
    client: TestClient, db, test_user, test_order, mock_notification_service
):
    """Test emergency access procedures."""
    service = HIPAAComplianceService(db)

    # Request emergency access
    response = client.post(
        f"/api/v1/emergency-access/{test_order.id}",
        json={"reason": "Medical emergency", "provider_id": test_user.id},
        headers={"X-Territory-ID": str(test_user.primary_territory_id)},
    )
    assert response.status_code == 200

    # Verify access granted and logged
    events = (
        db.query(SecurityEvent)
        .filter(SecurityEvent.event_type == "emergency_phi_access")
        .all()
    )
    assert len(events) > 0
    assert events[0].details["reason"] == "Medical emergency"

    # Verify notification sent
    mock_notification_service.send_notification.assert_called()

    # Test emergency access expiration
    expired_response = await service.validate_emergency_access(
        order_id=test_order.id, access_token="expired_token"
    )
    assert not expired_response["valid"]

    # Verify access expires
    response = client.get(
        f"/api/v1/orders/{test_order.id}/phi",
        headers={
            "X-Territory-ID": str(test_user.primary_territory_id),
            "X-Emergency-Access-Token": "expired_token",
        },
    )
    assert response.status_code == 401
