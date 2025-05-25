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
    territory_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey('territories.id'),
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
    user_agent: Mapped[str] = mapped_column(String(255))
    request_id: Mapped[str] = mapped_column(String(100))
    correlation_id: Mapped[str] = mapped_column(String(100))
    session_id: Mapped[str] = mapped_column(String(100))
    access_reason: Mapped[str] = mapped_column(String(255))
    access_location: Mapped[str] = mapped_column(String(100))
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow
    )
    
    # Relationships
    user = relationship('User', back_populates='phi_access_logs')
    patient = relationship('Patient', back_populates='phi_access_logs')
    territory = relationship('Territory', back_populates='phi_access_logs')


class AuditLog(Base, AuditMixin):
    """General purpose audit logging."""
    __tablename__ = 'audit_logs'

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
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    resource_type: Mapped[str] = mapped_column(String(50), nullable=False)
    resource_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False
    )
    territory_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey('territories.id'),
        nullable=False
    )
    details: Mapped[dict] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow
    )
    
    # Relationships
    user = relationship('User', back_populates='audit_logs')
    territory = relationship('Territory', back_populates='audit_logs')


class ComplianceCheck(Base, AuditMixin):
    """Records automated compliance checks."""
    __tablename__ = 'compliance_checks'

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4
    )
    check_type: Mapped[str] = mapped_column(String(50), nullable=False)
    territory_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey('territories.id'),
        nullable=True
    )
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
    
    # Relationships
    territory = relationship('Territory', back_populates='compliance_checks')


class AuditReport(Base, AuditMixin):
    """Stores generated audit reports."""
    __tablename__ = 'audit_reports'

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4
    )
    report_type: Mapped[str] = mapped_column(String(50), nullable=False)
    territory_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey('territories.id'),
        nullable=True
    )
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
    
    # Relationships
    territory = relationship('Territory', back_populates='audit_reports') 