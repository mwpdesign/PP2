"""User model for the healthcare IVR platform."""
from datetime import datetime
from sqlalchemy import (
    String, Boolean, DateTime, Integer, ForeignKey, ARRAY, JSON
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, Mapped, mapped_column
from uuid import UUID as PyUUID, uuid4
from typing import TYPE_CHECKING, List

from app.core.database import Base
from app.core.password import get_password_hash, verify_password

if TYPE_CHECKING:
    from .organization import Organization
    from .role import Role
    from .sensitive_data import SensitiveData
    from .audit import PHIAccessLog, AuditLog
    from .provider import Provider

class User(Base):
    """User model representing system users."""
    
    __tablename__ = 'users'

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4
    )
    username: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False
    )
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False
    )
    encrypted_password: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )
    first_name: Mapped[str] = mapped_column(
        String(100),
        nullable=True
    )
    last_name: Mapped[str] = mapped_column(
        String(100),
        nullable=True
    )

    # Organizational details
    organization_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey('organizations.id'),
        nullable=False
    )
    organization: Mapped["Organization"] = relationship("Organization", back_populates="users")

    # Role and access control
    role_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey('roles.id'),
        nullable=False
    )
    role: Mapped["Role"] = relationship("Role")

    # Territory management
    primary_territory_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey('territories.id'),
        nullable=True
    )
    primary_territory = relationship(
        "Territory",
        foreign_keys=[primary_territory_id],
        back_populates="users"
    )
    assigned_territories: Mapped[list[PyUUID]] = mapped_column(
        ARRAY(UUID(as_uuid=True)),
        nullable=True
    )
    security_groups: Mapped[list[str]] = mapped_column(
        ARRAY(String(50)),
        nullable=True
    )

    # Security and audit
    last_login: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    failed_login_attempts: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0
    )
    locked_until: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    password_changed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    force_password_change: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False
    )
    mfa_enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False
    )
    mfa_secret: Mapped[str] = mapped_column(
        String(255),
        nullable=True
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True
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

    # Sensitive data relationship
    sensitive_data: Mapped["SensitiveData"] = relationship("SensitiveData", back_populates="user", uselist=False)

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
    providers: Mapped[List["Provider"]] = relationship("Provider", back_populates="created_by")

    # IVR relationships
    ivr_reviews = relationship(
        "IVRRequest",
        foreign_keys="IVRRequest.current_reviewer_id",
        back_populates="current_reviewer"
    )
    ivr_status_changes = relationship(
        "IVRStatusHistory",
        foreign_keys="IVRStatusHistory.changed_by_id",
        back_populates="changed_by"
    )
    ivr_approvals = relationship(
        "IVRApproval",
        foreign_keys="IVRApproval.approver_id",
        back_populates="approver"
    )
    ivr_escalations_created = relationship(
        "IVREscalation",
        foreign_keys="IVREscalation.escalated_by_id",
        back_populates="escalated_by"
    )
    ivr_escalations_assigned = relationship(
        "IVREscalation",
        foreign_keys="IVREscalation.escalated_to_id",
        back_populates="escalated_to"
    )
    uploaded_documents = relationship(
        "IVRDocument",
        foreign_keys="IVRDocument.uploaded_by_id",
        back_populates="uploaded_by"
    )
    quality_checks = relationship(
        "QualityCheck",
        foreign_keys="QualityCheck.inspector_id",
        back_populates="inspector"
    )
    phi_access_logs: Mapped[List["PHIAccessLog"]] = relationship("PHIAccessLog", back_populates="user")
    audit_logs: Mapped[List["AuditLog"]] = relationship("AuditLog", back_populates="user")

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