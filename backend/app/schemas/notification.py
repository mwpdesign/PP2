"""Notification schemas for request/response validation."""

from datetime import datetime
from typing import Dict, Optional
from enum import Enum
from uuid import UUID

from pydantic import BaseModel


class NotificationStatus(str, Enum):
    """Notification delivery status."""

    PENDING = "pending"
    DELIVERED = "delivered"
    FAILED = "failed"
    RETRY_PENDING = "retry_pending"
    FAILED_PERMANENT = "failed_permanent"


class NotificationBase(BaseModel):
    """Base notification schema."""

    type: str
    title: str
    message: str
    data: Optional[Dict] = None
    notification_metadata: Optional[Dict] = None
    is_read: bool = False


class NotificationCreate(NotificationBase):
    """Schema for creating a notification."""

    user_id: UUID


class NotificationUpdate(NotificationBase):
    """Schema for updating a notification."""

    pass


class NotificationResponse(NotificationBase):
    """Schema for notification response."""

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
