"""Notification model for the database."""

from datetime import datetime
from sqlalchemy import Column, String, DateTime, Integer, JSON, Enum
from app.core.database import Base
from app.services.notification_service import NotificationChannel, NotificationPriority


class NotificationModel(Base):
    """Notification model for storing notification records."""
    
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True)
    recipient_id = Column(String(36), nullable=False, index=True)
    channel = Column(Enum(NotificationChannel), nullable=False)
    priority = Column(Enum(NotificationPriority), nullable=False)
    content_encrypted = Column(String, nullable=False)
    status = Column(String, nullable=False)
    metadata = Column(JSON, nullable=True)
    retry_count = Column(Integer, default=0)
    next_retry_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    delivered_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow,
                       onupdate=datetime.utcnow) 