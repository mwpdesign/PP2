from typing import Optional
from pydantic import BaseModel, EmailStr, HttpUrl


class PasswordPolicy(BaseModel):
    min_length: int
    require_special_char: bool
    require_number: bool
    require_uppercase: bool
    expiry_days: int


class SystemSettingsBase(BaseModel):
    platform_name: str
    support_email: EmailStr
    support_phone: str
    maintenance_mode: bool
    password_policy: PasswordPolicy
    hipaa_logging: bool
    audit_retention_days: int
    data_encryption: bool
    api_rate_limit: int
    webhook_url: Optional[HttpUrl]
    enable_webhooks: bool
    email_notifications: bool
    sms_notifications: bool
    push_notifications: bool


class SystemSettingsCreate(SystemSettingsBase):
    pass


class SystemSettingsUpdate(SystemSettingsBase):
    platform_name: Optional[str] = None
    support_email: Optional[EmailStr] = None
    support_phone: Optional[str] = None
    maintenance_mode: Optional[bool] = None
    password_policy: Optional[PasswordPolicy] = None
    hipaa_logging: Optional[bool] = None
    audit_retention_days: Optional[int] = None
    data_encryption: Optional[bool] = None
    api_rate_limit: Optional[int] = None
    webhook_url: Optional[HttpUrl] = None
    enable_webhooks: Optional[bool] = None
    email_notifications: Optional[bool] = None
    sms_notifications: Optional[bool] = None
    push_notifications: Optional[bool] = None


class SystemSettings(SystemSettingsBase):
    id: str
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True 