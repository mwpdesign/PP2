"""Notification service for order status updates."""
from typing import Dict, List, Any
import logging
from datetime import datetime
from sqlalchemy.orm import Session

from app.services.websocket_service import broadcast_to_territory

logger = logging.getLogger(__name__)


class NotificationService:
    def __init__(self, db: Session):
        self.db = db

    async def send_notification(
        self,
        user_ids: List[int],
        notification_type: str,
        data: Dict[str, Any],
        territory_id: int
    ) -> None:
        """
        Send notification to specified users.

        Args:
            user_ids: List of user IDs to notify
            notification_type: Type of notification
            data: Notification data
            territory_id: Territory where notification originated
        """
        try:
            notification = {
                "type": notification_type,
                "timestamp": datetime.utcnow().isoformat(),
                "data": data,
                "territory_id": territory_id
            }

            # TODO: Store notification in database
            # This is a placeholder for actual notification storage

            # Broadcast notification via WebSocket
            await broadcast_to_territory(
                territory_id=territory_id,
                message=notification
            )

            logger.info(
                "Notification sent: %s to users %s in territory %s",
                notification_type,
                user_ids,
                territory_id
            )

        except Exception as e:
            logger.error(
                "Error sending notification: %s",
                str(e),
                exc_info=True
            )