"""User model for the healthcare IVR platform."""

from datetime import datetime, timedelta
from sqlalchemy import String, Boolean, DateTime, Integer, ForeignKey, Column
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from uuid import uuid4
from typing import TYPE_CHECKING

from app.core.database import Base
from app.core.password import get_password_hash, verify_password

if TYPE_CHECKING:
    from .provider import Provider  # noqa: F401
    from .logistics import QualityCheck  # noqa: F401
    from .ivr import IVRReview  # noqa: F401


class User(Base):
    """User model."""

    __tablename__ = "users"

    id = Column(
        UUID(as_uuid=True), primary_key=True, default=uuid4, index=True)
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
        ForeignKey("roles.id"),
        nullable=False
    )
    role = relationship("Role", foreign_keys=[role_id], back_populates="users")

    # Many-to-many relationship with roles through user_roles table
    roles = relationship(
        "Role",
        secondary="user_roles",
        primaryjoin="User.id == user_roles.c.user_id",
        secondaryjoin="Role.id == user_roles.c.role_id",
        back_populates="users"
    )

    # Audit fields
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
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
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False
    )
    organization = relationship("Organization", back_populates="users")

    # User Hierarchy Fields (Phase 3.1)
    parent_sales_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    parent_distributor_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    parent_master_distributor_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    added_by_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    added_at = Column(DateTime(timezone=True), server_default=func.now())

    # Practice delegation fields
    parent_doctor_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    practice_role = Column(String(50), nullable=True)
    invitation_token = Column(String(255), nullable=True)
    invited_at = Column(DateTime(timezone=True), nullable=True)

    # User Hierarchy Relationships (Phase 3.1)
    parent_sales = relationship(
        "User", remote_side=[id], foreign_keys=[parent_sales_id]
    )
    parent_distributor = relationship(
        "User", remote_side=[id], foreign_keys=[parent_distributor_id]
    )
    parent_master_distributor = relationship(
        "User", remote_side=[id], foreign_keys=[parent_master_distributor_id]
    )
    added_by = relationship(
        "User", remote_side=[id], foreign_keys=[added_by_id]
    )

    # Practice delegation relationships
    parent_doctor = relationship(
        "User",
        remote_side=[id],
        foreign_keys=[parent_doctor_id],
        back_populates="staff_members"
    )
    staff_members = relationship(
        "User",
        foreign_keys="User.parent_doctor_id",
        back_populates="parent_doctor"
    )

    # Sensitive data relationship
    sensitive_data = relationship(
        "SensitiveData",
        back_populates="user",
        uselist=False
    )

    # Doctor profile relationship (Phase 3.1)
    doctor_profile = relationship(
        "DoctorProfile",
        foreign_keys="DoctorProfile.user_id",
        back_populates="user",
        uselist=False
    )

    # IVR relationships
    current_ivr_reviews = relationship(
        "IVRRequest",
        foreign_keys="IVRRequest.current_reviewer_id",
        back_populates="current_reviewer",
    )
    ivr_status_changes = relationship(
        "IVRStatusHistory",
        foreign_keys="IVRStatusHistory.changed_by_id",
        back_populates="changed_by",
    )
    ivr_approvals = relationship(
        "IVRApproval", foreign_keys="IVRApproval.approver_id", back_populates="approver"
    )
    ivr_escalations_created = relationship(
        "IVREscalation",
        foreign_keys="IVREscalation.escalated_by_id",
        back_populates="escalated_by",
    )
    ivr_escalations_received = relationship(
        "IVREscalation",
        foreign_keys="IVREscalation.escalated_to_id",
        back_populates="escalated_to",
    )
    ivr_escalations_assigned = relationship(
        "IVREscalation",
        foreign_keys="IVREscalation.escalated_to_id",
        back_populates="escalated_to",
        overlaps="ivr_escalations_received",
    )
    ivr_reviews = relationship(
        "IVRReview", foreign_keys="IVRReview.reviewer_id", back_populates="reviewer"
    )
    uploaded_documents = relationship(
        "IVRDocument",
        foreign_keys="IVRDocument.uploaded_by_id",
        back_populates="uploaded_by",
    )

    # Provider relationship
    providers = relationship(
        "Provider", foreign_keys="Provider.created_by_id", back_populates="created_by"
    )

    # Quality checks relationship
    quality_checks = relationship(
        "QualityCheck",
        foreign_keys="QualityCheck.created_by_id",
        back_populates="created_by",
    )

    # Patient relationships
    patients = relationship(
        "Patient", foreign_keys="Patient.created_by_id", back_populates="created_by"
    )
    updated_patients = relationship(
        "Patient", foreign_keys="Patient.updated_by_id", back_populates="updated_by"
    )
    created_orders = relationship(
        "Order", foreign_keys="Order.created_by_id", back_populates="created_by"
    )
    updated_orders = relationship(
        "Order", foreign_keys="Order.updated_by_id", back_populates="updated_by"
    )
    order_status_changes = relationship(
        "OrderStatusHistory",
        foreign_keys="OrderStatusHistory.changed_by_id",
        back_populates="changed_by",
    )
    received_orders = relationship(
        "Order", foreign_keys="Order.received_by", back_populates="received_by_user"
    )
    uploaded_order_documents = relationship(
        "OrderDocument",
        foreign_keys="OrderDocument.uploaded_by_id",
        back_populates="uploaded_by",
    )
    secondary_insurance = relationship(
        "SecondaryInsurance",
        foreign_keys="SecondaryInsurance.created_by_id",
        back_populates="created_by",
    )
    phi_access_logs = relationship(
        "PHIAccess", foreign_keys="PHIAccess.user_id", back_populates="user"
    )
    audit_logs = relationship(
        "AuditLog", foreign_keys="AuditLog.user_id", back_populates="user"
    )
    created_audit_logs = relationship(
        "AuditLog", foreign_keys="AuditLog.created_by_id", back_populates="created_by"
    )
    updated_audit_logs = relationship(
        "AuditLog", foreign_keys="AuditLog.updated_by_id", back_populates="updated_by"
    )
    created_compliance_checks = relationship(
        "ComplianceCheck",
        foreign_keys="ComplianceCheck.created_by_id",
        back_populates="created_by",
    )
    updated_compliance_checks = relationship(
        "ComplianceCheck",
        foreign_keys="ComplianceCheck.updated_by_id",
        back_populates="updated_by",
    )
    created_audit_reports = relationship(
        "AuditReport",
        foreign_keys="AuditReport.created_by_id",
        back_populates="created_by",
    )
    updated_audit_reports = relationship(
        "AuditReport",
        foreign_keys="AuditReport.updated_by_id",
        back_populates="updated_by",
    )
    created_phi_access_logs = relationship(
        "PHIAccess", foreign_keys="PHIAccess.created_by_id", back_populates="created_by"
    )
    updated_phi_access_logs = relationship(
        "PHIAccess", foreign_keys="PHIAccess.updated_by_id", back_populates="updated_by"
    )
    created_records = relationship(
        "Order",
        foreign_keys="Order.created_by_id",
        back_populates="created_by",
        overlaps="created_orders",
    )
    updated_records = relationship(
        "Order",
        foreign_keys="Order.updated_by_id",
        back_populates="updated_by",
        overlaps="updated_orders",
    )
    created_documents = relationship(
        "PatientDocument",
        foreign_keys="PatientDocument.created_by_id",
        back_populates="created_by",
    )
    updated_documents = relationship(
        "PatientDocument",
        foreign_keys="PatientDocument.updated_by_id",
        back_populates="updated_by",
    )

    # Delegation relationships
    delegations_given = relationship(
        "DelegationPermission",
        foreign_keys="DelegationPermission.delegator_id",
        back_populates="delegator",
    )
    delegations_received = relationship(
        "DelegationPermission",
        foreign_keys="DelegationPermission.delegate_id",
        back_populates="delegate",
    )
    recorded_treatments = relationship(
        "TreatmentRecord",
        foreign_keys="TreatmentRecord.recorded_by",
        back_populates="recorded_by_user",
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
