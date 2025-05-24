"""Sensitive user data model with encryption support."""
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.core.encryption import FieldLevelEncryption


class SensitiveUserData(Base):
    """Model for storing sensitive user data with encryption."""
    
    __tablename__ = 'sensitive_user_data'

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey('users.id'),
        primary_key=True
    )
    encrypted_ssn = Column(String(255))
    encrypted_phone = Column(String(255))
    encrypted_address = Column(String(500))
    encryption_key_id = Column(String(255), nullable=False)
    encryption_context = Column(JSON, nullable=False, server_default='{}')
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="sensitive_data")

    def __init__(self, **kwargs):
        """Initialize with encryption support."""
        super().__init__(**kwargs)
        self.encryption = FieldLevelEncryption()

    def __repr__(self):
        """String representation of sensitive user data."""
        return f"<SensitiveUserData(user_id='{self.user_id}')>"

    def set_ssn(self, ssn: str):
        """Encrypt and set SSN."""
        if ssn:
            self.encrypted_ssn = self.encryption.encrypt(ssn)

    def get_ssn(self) -> str:
        """Decrypt and return SSN."""
        if self.encrypted_ssn:
            return self.encryption.decrypt(self.encrypted_ssn)
        return None

    def set_phone(self, phone: str):
        """Encrypt and set phone number."""
        if phone:
            self.encrypted_phone = self.encryption.encrypt(phone)

    def get_phone(self) -> str:
        """Decrypt and return phone number."""
        if self.encrypted_phone:
            return self.encryption.decrypt(self.encrypted_phone)
        return None

    def set_address(self, address: str):
        """Encrypt and set address."""
        if address:
            self.encrypted_address = self.encryption.encrypt(address)

    def get_address(self) -> str:
        """Decrypt and return address."""
        if self.encrypted_address:
            return self.encryption.decrypt(self.encrypted_address)
        return None 