"""
HIPAA compliance audit models.
Tracks PHI access, compliance checks, and security incidents.
"""
from datetime import datetime
from sqlalchemy import (
    Column, String, DateTime, ForeignKey,
    JSON, ARRAY, Boolean, Text
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid

from app.core.database import Base
from app.core.audit_mixin import AuditMixin


class PHIAccess(Base, AuditMixin):
    """Tracks all PHI access events for HIPAA compliance."""
    __tablename__ = 'phi_access_logs'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    patient_id = Column(UUID(as_uuid=True), ForeignKey('patients.id'), nullable=False)
    action = Column(String(50), nullable=False)  # view, create, update, delete
    territory_id = Column(UUID(as_uuid=True), ForeignKey('territories.id'), nullable=False)
    resource_type = Column(String(50), nullable=False)  # patient, order, etc.
    resource_id = Column(UUID(as_uuid=True), nullable=False)
    accessed_fields = Column(ARRAY(String), nullable=False)
    
    # Request Context
    ip_address = Column(String(50))
    user_agent = Column(String(255))
    request_id = Column(String(100))
    correlation_id = Column(String(100))
    session_id = Column(String(100))
    access_reason = Column(String(255))
    access_location = Column(String(100))
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship('User', backref='phi_access_logs')
    patient = relationship('Patient', backref='phi_access_logs')
    territory = relationship('Territory', backref='phi_access_logs')


class AuditLog(Base, AuditMixin):
    """General purpose audit logging."""
    __tablename__ = 'audit_logs'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    action = Column(String(100), nullable=False)
    resource_type = Column(String(50), nullable=False)
    resource_id = Column(UUID(as_uuid=True), nullable=False)
    territory_id = Column(UUID(as_uuid=True), ForeignKey('territories.id'), nullable=False)
    details = Column(JSONB)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship('User', backref='audit_logs')
    territory = relationship('Territory', backref='audit_logs')


class ComplianceCheck(Base, AuditMixin):
    """Records automated compliance checks."""
    __tablename__ = 'compliance_checks'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    check_type = Column(String(50), nullable=False)
    territory_id = Column(
        UUID(as_uuid=True),
        ForeignKey('territories.id'),
        nullable=True
    )
    status = Column(String(20), nullable=False)  # pending, completed, failed
    results = Column(JSONB, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    
    # Relationships
    territory = relationship('Territory', backref='compliance_checks')


class SecurityIncident(Base, AuditMixin):
    """Records security violations and incidents."""
    __tablename__ = 'security_incidents'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    incident_type = Column(String(50), nullable=False)
    description = Column(Text, nullable=False)
    reported_by = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    territory_id = Column(UUID(as_uuid=True), ForeignKey('territories.id'), nullable=False)
    severity = Column(
        String(20),
        nullable=False
    )  # low, medium, high, critical
    status = Column(
        String(20),
        nullable=False,
        default='open'
    )  # open, investigating, resolved
    affected_resources = Column(JSONB, nullable=False)
    incident_metadata = Column(JSONB)
    reported_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime)
    resolution_notes = Column(Text)
    
    # Relationships
    reporter = relationship('User', backref='reported_incidents')
    territory = relationship('Territory', backref='security_incidents')


class AuditReport(Base, AuditMixin):
    """Stores generated audit reports."""
    __tablename__ = 'audit_reports'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    report_type = Column(String(50), nullable=False)
    territory_id = Column(
        UUID(as_uuid=True),
        ForeignKey('territories.id'),
        nullable=True
    )
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    report_data = Column(JSONB, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    territory = relationship('Territory', backref='audit_reports') 