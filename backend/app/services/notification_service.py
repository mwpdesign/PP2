"""HIPAA-compliant notification service for multi-channel communication."""

from datetime import datetime
from typing import Dict, List, Optional, Union
from enum import Enum
import json
import logging
from sqlalchemy.orm import Session

from app.services.aws_kms import KMSService
from app.services.encryption import EncryptionService
from app.core.config import settings
from app.models.notification import NotificationModel
from app.schemas.notification import NotificationCreate, NotificationStatus

logger = logging.getLogger(__name__)

class NotificationChannel(str, Enum):
    """Supported notification channels."""
    EMAIL = "email"
    SMS = "sms"
    IN_APP = "in_app"
    PUSH = "push"

class NotificationPriority(str, Enum):
    """Notification priority levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class NotificationService:
    """HIPAA-compliant multi-channel notification service."""

    def __init__(self, db: Session):
        """Initialize notification service."""
        self.db = db
        self.kms_service = KMSService()
        self.encryption_service = EncryptionService()

        # Initialize channel-specific services
        self.email_service = None  # Will be initialized on demand
        self.sms_service = None    # Will be initialized on demand

        # PHI filtering patterns - regularly updated from configuration
        self.phi_patterns = self._load_phi_patterns()

        # Retry configuration
        self.max_retries = settings.NOTIFICATION_MAX_RETRIES
        self.retry_intervals = [30, 60, 120, 300, 600]  # Exponential backoff in seconds

    def _load_phi_patterns(self) -> Dict[str, List[str]]:
        """Load PHI filtering patterns from configuration."""
        return {
            "patient_identifiers": [
                r"\b\d{3}-\d{2}-\d{4}\b",  # SSN
                r"\b\d{10}\b",             # MRN
                r"\b[A-Z]{2}\d{6}\b"       # Insurance ID
            ],
            "contact_info": [
                r"\b\d{3}[-.]?\d{3}[-.]?\d{4}\b",  # Phone numbers
                r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"  # Email
            ],
            "dates": [
                r"\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b"  # Dates
            ]
        }

    def filter_phi(self, content: str) -> str:
        """Filter out PHI from notification content."""
        filtered_content = content

        for category, patterns in self.phi_patterns.items():
            for pattern in patterns:
                filtered_content = self._redact_pattern(filtered_content, pattern)

        return filtered_content

    def _redact_pattern(self, content: str, pattern: str) -> str:
        """Redact specific pattern from content."""
        import re
        return re.sub(pattern, "[REDACTED]", content)

    async def send_notification(
        self,
        notification: NotificationCreate,
        channel: NotificationChannel,
        priority: NotificationPriority = NotificationPriority.MEDIUM,
        recipient_id: str = None,
        metadata: Dict = None
    ) -> NotificationModel:
        """Send notification through specified channel."""
        try:
            # Filter PHI from content
            filtered_content = self.filter_phi(notification.content)

            # Encrypt sensitive content
            encrypted_content = self.encryption_service.encrypt(
                json.dumps({
                    "original": notification.content,
                    "filtered": filtered_content
                })
            )

            # Create notification record
            db_notification = NotificationModel(
                recipient_id=recipient_id,
                channel=channel,
                priority=priority,
                content_encrypted=encrypted_content,
                status=NotificationStatus.PENDING,
                metadata=metadata,
                created_at=datetime.utcnow()
            )

            # Save to database
            self.db.add(db_notification)
            self.db.commit()

            # Send through appropriate channel
            success = await self._send_through_channel(
                channel,
                filtered_content,
                recipient_id,
                metadata
            )

            if success:
                db_notification.status = NotificationStatus.DELIVERED
                db_notification.delivered_at = datetime.utcnow()
            else:
                db_notification.status = NotificationStatus.FAILED
                # Queue for retry if appropriate
                await self._handle_failed_delivery(db_notification)

            self.db.commit()
            return db_notification

        except Exception as e:
            logger.error(f"Failed to send notification: {str(e)}")
            raise

    async def _send_through_channel(
        self,
        channel: NotificationChannel,
        content: str,
        recipient_id: str,
        metadata: Dict
    ) -> bool:
        """Send notification through specific channel."""
        if channel == NotificationChannel.EMAIL:
            if not self.email_service:
                from app.services.ses_service import SESService
                self.email_service = SESService()
            return await self.email_service.send_email(recipient_id, content, metadata)

        elif channel == NotificationChannel.SMS:
            if not self.sms_service:
                from app.services.sms_service import SMSService
                self.sms_service = SMSService()
            return await self.sms_service.send_sms(recipient_id, content, metadata)

        elif channel == NotificationChannel.IN_APP:
            # Implement in-app notification logic
            return await self._send_in_app_notification(recipient_id, content, metadata)

        elif channel == NotificationChannel.PUSH:
            # Implement push notification logic
            return await self._send_push_notification(recipient_id, content, metadata)

        return False

    async def _handle_failed_delivery(self, notification: NotificationModel):
        """Handle failed delivery with exponential backoff retry."""
        if notification.retry_count >= self.max_retries:
            notification.status = NotificationStatus.FAILED_PERMANENT
            return

        # Calculate next retry time using exponential backoff
        retry_index = min(notification.retry_count, len(self.retry_intervals) - 1)
        next_retry_delay = self.retry_intervals[retry_index]

        notification.retry_count += 1
        notification.next_retry_at = datetime.utcnow() + next_retry_delay
        notification.status = NotificationStatus.RETRY_PENDING

    async def get_notification_status(self, notification_id: str) -> NotificationStatus:
        """Get current status of a notification."""
        notification = self.db.query(NotificationModel).filter(
            NotificationModel.id == notification_id
        ).first()

        if not notification:
            raise ValueError(f"Notification {notification_id} not found")

        return notification.status

    async def update_delivery_status(
        self,
        notification_id: str,
        status: NotificationStatus,
        metadata: Dict = None
    ):
        """Update delivery status of a notification."""
        notification = self.db.query(NotificationModel).filter(
            NotificationModel.id == notification_id
        ).first()

        if not notification:
            raise ValueError(f"Notification {notification_id} not found")

        notification.status = status
        if status == NotificationStatus.DELIVERED:
            notification.delivered_at = datetime.utcnow()

        if metadata:
            notification.metadata.update(metadata)

        self.db.commit()

    async def get_notification_history(
        self,
        recipient_id: str,
        channel: Optional[NotificationChannel] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        status: Optional[NotificationStatus] = None
    ) -> List[NotificationModel]:
        """Get notification history for a recipient."""
        query = self.db.query(NotificationModel).filter(
            NotificationModel.recipient_id == recipient_id
        )

        if channel:
            query = query.filter(NotificationModel.channel == channel)
        if start_date:
            query = query.filter(NotificationModel.created_at >= start_date)
        if end_date:
            query = query.filter(NotificationModel.created_at <= end_date)
        if status:
            query = query.filter(NotificationModel.status == status)

        return query.order_by(NotificationModel.created_at.desc()).all()