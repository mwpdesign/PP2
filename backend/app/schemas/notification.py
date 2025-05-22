"""Notification schemas for request/response validation."""

from datetime import datetime
from typing import Dict, Optional
from enum import Enum
from pydantic import BaseModel, Field


class NotificationStatus(str, Enum):
    """Notification delivery status."""
    PENDING = "pending"
    DELIVERED = "delivered"
    FAILED = "failed"
    RETRY_PENDING = "retry_pending"
    FAILED_PERMANENT = "failed_permanent"


class NotificationBase(BaseModel):
    """Base notification schema."""
    content: str = Field(..., description="Notification content")
    metadata: Optional[Dict] = Field(None, description="Additional metadata")


class NotificationCreate(NotificationBase):
    """Schema for creating a notification."""
    pass


class NotificationResponse(NotificationBase):
    """Schema for notification response."""
    id: str
    recipient_id: str
    channel: str
    priority: str
    status: NotificationStatus
    retry_count: int
    created_at: datetime
    delivered_at: Optional[datetime]
    updated_at: datetime

    class Config:
        """Pydantic config."""
        orm_mode = True 