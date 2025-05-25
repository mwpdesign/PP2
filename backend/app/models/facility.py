"""Facility model for the healthcare IVR platform."""
from datetime import datetime
from uuid import UUID as PyUUID, uuid4
from sqlalchemy import String, DateTime, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Facility(Base):
    """Facility model representing healthcare facilities."""
    
    __tablename__ = 'facilities'

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    facility_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )  # hospital, clinic, nursing_home, etc.
    npi: Mapped[str] = mapped_column(
        String(10),
        unique=True
    )  # National Provider Identifier
    address_line1: Mapped[str] = mapped_column(String(255), nullable=False)
    address_line2: Mapped[str] = mapped_column(String(255))
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[str] = mapped_column(String(2), nullable=False)
    zip_code: Mapped[str] = mapped_column(String(10), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    fax: Mapped[str] = mapped_column(String(20))
    email: Mapped[str] = mapped_column(String(255))
    
    # Organization and Territory
    organization_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey('organizations.id'),
        nullable=False
    )
    territory_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey('territories.id'),
        nullable=False
    )

    # Status and metadata
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

    # Relationships
    organization = relationship("Organization", back_populates="facilities")
    territory = relationship("Territory", back_populates="facilities")
    patients = relationship("Patient", back_populates="facility")

    def __repr__(self):
        """String representation of the facility."""
        return f"<Facility(name='{self.name}')>" 