"""IVR models for the application."""
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from uuid import uuid4

from app.models.base import Base


class IVRRequest(Base):
    """IVR request model."""
    __tablename__ = "ivr_requests"
    __table_args__ = {'extend_existing': True}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    patient_id = Column(
        UUID(as_uuid=True),
        ForeignKey("patients.id"),
        nullable=False
    )
    provider_id = Column(
        UUID(as_uuid=True),
        ForeignKey("providers.id"),
        nullable=False
    )
    facility_id = Column(
        UUID(as_uuid=True),
        ForeignKey("facilities.id"),
        nullable=False
    )
    territory_id = Column(
        UUID(as_uuid=True),
        ForeignKey("territories.id"),
        nullable=False
    )
    service_type = Column(String, nullable=False)
    priority = Column(String, nullable=False)
    status = Column(String, nullable=False, default="pending")
    request_metadata = Column(JSON, nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )
    created_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False
    )
    updated_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False
    )


class IVRSession(Base):
    """IVR session model."""
    __tablename__ = "ivr_sessions"
    __table_args__ = {'extend_existing': True}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    patient_id = Column(
        UUID(as_uuid=True),
        ForeignKey("patients.id"),
        nullable=False
    )
    provider_id = Column(
        UUID(as_uuid=True),
        ForeignKey("providers.id"),
        nullable=False
    )
    territory_id = Column(
        UUID(as_uuid=True),
        ForeignKey("territories.id"),
        nullable=False
    )
    status = Column(String, nullable=False, default="active")
    insurance_data = Column(JSON, nullable=True)
    session_metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )
    created_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False
    )
    updated_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False
    )


class IVRDocument(Base):
    """IVR document model."""
    __tablename__ = "ivr_documents"
    __table_args__ = {'extend_existing': True}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    ivr_request_id = Column(
        UUID(as_uuid=True),
        ForeignKey("ivr_requests.id"),
        nullable=False
    )
    document_type = Column(String, nullable=False)
    document_key = Column(String, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )
    uploaded_by_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False
    ) 