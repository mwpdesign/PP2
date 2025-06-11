"""Doctor Profile model for comprehensive doctor information."""

from datetime import datetime
from sqlalchemy import (
    String, Boolean, DateTime, Integer, ForeignKey, Column, Text, ARRAY
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from uuid import uuid4
from typing import TYPE_CHECKING

from app.core.database import Base

if TYPE_CHECKING:
    from .user import User  # noqa: F401


class DoctorProfile(Base):
    """Comprehensive doctor profile information."""

    __tablename__ = "doctor_profiles"

    id = Column(
        UUID(as_uuid=True), primary_key=True, default=uuid4, index=True
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True
    )

    # Personal Information
    professional_title = Column(String(100))  # Dr., MD, DO, etc.
    specialty = Column(String(200))  # Wound Care, Podiatry, etc.

    # Professional Credentials
    medical_license_number = Column(String(50))
    medical_license_state = Column(String(2))
    npi_number = Column(String(10))  # National Provider Identifier
    medicare_ptan = Column(String(20))  # Medicare Provider Transaction Access
    medicaid_provider_number = Column(String(50))
    tax_id = Column(String(20))  # Federal Tax ID or EIN
    dea_number = Column(String(20))  # Drug Enforcement Administration

    # Facility Information
    primary_facility_name = Column(String(200))
    facility_address_line1 = Column(String(200))
    facility_address_line2 = Column(String(200))
    facility_city = Column(String(100))
    facility_state = Column(String(2))
    facility_zip_code = Column(String(10))
    facility_phone = Column(String(20))
    facility_fax = Column(String(20))
    office_contact_name = Column(String(100))
    office_contact_phone = Column(String(20))
    office_contact_email = Column(String(255))

    # Shipping Information
    shipping_address_line1 = Column(String(200))
    shipping_address_line2 = Column(String(200))
    shipping_city = Column(String(100))
    shipping_state = Column(String(2))
    shipping_zip_code = Column(String(10))
    shipping_contact_name = Column(String(100))
    shipping_contact_phone = Column(String(20))
    delivery_instructions = Column(Text)
    preferred_delivery_time = Column(String(100))  # Morning, Afternoon, etc.

    # Professional Information
    professional_bio = Column(Text)
    years_in_practice = Column(Integer)
    board_certifications = Column(ARRAY(Text))  # Array of certifications
    hospital_affiliations = Column(ARRAY(Text))  # Array of hospital names

    # Practice Details
    practice_type = Column(String(50))  # Solo, Group, Hospital-based, etc.
    patient_volume_per_month = Column(Integer)
    wound_care_percentage = Column(Integer)  # What % of practice is wound care

    # Insurance and Billing
    accepts_medicare = Column(Boolean, default=True)
    accepts_medicaid = Column(Boolean, default=True)
    preferred_insurance_carriers = Column(ARRAY(Text))  # Array of insurers
    billing_contact_name = Column(String(100))
    billing_contact_phone = Column(String(20))
    billing_contact_email = Column(String(255))

    # Audit fields
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    updated_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))

    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="doctor_profile")
    created_by = relationship("User", foreign_keys=[created_by_id])
    updated_by = relationship("User", foreign_keys=[updated_by_id])

    def __repr__(self) -> str:
        """String representation of the doctor profile."""
        return f"<DoctorProfile(user_id='{self.user_id}', specialty='{self.specialty}')>"

    @property
    def full_name(self) -> str:
        """Get the doctor's full name with title."""
        if self.user and self.professional_title:
            return f"{self.professional_title} {self.user.full_name}"
        elif self.user:
            return self.user.full_name
        return "Unknown Doctor"

    @property
    def facility_address(self) -> str:
        """Get formatted facility address."""
        parts = []
        if self.facility_address_line1:
            parts.append(self.facility_address_line1)
        if self.facility_address_line2:
            parts.append(self.facility_address_line2)
        if self.facility_city and self.facility_state:
            parts.append(f"{self.facility_city}, {self.facility_state}")
        if self.facility_zip_code:
            parts.append(self.facility_zip_code)
        return ", ".join(parts) if parts else ""

    @property
    def shipping_address(self) -> str:
        """Get formatted shipping address."""
        parts = []
        if self.shipping_address_line1:
            parts.append(self.shipping_address_line1)
        if self.shipping_address_line2:
            parts.append(self.shipping_address_line2)
        if self.shipping_city and self.shipping_state:
            parts.append(f"{self.shipping_city}, {self.shipping_state}")
        if self.shipping_zip_code:
            parts.append(self.shipping_zip_code)
        return ", ".join(parts) if parts else ""

    @property
    def is_wound_care_specialist(self) -> bool:
        """Check if doctor specializes in wound care."""
        if not self.wound_care_percentage:
            return False
        return self.wound_care_percentage >= 50

    @property
    def accepts_insurance(self) -> bool:
        """Check if doctor accepts any insurance."""
        return self.accepts_medicare or self.accepts_medicaid

    def get_contact_info(self) -> dict:
        """Get primary contact information."""
        return {
            "facility_name": self.primary_facility_name,
            "phone": self.facility_phone,
            "fax": self.facility_fax,
            "email": self.office_contact_email,
            "contact_person": self.office_contact_name,
            "contact_phone": self.office_contact_phone
        }

    def get_credentials(self) -> dict:
        """Get professional credentials."""
        return {
            "npi": self.npi_number,
            "medical_license": self.medical_license_number,
            "license_state": self.medical_license_state,
            "medicare_ptan": self.medicare_ptan,
            "medicaid_number": self.medicaid_provider_number,
            "tax_id": self.tax_id,
            "dea_number": self.dea_number
        }