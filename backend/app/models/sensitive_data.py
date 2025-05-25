"""Sensitive user data model with encryption support."""
from datetime import datetime
from uuid import UUID as PyUUID, uuid4
from sqlalchemy import String, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING

from app.core.database import Base
from app.core.encryption import FieldLevelEncryption

if TYPE_CHECKING:
    from .user import User

class SensitiveData(Base):
    """Model for storing sensitive user data with encryption."""
    
    __tablename__ = "sensitive_data"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4
    )
    user_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False
    )
    encrypted_data: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
        server_default='{}'
    )
    encryption_key_id: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        onupdate=datetime.utcnow
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="sensitive_data")

    def __init__(self, **kwargs):
        """Initialize with encryption support."""
        super().__init__(**kwargs)
        self.encryption = FieldLevelEncryption()

    def __repr__(self):
        """String representation of sensitive data."""
        return f"<SensitiveData(user_id='{self.user_id}')>"

    def set_ssn(self, ssn: str):
        """Encrypt and set SSN."""
        if ssn:
            self.encrypted_data['ssn'] = self.encryption.encrypt(ssn)

    def get_ssn(self) -> str:
        """Decrypt and return SSN."""
        if 'ssn' in self.encrypted_data:
            return self.encryption.decrypt(self.encrypted_data['ssn'])
        return None

    def set_phone(self, phone: str):
        """Encrypt and set phone number."""
        if phone:
            self.encrypted_data['phone'] = self.encryption.encrypt(phone)

    def get_phone(self) -> str:
        """Decrypt and return phone number."""
        if 'phone' in self.encrypted_data:
            return self.encryption.decrypt(self.encrypted_data['phone'])
        return None

    def set_address(self, address: str):
        """Encrypt and set address."""
        if address:
            self.encrypted_data['address'] = self.encryption.encrypt(address)

    def get_address(self) -> str:
        """Decrypt and return address."""
        if 'address' in self.encrypted_data:
            return self.encryption.decrypt(self.encrypted_data['address'])
        return None 