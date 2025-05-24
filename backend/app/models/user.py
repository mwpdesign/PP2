"""User model for the healthcare IVR platform."""
from datetime import datetime
from sqlalchemy import (
    Column, String, Boolean, DateTime, Integer, ForeignKey, ARRAY
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.core.database import Base
from app.core.password import get_password_hash, verify_password


class User(Base):
    """User model representing system users."""
    
    __tablename__ = 'users'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    encrypted_password = Column(String(255), nullable=False)
    first_name = Column(String(100))
    last_name = Column(String(100))

    # Organizational details
    organization_id = Column(
        UUID(as_uuid=True),
        ForeignKey('organizations.id'),
        nullable=False
    )
    organization = relationship("Organization", back_populates="users")

    # Role and access control
    role_id = Column(
        UUID(as_uuid=True),
        ForeignKey('roles.id'),
        nullable=False
    )
    role = relationship("Role")

    # Territory management
    primary_territory_id = Column(
        UUID(as_uuid=True),
        ForeignKey('territories.id')
    )
    primary_territory = relationship(
        "Territory",
        foreign_keys=[primary_territory_id],
        back_populates="users"
    )
    assigned_territories = Column(ARRAY(UUID(as_uuid=True)))
    security_groups = Column(ARRAY(String(50)))

    # Security and audit
    last_login = Column(DateTime)
    failed_login_attempts = Column(Integer, nullable=False, default=0)
    locked_until = Column(DateTime)
    password_changed_at = Column(DateTime)
    force_password_change = Column(Boolean, nullable=False, default=False)
    mfa_enabled = Column(Boolean, nullable=False, default=False)
    mfa_secret = Column(String(255))
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)

    # Sensitive data relationship
    sensitive_data = relationship(
        "SensitiveUserData",
        uselist=False,
        back_populates="user"
    )

    # Patient relationships
    patients = relationship(
        "Patient",
        foreign_keys="Patient.created_by_id",
        back_populates="created_by"
    )
    updated_patients = relationship(
        "Patient",
        foreign_keys="Patient.updated_by_id",
        back_populates="updated_by"
    )
    secondary_insurance = relationship(
        "SecondaryInsurance",
        foreign_keys="SecondaryInsurance.created_by_id",
        back_populates="created_by"
    )
    documents = relationship(
        "PatientDocument",
        foreign_keys="PatientDocument.created_by_id",
        back_populates="created_by"
    )
    providers = relationship(
        "Provider",
        foreign_keys="Provider.created_by_id",
        back_populates="created_by"
    )

    def __repr__(self):
        """String representation of the user."""
        return f"<User(username='{self.username}')>"

    @property
    def full_name(self):
        """Get user's full name."""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.username

    def set_password(self, password: str):
        """Set encrypted password."""
        self.encrypted_password = get_password_hash(password)
        self.password_changed_at = datetime.utcnow()
        self.force_password_change = False

    def verify_password(self, password: str) -> bool:
        """Verify password."""
        return verify_password(password, self.encrypted_password)

    def increment_failed_login(self):
        """Increment failed login attempts."""
        self.failed_login_attempts += 1
        if self.failed_login_attempts >= 5:
            self.locked_until = datetime.utcnow().replace(
                minute=datetime.utcnow().minute + 30
            )

    def reset_failed_login(self):
        """Reset failed login attempts."""
        self.failed_login_attempts = 0
        self.locked_until = None

    def is_locked(self) -> bool:
        """Check if account is locked."""
        if not self.locked_until:
            return False
        return datetime.utcnow() < self.locked_until

    def record_login(self):
        """Record successful login."""
        self.last_login = datetime.utcnow()
        self.reset_failed_login() 