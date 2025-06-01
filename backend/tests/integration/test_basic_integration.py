"""Basic integration tests for the Healthcare IVR Platform."""

import pytest
from httpx import AsyncClient
from typing import Dict, Any

from app.core.config import settings
from app.main import app


@pytest.mark.asyncio
async def test_health_check():
    """Test health check endpoint."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/v1/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


@pytest.mark.asyncio
async def test_auth_flow(test_client, test_user):
    """Test authentication flow."""
    # Login
    login_data = {"username": test_user.email, "password": "test_password"}
    response = await test_client.post("/api/v1/auth/login", json=login_data)
    assert response.status_code == 200
    token_data = response.json()
    assert "access_token" in token_data

    # Verify token
    auth_header = f"Bearer {token_data['access_token']}"
    headers = {"Authorization": auth_header}
    response = await test_client.get("/api/v1/auth/verify", headers=headers)
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_patient_workflow(test_client, test_user, test_data: Dict[str, Any]):
    """Test patient registration and retrieval."""
    # Register patient
    patient_data = {
        "first_name": "John",
        "last_name": "Doe",
        "date_of_birth": "1990-01-01",
        "email": "john.doe@example.com",
        "phone": "+1234567890",
        "territory": test_data["test_user"]["territory"],
    }

    response = await test_client.post("/api/v1/patients/register", json=patient_data)
    assert response.status_code == 201
    patient_id = response.json()["id"]

    # Retrieve patient
    response = await test_client.get(f"/api/v1/patients/{patient_id}")
    assert response.status_code == 200
    assert response.json()["email"] == patient_data["email"]


@pytest.mark.asyncio
async def test_order_workflow(test_client, test_user, test_data: Dict[str, Any]):
    """Test order creation and processing."""
    # Create order
    order_data = {
        "patient_id": test_data["test_patient"]["id"],
        "provider_id": test_data["test_user"]["id"],
        "territory": test_data["test_user"]["territory"],
        "items": [{"product_id": "TEST-PROD-1", "quantity": 1}],
    }

    response = await test_client.post("/api/v1/orders/create", json=order_data)
    assert response.status_code == 201
    order_id = response.json()["id"]

    # Verify order status
    response = await test_client.get(f"/api/v1/orders/{order_id}")
    assert response.status_code == 200
    assert response.json()["status"] == "pending"


@pytest.mark.asyncio
async def test_ivr_workflow(test_client, test_user, test_data: Dict[str, Any]):
    """Test IVR call flow."""
    # Start IVR call
    call_data = {
        "patient_id": test_data["test_patient"]["id"],
        "phone_number": "+1234567890",
        "territory": test_data["test_user"]["territory"],
    }

    response = await test_client.post("/api/v1/ivr/start-call", json=call_data)
    assert response.status_code == 200
    call_id = response.json()["call_id"]

    # Verify call status
    response = await test_client.get(f"/api/v1/ivr/calls/{call_id}")
    assert response.status_code == 200
    assert response.json()["status"] in ["initiated", "in_progress"]


@pytest.mark.asyncio
async def test_security_features(test_client):
    """Test security features."""
    # Test rate limiting
    auth_settings = settings.SECURITY_CHECKS["authentication"]
    max_attempts = auth_settings["max_failed_attempts"]
    for _ in range(max_attempts + 1):
        response = await test_client.post(
            "/api/v1/auth/login",
            json={"username": "nonexistent@example.com", "password": "wrong_password"},
        )
    assert response.status_code == 429  # Too many requests

    # Test invalid token
    headers = {"Authorization": "Bearer invalid_token"}
    response = await test_client.get("/api/v1/auth/verify", headers=headers)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_compliance_features(test_client, test_user, test_data: Dict[str, Any]):
    """Test HIPAA compliance features."""
    # Test PHI access logging
    patient_id = test_data["test_patient"]["id"]
    response = await test_client.get(f"/api/v1/patients/{patient_id}")
    assert response.status_code == 200

    # Verify audit log
    response = await test_client.get(
        "/api/v1/audit/logs", params={"resource_id": patient_id, "action": "read"}
    )
    assert response.status_code == 200
    logs = response.json()
    assert len(logs) > 0
    assert logs[0]["resource_type"] == "patient"


@pytest.mark.asyncio
async def test_notification_system(test_client, test_user, test_data: Dict[str, Any]):
    """Test notification system."""
    # Create notification
    notification_data = {
        "recipient_id": test_data["test_user"]["id"],
        "type": "order_status",
        "message": "Your order has been processed",
        "territory": test_data["test_user"]["territory"],
    }

    response = await test_client.post(
        "/api/v1/notifications/send", json=notification_data
    )
    assert response.status_code == 200

    # Verify notification delivery
    response = await test_client.get(
        "/api/v1/notifications/user", params={"user_id": test_data["test_user"]["id"]}
    )
    assert response.status_code == 200
    notifications = response.json()
    assert len(notifications) > 0
    assert notifications[0]["type"] == "order_status"
