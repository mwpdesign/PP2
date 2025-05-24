"""Facility model for the healthcare IVR platform."""
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.core.database import Base


class Facility(Base):
    """Facility model representing healthcare facilities."""
    
    __tablename__ = 'facilities'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    facility_type = Column(String(50), nullable=False)  # hospital, clinic, nursing_home, etc.
    npi = Column(String(10), unique=True)  # National Provider Identifier
    address_line1 = Column(String(255), nullable=False)
    address_line2 = Column(String(255))
    city = Column(String(100), nullable=False)
    state = Column(String(2), nullable=False)
    zip_code = Column(String(10), nullable=False)
    phone = Column(String(20), nullable=False)
    fax = Column(String(20))
    email = Column(String(255))
    
    # Organization and Territory
    organization_id = Column(
        UUID(as_uuid=True),
        ForeignKey('organizations.id'),
        nullable=False
    )
    territory_id = Column(
        UUID(as_uuid=True),
        ForeignKey('territories.id'),
        nullable=False
    )

    # Status and metadata
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)

    # Relationships
    organization = relationship("Organization", back_populates="facilities")
    territory = relationship("Territory", back_populates="facilities")
    patients = relationship("Patient", back_populates="facility")

    def __repr__(self):
        """String representation of the facility."""
        return f"<Facility(name='{self.name}')>" 