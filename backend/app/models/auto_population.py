"""Auto-population models for Healthcare IVR Platform."""

from datetime import datetime
from typing import Dict, Any
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, JSON, Float, Boolean, ForeignKey
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class AutoPopulationSource(Base):
    """Model for auto-population data sources."""

    __tablename__ = "auto_population_sources"

    id = Column(String, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    # insurance, patient_history, medical_records, templates
    source_type = Column(String(50), nullable=False, index=True)
    provider = Column(String(100), nullable=True)  # Insurance provider name
    api_endpoint = Column(String(500), nullable=True)  # External API endpoint

    # Configuration
    is_active = Column(Boolean, default=True, nullable=False)
    # Minimum confidence for auto-population
    confidence_threshold = Column(Float, default=0.8, nullable=False)
    requires_verification = Column(Boolean, default=True, nullable=False)

    # Metadata
    description = Column(Text)
    last_sync = Column(DateTime, nullable=True)
    # daily, weekly, monthly
    sync_frequency = Column(String(50), default="daily")

    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow,
        nullable=False
    )

    # Relationships
    population_records = relationship(
        "AutoPopulationRecord", back_populates="source",
        cascade="all, delete-orphan"
    )

    def to_dict(self) -> Dict[str, Any]:
        """Convert source to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "sourceType": self.source_type,
            "provider": self.provider,
            "apiEndpoint": self.api_endpoint,
            "isActive": self.is_active,
            "confidenceThreshold": self.confidence_threshold,
            "requiresVerification": self.requires_verification,
            "description": self.description,
            "lastSync": (
                self.last_sync.isoformat() if self.last_sync else None
            ),
            "syncFrequency": self.sync_frequency,
            "createdAt": self.created_at.isoformat(),
            "updatedAt": self.updated_at.isoformat()
        }


class AutoPopulationRecord(Base):
    """Model for tracking auto-population attempts and results."""

    __tablename__ = "auto_population_records"

    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(
        String, ForeignKey("auto_population_sources.id"),
        nullable=False, index=True
    )

    # Context
    user_id = Column(String, nullable=False, index=True)
    patient_id = Column(String, nullable=True, index=True)
    ivr_request_id = Column(String, nullable=True, index=True)
    form_field = Column(String(100), nullable=False, index=True)

    # Population data (encrypted for PHI)
    suggested_value = Column(Text, nullable=False)  # Encrypted suggested value
    confidence_score = Column(Float, nullable=False)  # 0.0 to 1.0
    # True if user accepted, False if rejected, None if pending
    was_accepted = Column(Boolean, nullable=True)
    final_value = Column(Text, nullable=True)  # Encrypted final value used

    # Metadata
    # insurance_lookup, history_match, template_match
    population_method = Column(String(50), nullable=False)
    source_reference = Column(String(500), nullable=True)
    processing_time_ms = Column(Integer, nullable=True)

    # Audit fields
    timestamp = Column(
        DateTime, default=datetime.utcnow, nullable=False, index=True
    )
    session_id = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)

    # Relationships
    source = relationship(
        "AutoPopulationSource", back_populates="population_records"
    )

    def to_dict(self) -> Dict[str, Any]:
        """Convert record to dictionary."""
        return {
            "id": self.id,
            "sourceId": self.source_id,
            "userId": self.user_id,
            "patientId": self.patient_id,
            "ivrRequestId": self.ivr_request_id,
            "formField": self.form_field,
            # Note: This should be decrypted before returning
            "suggestedValue": self.suggested_value,
            "confidenceScore": self.confidence_score,
            "wasAccepted": self.was_accepted,
            # Note: This should be decrypted before returning
            "finalValue": self.final_value,
            "populationMethod": self.population_method,
            "sourceReference": self.source_reference,
            "processingTimeMs": self.processing_time_ms,
            "timestamp": self.timestamp.isoformat(),
            "sessionId": self.session_id
        }


class InsuranceDatabase(Base):
    """Model for insurance provider databases used for auto-population."""

    __tablename__ = "insurance_databases"

    id = Column(String, primary_key=True, index=True)
    provider_name = Column(String(255), nullable=False, index=True)
    provider_code = Column(
        String(50), nullable=False, unique=True, index=True
    )

    # Coverage information
    coverage_types = Column(JSON, nullable=False)  # List of coverage types
    formulary_data = Column(JSON, nullable=True)  # Medication formulary
    # Prior authorization rules
    prior_auth_requirements = Column(JSON, nullable=True)

    # Network information
    network_providers = Column(JSON, nullable=True)  # In-network providers
    coverage_areas = Column(JSON, nullable=True)  # Geographic coverage

    # Metadata
    is_active = Column(Boolean, default=True, nullable=False)
    last_updated = Column(DateTime, default=datetime.utcnow, nullable=False)
    data_version = Column(String(50), nullable=True)

    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow,
        nullable=False
    )

    def to_dict(self) -> Dict[str, Any]:
        """Convert insurance database to dictionary."""
        return {
            "id": self.id,
            "providerName": self.provider_name,
            "providerCode": self.provider_code,
            "coverageTypes": self.coverage_types,
            "formularyData": self.formulary_data,
            "priorAuthRequirements": self.prior_auth_requirements,
            "networkProviders": self.network_providers,
            "coverageAreas": self.coverage_areas,
            "isActive": self.is_active,
            "lastUpdated": self.last_updated.isoformat(),
            "dataVersion": self.data_version,
            "createdAt": self.created_at.isoformat(),
            "updatedAt": self.updated_at.isoformat()
        }


class PatientHistoryCache(Base):
    """Model for caching patient history data for auto-population."""

    __tablename__ = "patient_history_cache"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String, nullable=False, index=True)

    # Cached data (encrypted for PHI)
    medical_conditions = Column(Text, nullable=True)  # Encrypted JSON
    medications = Column(Text, nullable=True)  # Encrypted JSON of medications
    allergies = Column(Text, nullable=True)  # Encrypted JSON of allergies
    # Encrypted JSON of treatments
    previous_treatments = Column(Text, nullable=True)
    insurance_info = Column(Text, nullable=True)  # Encrypted JSON of insurance

    # Cache metadata
    cache_version = Column(String(50), nullable=False, default="1.0")
    last_accessed = Column(DateTime, default=datetime.utcnow, nullable=False)
    access_count = Column(Integer, default=0, nullable=False)
    expires_at = Column(DateTime, nullable=True)

    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow,
        nullable=False
    )

    def to_dict(self) -> Dict[str, Any]:
        """Convert cache to dictionary."""
        return {
            "id": self.id,
            "patientId": self.patient_id,
            "medicalConditions": self.medical_conditions,  # Note: Should be decrypted
            "medications": self.medications,  # Note: Should be decrypted
            "allergies": self.allergies,  # Note: Should be decrypted
            # Note: Should be decrypted
            "previousTreatments": self.previous_treatments,
            "insuranceInfo": self.insurance_info,  # Note: Should be decrypted
            "cacheVersion": self.cache_version,
            "lastAccessed": self.last_accessed.isoformat(),
            "accessCount": self.access_count,
            "expiresAt": (
                self.expires_at.isoformat() if self.expires_at else None
            ),
            "createdAt": self.created_at.isoformat(),
            "updatedAt": self.updated_at.isoformat()
        }


# Default auto-population sources
DEFAULT_AUTO_POPULATION_SOURCES = [
    {
        "id": "bcbs-insurance",
        "name": "Blue Cross Blue Shield",
        "sourceType": "insurance",
        "provider": "Blue Cross Blue Shield",
        "isActive": True,
        "confidenceThreshold": 0.9,
        "requiresVerification": True,
        "description": "Auto-populate from BCBS insurance database"
    },
    {
        "id": "aetna-insurance",
        "name": "Aetna Insurance",
        "sourceType": "insurance",
        "provider": "Aetna",
        "isActive": True,
        "confidenceThreshold": 0.9,
        "requiresVerification": True,
        "description": "Auto-populate from Aetna insurance database"
    },
    {
        "id": "patient-history",
        "name": "Patient Medical History",
        "sourceType": "patient_history",
        "isActive": True,
        "confidenceThreshold": 0.8,
        "requiresVerification": False,
        "description": "Auto-populate from patient's previous medical records"
    },
    {
        "id": "wound-templates",
        "name": "Wound Care Templates",
        "sourceType": "templates",
        "isActive": True,
        "confidenceThreshold": 0.7,
        "requiresVerification": False,
        "description": "Auto-populate from wound care templates"
    }
]