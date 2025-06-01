"""
Unit tests for order status service.
"""

import pytest
from datetime import datetime
from unittest.mock import MagicMock
from fastapi import HTTPException
from uuid import uuid4

from app.core.database import get_db
from app.models.order import Order, OrderStatusHistory
from app.services.order_status_service import OrderStatusService


async def test_update_status_success(
    db, test_user, test_order, mock_notification_service, mock_websocket_service
):
    """Test successful order status update."""
    service = OrderStatusService(db)

    result = await service.update_status(
        order_id=test_order.id,
        new_status="PENDING_VERIFICATION",
        user_id=test_user.id,
        territory_id=test_user.territory_id,
        notes="Test status update",
    )

    # Verify order status updated
    assert result["status"] == "PENDING_VERIFICATION"
    assert result["order_id"] == test_order.id
    assert result["updated_by"] == test_user.id

    # Verify history record created
    history = db.query(OrderStatusHistory).first()
    assert history is not None
    assert history.order_id == test_order.id
    assert history.previous_status == "DRAFT"
    assert history.new_status == "PENDING_VERIFICATION"

    # Verify notifications sent
    mock_notification_service.send_notification.assert_called_once()
    mock_websocket_service.assert_called_once()


async def test_update_status_invalid_transition(db, test_user, test_order):
    """Test invalid status transition."""
    service = OrderStatusService(db)

    with pytest.raises(HTTPException) as exc:
        await service.update_status(
            order_id=test_order.id,
            new_status="COMPLETED",  # Invalid transition from DRAFT
            user_id=test_user.id,
            territory_id=test_user.territory_id,
        )

    assert exc.value.status_code == 400
    assert "Invalid transition" in str(exc.value.detail)


async def test_update_status_wrong_territory(db, test_user, test_order):
    """Test status update with wrong territory."""
    service = OrderStatusService(db)

    with pytest.raises(HTTPException) as exc:
        await service.update_status(
            order_id=test_order.id,
            new_status="PENDING_VERIFICATION",
            user_id=test_user.id,
            territory_id=999,  # Wrong territory
        )

    assert exc.value.status_code == 403
    assert "Not authorized for this territory" in str(exc.value.detail)


async def test_get_status_history_success(db, test_user, test_order):
    """Test getting order status history."""
    # Create some history records
    history = OrderStatusHistory(
        order_id=test_order.id,
        previous_status="DRAFT",
        new_status="PENDING_VERIFICATION",
        changed_by=test_user.id,
        territory_id=test_user.territory_id,
        timestamp=datetime.utcnow(),
    )
    db.add(history)
    db.commit()

    service = OrderStatusService(db)
    result = await service.get_status_history(
        order_id=test_order.id,
        user_id=test_user.id,
        territory_id=test_user.territory_id,
    )

    assert len(result) == 1
    assert result[0]["previous_status"] == "DRAFT"
    assert result[0]["new_status"] == "PENDING_VERIFICATION"
    assert result[0]["changed_by"] == test_user.id


async def test_bulk_update_status_success(
    db, test_user, test_order, mock_notification_service, mock_websocket_service
):
    """Test bulk status update."""
    # Create another test order
    order2 = Order(
        patient_id=test_user.id,
        provider_id=test_user.id,
        territory_id=test_user.territory_id,
        status="DRAFT",
        created_at=datetime.utcnow(),
        created_by=test_user.id,
    )
    db.add(order2)
    db.commit()

    service = OrderStatusService(db)
    result = await service.bulk_update_status(
        order_ids=[test_order.id, order2.id],
        new_status="PENDING_VERIFICATION",
        user_id=test_user.id,
        territory_id=test_user.territory_id,
    )

    assert len(result["successful"]) == 2
    assert len(result["failed"]) == 0

    # Verify both orders updated
    orders = db.query(Order).all()
    assert all(o.status == "PENDING_VERIFICATION" for o in orders)

    # Verify history records created
    history = db.query(OrderStatusHistory).all()
    assert len(history) == 2


async def test_bulk_update_status_partial_failure(db, test_user, test_order):
    """Test bulk status update with partial failure."""
    service = OrderStatusService(db)
    result = await service.bulk_update_status(
        order_ids=[test_order.id, 999],  # 999 is invalid order ID
        new_status="PENDING_VERIFICATION",
        user_id=test_user.id,
        territory_id=test_user.territory_id,
    )

    assert len(result["successful"]) == 1
    assert len(result["failed"]) == 1
    assert result["failed"][0]["order_id"] == 999
