from typing import Dict, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session  # type: ignore
from fastapi import HTTPException  # type: ignore

from app.services.hipaa_audit_service import HIPAAComplianceService
from app.services.websocket_service import broadcast_to_territory
from app.api.orders.models import Order, OrderStatusHistory
from app.api.notifications.notification_service import NotificationService

# Valid order status transitions
STATUS_TRANSITIONS = {
    "DRAFT": ["PENDING_VERIFICATION"],
    "PENDING_VERIFICATION": ["VERIFIED", "REJECTED"],
    "VERIFIED": ["PROCESSING", "CANCELLED"],
    "PROCESSING": ["READY_TO_SHIP", "ON_HOLD", "CANCELLED"],
    "READY_TO_SHIP": ["SHIPPED", "ON_HOLD", "CANCELLED"],
    "SHIPPED": ["DELIVERED", "RETURNED"],
    "DELIVERED": ["COMPLETED", "RETURNED"],
    "RETURNED": ["COMPLETED", "PROCESSING"],
    "ON_HOLD": ["PROCESSING", "CANCELLED"],
    "CANCELLED": [],
    "COMPLETED": [],
}

# Status descriptions for audit logs
STATUS_DESCRIPTIONS = {
    "DRAFT": "Order created but not submitted",
    "PENDING_VERIFICATION": "Awaiting insurance verification",
    "VERIFIED": "Insurance verification completed",
    "PROCESSING": "Order is being processed",
    "READY_TO_SHIP": "Order ready for shipment",
    "SHIPPED": "Order has been shipped",
    "DELIVERED": "Order delivered to recipient",
    "RETURNED": "Order returned by recipient",
    "ON_HOLD": "Order processing paused",
    "CANCELLED": "Order cancelled",
    "COMPLETED": "Order fulfillment completed",
}


class OrderStatusService:
    def __init__(self, db: Session):
        self.db = db
        self.notification_service = NotificationService(db)
        self.hipaa_service = HIPAAComplianceService(db)

    async def update_status(
        self,
        order_id: int,
        new_status: str,
        user_id: int,
        territory_id: int,
        notes: Optional[str] = None,
        request_metadata: Optional[Dict] = None,
    ) -> Dict:
        """
        Update order status with validation and notifications
        """
        try:
            # Get order and validate access
            order = self.db.query(Order).filter(Order.id == order_id).first()
            if not order:
                raise HTTPException(status_code=404, detail="Order not found")

            # Verify territory access
            if order.territory_id != territory_id:
                raise HTTPException(
                    status_code=403, detail="Not authorized for this territory"
                )

            # Log PHI access with comprehensive tracking
            await self.hipaa_service.log_phi_access(
                user_id=user_id,
                patient_id=order.patient_id,
                action="update_order_status",
                territory_id=territory_id,
                resource_type="order",
                resource_id=order_id,
                accessed_fields=["status", "patient_id", "territory_id"],
                request_metadata=request_metadata or {},
            )

            # Validate status transition
            if not self._is_valid_transition(order.status, new_status):
                msg = f"Invalid transition from {order.status} to {new_status}"
                raise HTTPException(status_code=400, detail=msg)

            # Create status history record
            history = OrderStatusHistory(
                order_id=order_id,
                previous_status=order.status,
                new_status=new_status,
                changed_by=user_id,
                notes=notes,
                territory_id=territory_id,
                timestamp=datetime.utcnow(),
            )
            self.db.add(history)

            # Update order status
            order.status = new_status
            order.last_updated = datetime.utcnow()
            order.last_updated_by = user_id

            # Commit changes
            self.db.commit()

            # Send notifications
            await self._send_status_notifications(order, new_status)

            # Broadcast status update via WebSocket
            await self._broadcast_status_update(order, new_status)

            return {
                "order_id": order_id,
                "status": new_status,
                "timestamp": datetime.utcnow().isoformat(),
                "updated_by": user_id,
                "description": STATUS_DESCRIPTIONS[new_status],
            }

        except Exception:
            # Log error without exposing PHI
            self.db.rollback()
            raise HTTPException(status_code=500, detail="Error updating order status")

    async def get_status_history(
        self,
        order_id: int,
        user_id: int,
        territory_id: int,
        request_metadata: Optional[Dict] = None,
    ) -> List[Dict]:
        """Get the complete status history for an order"""
        try:
            order = self.db.query(Order).filter(Order.id == order_id).first()
            if not order:
                raise HTTPException(status_code=404, detail="Order not found")

            # Verify territory access
            if order.territory_id != territory_id:
                raise HTTPException(
                    status_code=403, detail="Not authorized for this territory"
                )

            # Log PHI access with comprehensive tracking
            await self.hipaa_service.log_phi_access(
                user_id=user_id,
                patient_id=order.patient_id,
                action="view_status_history",
                territory_id=territory_id,
                resource_type="order_history",
                resource_id=order_id,
                accessed_fields=["status_history", "patient_id", "territory_id"],
                request_metadata=request_metadata or {},
            )

            # Get status history
            history = (
                self.db.query(OrderStatusHistory)
                .filter(OrderStatusHistory.order_id == order_id)
                .order_by(OrderStatusHistory.timestamp.desc())
                .all()
            )

            return [
                {
                    "timestamp": h.timestamp.isoformat(),
                    "previous_status": h.previous_status,
                    "new_status": h.new_status,
                    "changed_by": h.changed_by,
                    "notes": h.notes,
                    "description": STATUS_DESCRIPTIONS[h.new_status],
                }
                for h in history
            ]

        except Exception:
            raise HTTPException(
                status_code=500, detail="Error retrieving status history"
            )

    async def bulk_update_status(
        self,
        order_ids: List[int],
        new_status: str,
        user_id: int,
        territory_id: int,
        notes: Optional[str] = None,
        request_metadata: Optional[Dict] = None,
    ) -> Dict:
        """Update status for multiple orders"""
        results = {"successful": [], "failed": []}

        for order_id in order_ids:
            try:
                result = await self.update_status(
                    order_id=order_id,
                    new_status=new_status,
                    user_id=user_id,
                    territory_id=territory_id,
                    notes=notes,
                    request_metadata=request_metadata,
                )
                results["successful"].append(result)
            except Exception as e:
                results["failed"].append({"order_id": order_id, "error": str(e)})

        return results

    def _is_valid_transition(self, current_status: str, new_status: str) -> bool:
        """Validate status transition based on workflow rules"""
        if current_status not in STATUS_TRANSITIONS:
            return False
        return new_status in STATUS_TRANSITIONS[current_status]

    async def _send_status_notifications(self, order: Order, new_status: str) -> None:
        """Send notifications for status changes"""
        notification_data = {
            "order_id": order.id,
            "new_status": new_status,
            "description": STATUS_DESCRIPTIONS[new_status],
            "timestamp": datetime.utcnow().isoformat(),
        }

        # Send to relevant users based on territory and role
        await self.notification_service.send_notification(
            user_ids=[order.patient_id, order.provider_id],
            notification_type="ORDER_STATUS_UPDATE",
            data=notification_data,
            territory_id=order.territory_id,
        )

    async def _broadcast_status_update(self, order: Order, new_status: str) -> None:
        """Broadcast status update via WebSocket"""
        message = {
            "type": "ORDER_STATUS_UPDATE",
            "order_id": order.id,
            "status": new_status,
            "description": STATUS_DESCRIPTIONS[new_status],
            "timestamp": datetime.utcnow().isoformat(),
        }
        await broadcast_to_territory(territory_id=order.territory_id, message=message)
