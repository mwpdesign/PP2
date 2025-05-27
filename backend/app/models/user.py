"""User model for the healthcare IVR platform."""
from datetime import datetime, timedelta
from sqlalchemy import (
    String, Boolean, DateTime, Integer, ForeignKey, ARRAY, Column
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from uuid import uuid4
from typing import TYPE_CHECKING

from app.core.database import Base
from app.core.password import get_password_hash, verify_password
from app.models.associations import user_territories

if TYPE_CHECKING:
    from .provider import Provider  # noqa: F401
    from .logistics import QualityCheck  # noqa: F401


class User(Base):
    """User model."""

    __tablename__ = "users"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        index=True
    )
    username = Column(String(50), unique=True, index=True)
    email = Column(String(255), unique=True, index=True)
    encrypted_password = Column(String(255))
    first_name = Column(String(100))
    last_name = Column(String(100))

    # Status fields
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)

    # Role fields
    role_id = Column(
        UUID(as_uuid=True),
        ForeignKey('roles.id'),
        nullable=False
    )
    role = relationship("Role", back_populates="users")

    # Audit fields
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )
    last_login = Column(DateTime(timezone=True))

    # Security fields
    mfa_enabled = Column(Boolean, default=False)
    mfa_secret = Column(String(32))
    force_password_change = Column(Boolean, default=False)
    password_changed_at = Column(DateTime(timezone=True))
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime(timezone=True))

    # Organizational details
    organization_id = Column(
        UUID(as_uuid=True),
        ForeignKey('organizations.id'),
        nullable=False
    )
    organization = relationship(
        "Organization",
        back_populates="users"
    )

    # Territory management
    primary_territory_id = Column(
        UUID(as_uuid=True),
        ForeignKey('territories.id'),
        nullable=True
    )
    primary_territory = relationship(
        "Territory",
        foreign_keys=[primary_territory_id],
        back_populates="users"
    )
    assigned_territories = Column(
        ARRAY(UUID(as_uuid=True)),
        nullable=True
    )
    security_groups = Column(
        ARRAY(String(50)),
        nullable=True
    )

    # Territory relationships
    accessible_territories = relationship(
        "Territory",
        secondary=user_territories,
        back_populates="authorized_users"
    )

    # Sensitive data relationship
    sensitive_data = relationship(
        "SensitiveData",
        back_populates="user",
        uselist=False
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
    created_orders = relationship(
        "Order",
        foreign_keys="Order.created_by_id",
        back_populates="created_by"
    )
    updated_orders = relationship(
        "Order",
        foreign_keys="Order.updated_by_id",
        back_populates="updated_by"
    )
    order_status_changes = relationship(
        "OrderStatusHistory",
        foreign_keys="OrderStatusHistory.changed_by_id",
        back_populates="changed_by"
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
    created_documents = relationship(
        "PatientDocument",
        foreign_keys="PatientDocument.created_by_id",
        back_populates="created_by",
        overlaps="documents"
    )
    updated_documents = relationship(
        "PatientDocument",
        foreign_keys="PatientDocument.updated_by_id",
        back_populates="updated_by"
    )
    providers = relationship(
        "Provider",
        back_populates="created_by"
    )

    # IVR relationships
    current_ivr_reviews = relationship(
        "IVRRequest",
        foreign_keys="IVRRequest.current_reviewer_id",
        back_populates="current_reviewer"
    )
    ivr_reviews = relationship(
        "IVRReview",
        foreign_keys="IVRReview.reviewer_id",
        back_populates="reviewer"
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
    phi_access_logs = relationship(
        "PHIAccess",
        foreign_keys="PHIAccess.user_id",
        back_populates="user"
    )
    audit_logs = relationship(
        "AuditLog",
        foreign_keys="AuditLog.user_id",
        back_populates="user"
    )
    created_audit_logs = relationship(
        "AuditLog",
        foreign_keys="AuditLog.created_by_id",
        back_populates="created_by"
    )
    updated_audit_logs = relationship(
        "AuditLog",
        foreign_keys="AuditLog.updated_by_id",
        back_populates="updated_by"
    )
    created_compliance_checks = relationship(
        "ComplianceCheck",
        foreign_keys="ComplianceCheck.created_by_id",
        back_populates="created_by"
    )
    updated_compliance_checks = relationship(
        "ComplianceCheck",
        foreign_keys="ComplianceCheck.updated_by_id",
        back_populates="updated_by"
    )
    created_audit_reports = relationship(
        "AuditReport",
        foreign_keys="AuditReport.created_by_id",
        back_populates="created_by"
    )
    updated_audit_reports = relationship(
        "AuditReport",
        foreign_keys="AuditReport.updated_by_id",
        back_populates="updated_by"
    )
    created_phi_access_logs = relationship(
        "PHIAccess",
        foreign_keys="PHIAccess.created_by_id",
        back_populates="created_by"
    )
    updated_phi_access_logs = relationship(
        "PHIAccess",
        foreign_keys="PHIAccess.updated_by_id",
        back_populates="updated_by"
    )
    created_records = relationship(
        "Order",
        foreign_keys="Order.created_by_id",
        back_populates="created_by",
        overlaps="created_orders"
    )
    updated_records = relationship(
        "Order",
        foreign_keys="Order.updated_by_id",
        back_populates="updated_by",
        overlaps="updated_orders"
    )

    def __repr__(self) -> str:
        """String representation of the user."""
        return f"<User(username='{self.username}')>"

    @property
    def full_name(self) -> str:
        """Get the user's full name."""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.username

    def set_password(self, password: str) -> None:
        """Set encrypted password."""
        self.encrypted_password = get_password_hash(password)
        self.password_changed_at = datetime.utcnow()
        self.force_password_change = False

    def verify_password(self, password: str) -> bool:
        """Verify password."""
        return verify_password(password, self.encrypted_password)

    def update_last_login(self) -> None:
        """Update last login timestamp."""
        self.last_login = datetime.utcnow()

    def increment_failed_login(self) -> None:
        """Increment failed login attempts."""
        self.failed_login_attempts += 1
        if self.failed_login_attempts >= 5:
            self.locked_until = datetime.utcnow() + timedelta(minutes=15)

    def reset_failed_login(self) -> None:
        """Reset failed login attempts."""
        self.failed_login_attempts = 0
        self.locked_until = None

    def is_locked(self) -> bool:
        """Check if account is locked."""
        if not self.locked_until:
            return False
        return datetime.utcnow() < self.locked_until