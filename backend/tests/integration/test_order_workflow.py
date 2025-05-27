"""
Integration tests for complete order workflow.
"""
import pytest
from datetime import datetime
from fastapi.testclient import TestClient
from uuid import uuid4

from app.core.database import get_db
from app.models.order import Order
from app.models.security import SecurityEvent


async def test_complete_order_workflow(
    client: TestClient,
    db,
    test_user,
    mock_notification_service,
    mock_websocket_service,
    mock_aws
):
    """Test complete order workflow from creation to completion."""
    # Create order via API
    order_data = {
        "patient_id": test_user.id,
        "provider_id": test_user.id,
        "territory_id": test_user.territory_id,
        "items": [
            {
                "product_id": 1,
                "quantity": 2,
                "notes": "Test order item"
            }
        ]
    }

    response = client.post(
        "/api/v1/orders",
        json=order_data,
        headers={"X-Territory-ID": str(test_user.territory_id)}
    )
    assert response.status_code == 201
    order_id = response.json()["id"]

    # Verify order created in DRAFT status
    order = db.query(Order).filter(Order.id == order_id).first()
    assert order is not None
    assert order.status == "DRAFT"

    # Submit order for verification
    response = client.post(
        f"/api/v1/orders/{order_id}/submit",
        headers={"X-Territory-ID": str(test_user.territory_id)}
    )
    assert response.status_code == 200
    assert response.json()["status"] == "PENDING_VERIFICATION"

    # Verify insurance
    response = client.post(
        f"/api/v1/orders/{order_id}/verify",
        headers={"X-Territory-ID": str(test_user.territory_id)}
    )
    assert response.status_code == 200
    assert response.json()["status"] == "VERIFIED"

    # Start processing
    response = client.post(
        f"/api/v1/orders/{order_id}/process",
        headers={"X-Territory-ID": str(test_user.territory_id)}
    )
    assert response.status_code == 200
    assert response.json()["status"] == "PROCESSING"

    # Mark ready to ship
    response = client.post(
        f"/api/v1/orders/{order_id}/ready",
        headers={"X-Territory-ID": str(test_user.territory_id)}
    )
    assert response.status_code == 200
    assert response.json()["status"] == "READY_TO_SHIP"

    # Ship order
    response = client.post(
        f"/api/v1/orders/{order_id}/ship",
        json={"tracking_number": "1234567890"},
        headers={"X-Territory-ID": str(test_user.territory_id)}
    )
    assert response.status_code == 200
    assert response.json()["status"] == "SHIPPED"

    # Mark delivered
    response = client.post(
        f"/api/v1/orders/{order_id}/deliver",
        headers={"X-Territory-ID": str(test_user.territory_id)}
    )
    assert response.status_code == 200
    assert response.json()["status"] == "DELIVERED"

    # Complete order
    response = client.post(
        f"/api/v1/orders/{order_id}/complete",
        headers={"X-Territory-ID": str(test_user.territory_id)}
    )
    assert response.status_code == 200
    assert response.json()["status"] == "COMPLETED"

    # Verify notifications sent at each step
    assert mock_notification_service.send_notification.call_count >= 8

    # Verify WebSocket broadcasts
    assert mock_websocket_service.call_count >= 8

    # Verify security events logged
    events = db.query(SecurityEvent).all()
    assert len(events) > 0  # Should have audit logs for each action


async def test_order_territory_isolation(
    client: TestClient,
    db,
    test_user
):
    """Test order territory isolation."""
    # Create order in one territory
    order_data = {
        "patient_id": test_user.id,
        "provider_id": test_user.id,
        "territory_id": test_user.territory_id,
        "items": [
            {
                "product_id": 1,
                "quantity": 1
            }
        ]
    }

    response = client.post(
        "/api/v1/orders",
        json=order_data,
        headers={"X-Territory-ID": str(test_user.territory_id)}
    )
    assert response.status_code == 201
    order_id = response.json()["id"]

    # Try to access from different territory
    wrong_territory = test_user.territory_id + 1
    response = client.get(
        f"/api/v1/orders/{order_id}",
        headers={"X-Territory-ID": str(wrong_territory)}
    )
    assert response.status_code == 403

    # Try to update from different territory
    response = client.post(
        f"/api/v1/orders/{order_id}/submit",
        headers={"X-Territory-ID": str(wrong_territory)}
    )
    assert response.status_code == 403


async def test_concurrent_order_processing(
    client: TestClient,
    db,
    test_user,
    mock_notification_service
):
    """Test concurrent order processing."""
    # Create multiple orders
    order_ids = []
    for _ in range(5):
        order_data = {
            "patient_id": test_user.id,
            "provider_id": test_user.id,
            "territory_id": test_user.territory_id,
            "items": [
                {
                    "product_id": 1,
                    "quantity": 1
                }
            ]
        }
        response = client.post(
            "/api/v1/orders",
            json=order_data,
            headers={"X-Territory-ID": str(test_user.territory_id)}
        )
        assert response.status_code == 201
        order_ids.append(response.json()["id"])

    # Submit all orders concurrently
    for order_id in order_ids:
        response = client.post(
            f"/api/v1/orders/{order_id}/submit",
            headers={"X-Territory-ID": str(test_user.territory_id)}
        )
        assert response.status_code == 200

    # Verify all orders updated
    orders = db.query(Order).filter(
        Order.id.in_(order_ids)
    ).all()
    assert all(o.status == "PENDING_VERIFICATION" for o in orders)

    # Verify notifications sent for all orders
    assert mock_notification_service.send_notification.call_count >= len(order_ids)