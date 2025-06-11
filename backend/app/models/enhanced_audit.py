"""
Enhanced HIPAA-Compliant Audit Models
Phase 2: Foundation Systems - Task ID: mbrgdnzkoihwtfftils

SQLAlchemy models for the comprehensive audit and compliance system.
"""

from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Boolean, Text, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB, INET
from sqlalchemy.orm import relationship, Mapped, mapped_column
from uuid import UUID as PyUUID, uuid4

from app.core.database import Base


class AuditLog(Base):
    """
    Comprehensive audit log for HIPAA compliance.

    Tracks all system actions, PHI access, and security events
    with immutable records for compliance reporting.
    """

    __tablename__ = "audit_logs"

    # Primary Key
    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )

    # User and Organization Context
    user_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    organization_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False
    )

    # Action Classification
    action_type: Mapped[str] = mapped_column(String(50), nullable=False)
    resource_type: Mapped[str] = mapped_column(String(50), nullable=False)
    resource_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    patient_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("patients.id"), nullable=True
    )

    # Request Context for HIPAA Compliance
    ip_address: Mapped[str] = mapped_column(INET, nullable=False)
    user_agent: Mapped[str] = mapped_column(Text, nullable=True)
    session_id: Mapped[str] = mapped_column(String(100), nullable=True)
    request_id: Mapped[str] = mapped_column(String(100), nullable=True)

    # Audit Details
    metadata: Mapped[dict] = mapped_column(JSONB, default=dict)
    success: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    error_message: Mapped[str] = mapped_column(Text, nullable=True)

    # Immutable Timestamp
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    organization = relationship("Organization", foreign_keys=[organization_id])
    patient = relationship("Patient", foreign_keys=[patient_id])

    def __repr__(self) -> str:
        return (
            f"<AuditLog(id={self.id}, action={self.action_type}, "
            f"user={self.user_id}, created_at={self.created_at})>"
        )


class AuditLogExport(Base):
    """
    Tracks audit log exports for compliance reporting.

    Maintains records of who exported audit data, when,
    and what filters were applied for HIPAA compliance.
    """

    __tablename__ = "audit_log_exports"

    # Primary Key
    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )

    # User and Organization Context
    user_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    organization_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False
    )

    # Export Details
    export_type: Mapped[str] = mapped_column(String(50), nullable=False)
    date_range_start: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    date_range_end: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    filters: Mapped[dict] = mapped_column(JSONB, default=dict)
    record_count: Mapped[int] = mapped_column(Integer, nullable=False)
    file_hash: Mapped[str] = mapped_column(String(64), nullable=True)

    # Immutable Timestamp
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    organization = relationship("Organization", foreign_keys=[organization_id])

    def __repr__(self) -> str:
        return (
            f"<AuditLogExport(id={self.id}, type={self.export_type}, "
            f"user={self.user_id}, records={self.record_count})>"
        )