"""
HIPAA compliance audit models.
Tracks PHI access, compliance checks, and security incidents.
"""
from datetime import datetime
from sqlalchemy import (
    String, DateTime, ForeignKey, ARRAY
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship, Mapped, mapped_column
from uuid import UUID as PyUUID, uuid4

from app.core.database import Base
from app.core.audit_mixin import AuditMixin


class PHIAccess(Base, AuditMixin):
    """Tracks all PHI access events for HIPAA compliance."""
    __tablename__ = 'phi_access_logs'

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4
    )
    user_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey('users.id'),
        nullable=False
    )
    patient_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey('patients.id'),
        nullable=False
    )
    # view, create, update, delete
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    created_by_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey('users.id'),
        nullable=False
    )
    updated_by_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey('users.id'),
        nullable=True
    )
    access_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )
    # patient, order, etc.
    resource_type: Mapped[str] = mapped_column(String(50), nullable=False)
    resource_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False
    )
    accessed_fields: Mapped[list[str]] = mapped_column(
        ARRAY(String),
        nullable=False
    )

    # Request Context
    ip_address: Mapped[str] = mapped_column(String(50))
    user_agent: Mapped[str] = mapped_column(String(500))
    request_id: Mapped[str] = mapped_column(String(100))
    session_id: Mapped[str] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        onupdate=datetime.utcnow
    )

    # Relationships
    user = relationship('User', foreign_keys=[user_id])
    patient = relationship('Patient')
    created_by = relationship(
        'User',
        foreign_keys=[created_by_id]
    )
    updated_by = relationship(
        'User',
        foreign_keys=[updated_by_id]
    )


class AuditLog(Base, AuditMixin):
    """General purpose audit logging."""
    __tablename__ = 'audit_logs'

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4
    )
    # Organization
    organization_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey('organizations.id'),
        nullable=False
    )
    user_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey('users.id'),
        nullable=False
    )
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    resource_type: Mapped[str] = mapped_column(String(50), nullable=False)
    resource_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False
    )
    details: Mapped[dict] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow
    )
    created_by_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey('users.id'),
        nullable=False
    )
    updated_by_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey('users.id'),
        nullable=True
    )

    # Relationships
    organization = relationship("Organization", back_populates="audit_logs")
    user = relationship(
        'User',
        foreign_keys=[user_id],
        back_populates='audit_logs'
    )
    created_by = relationship(
        'User',
        foreign_keys=[created_by_id],
        back_populates='created_audit_logs'
    )
    updated_by = relationship(
        'User',
        foreign_keys=[updated_by_id],
        back_populates='updated_audit_logs'
    )


class ComplianceCheck(Base, AuditMixin):
    """Records automated compliance checks."""
    __tablename__ = 'compliance_checks'

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4
    )
    check_type: Mapped[str] = mapped_column(String(50), nullable=False)
    # pending, completed, failed
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    results: Mapped[dict] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow
    )
    completed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    created_by_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey('users.id'),
        nullable=False
    )
    updated_by_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey('users.id'),
        nullable=True
    )

    # Relationships
    created_by = relationship(
        'User',
        foreign_keys=[created_by_id],
        back_populates='created_compliance_checks'
    )
    updated_by = relationship(
        'User',
        foreign_keys=[updated_by_id],
        back_populates='updated_compliance_checks'
    )


class AuditReport(Base, AuditMixin):
    """Stores generated audit reports."""
    __tablename__ = 'audit_reports'

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4
    )
    report_type: Mapped[str] = mapped_column(String(50), nullable=False)
    start_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False
    )
    end_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False
    )
    report_data: Mapped[dict] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow
    )
    created_by_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey('users.id'),
        nullable=False
    )
    updated_by_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey('users.id'),
        nullable=True
    )

    # Relationships
    created_by = relationship(
        'User',
        foreign_keys=[created_by_id],
        back_populates='created_audit_reports'
    )
    updated_by = relationship(
        'User',
        foreign_keys=[updated_by_id],
        back_populates='updated_audit_reports'
    )