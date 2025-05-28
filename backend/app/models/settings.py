from sqlalchemy import Column, String, Boolean, Integer, JSON
from sqlalchemy.sql import func
from app.db.base_class import Base

class SystemSettings(Base):
    __tablename__ = "system_settings"

    id = Column(String, primary_key=True, index=True)
    platform_name = Column(String, nullable=False)
    support_email = Column(String, nullable=False)
    support_phone = Column(String, nullable=False)
    maintenance_mode = Column(Boolean, default=False)

    # Security Settings
    password_policy = Column(JSON, nullable=False)

    # Compliance Settings
    hipaa_logging = Column(Boolean, default=True)
    audit_retention_days = Column(Integer, default=365)
    data_encryption = Column(Boolean, default=True)

    # Integration Settings
    api_rate_limit = Column(Integer, default=1000)
    webhook_url = Column(String)
    enable_webhooks = Column(Boolean, default=True)

    # Notification Settings
    email_notifications = Column(Boolean, default=True)
    sms_notifications = Column(Boolean, default=True)
    push_notifications = Column(Boolean, default=True)

    # Timestamps
    created_at = Column(String, server_default=func.now())
    updated_at = Column(String, server_default=func.now(), onupdate=func.now()) 