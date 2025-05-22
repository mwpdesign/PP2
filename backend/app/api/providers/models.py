from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from typing import Optional

from app.core.database import Base
from app.core.encryption import encrypt_field, decrypt_field
from app.core.security import generate_uuid

class Facility(Base):
    __tablename__ = "facilities"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    encrypted_address = Column(String(1024))  # Encrypted using KMS
    territory_id = Column(String(36), ForeignKey("provider_territories.id"))
    status = Column(String(50), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    metadata = Column(JSON, default={})

    # Relationships
    territory = relationship("ProviderTerritory", back_populates="facilities")
    providers = relationship("Provider", back_populates="facility")

    @property
    def address(self) -> Optional[str]:
        return decrypt_field(self.encrypted_address) if self.encrypted_address else None

    @address.setter
    def address(self, value: str):
        self.encrypted_address = encrypt_field(value) if value else None

class Provider(Base):
    __tablename__ = "providers"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    facility_id = Column(String(36), ForeignKey("facilities.id"))
    encrypted_npi = Column(String(255))  # National Provider Identifier
    encrypted_first_name = Column(String(255))
    encrypted_last_name = Column(String(255))
    encrypted_email = Column(String(255))
    encrypted_phone = Column(String(255))
    specialty = Column(String(100))
    status = Column(String(50), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    metadata = Column(JSON, default={})

    # Relationships
    facility = relationship("Facility", back_populates="providers")
    credentials = relationship("ProviderCredentials", back_populates="provider")
    territories = relationship("ProviderTerritory", secondary="provider_territory_assignments")

    @property
    def npi(self) -> Optional[str]:
        return decrypt_field(self.encrypted_npi) if self.encrypted_npi else None

    @npi.setter
    def npi(self, value: str):
        self.encrypted_npi = encrypt_field(value) if value else None

    @property
    def first_name(self) -> Optional[str]:
        return decrypt_field(self.encrypted_first_name) if self.encrypted_first_name else None

    @first_name.setter
    def first_name(self, value: str):
        self.encrypted_first_name = encrypt_field(value) if value else None

    @property
    def last_name(self) -> Optional[str]:
        return decrypt_field(self.encrypted_last_name) if self.encrypted_last_name else None

    @last_name.setter
    def last_name(self, value: str):
        self.encrypted_last_name = encrypt_field(value) if value else None

    @property
    def email(self) -> Optional[str]:
        return decrypt_field(self.encrypted_email) if self.encrypted_email else None

    @email.setter
    def email(self, value: str):
        self.encrypted_email = encrypt_field(value) if value else None

    @property
    def phone(self) -> Optional[str]:
        return decrypt_field(self.encrypted_phone) if self.encrypted_phone else None

    @phone.setter
    def phone(self, value: str):
        self.encrypted_phone = encrypt_field(value) if value else None

class ProviderCredentials(Base):
    __tablename__ = "provider_credentials"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    provider_id = Column(String(36), ForeignKey("providers.id"))
    credential_type = Column(String(100))  # e.g., "medical_license", "board_certification"
    encrypted_credential_number = Column(String(255))
    issuing_authority = Column(String(255))
    issue_date = Column(DateTime)
    expiry_date = Column(DateTime)
    verification_status = Column(String(50), default="pending")
    document_key = Column(String(255))  # S3 key for stored document
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    provider = relationship("Provider", back_populates="credentials")

    @property
    def credential_number(self) -> Optional[str]:
        return decrypt_field(self.encrypted_credential_number) if self.encrypted_credential_number else None

    @credential_number.setter
    def credential_number(self, value: str):
        self.encrypted_credential_number = encrypt_field(value) if value else None

class ProviderTerritory(Base):
    __tablename__ = "provider_territories"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    boundary_data = Column(JSON)  # GeoJSON data for territory boundaries
    parent_id = Column(String(36), ForeignKey("provider_territories.id"))
    status = Column(String(50), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    facilities = relationship("Facility", back_populates="territory")
    providers = relationship("Provider", secondary="provider_territory_assignments")
    children = relationship("ProviderTerritory")

class ProviderTerritoryAssignment(Base):
    __tablename__ = "provider_territory_assignments"

    provider_id = Column(String(36), ForeignKey("providers.id"), primary_key=True)
    territory_id = Column(String(36), ForeignKey("provider_territories.id"), primary_key=True)
    role = Column(String(50))  # e.g., "primary", "secondary"
    created_at = Column(DateTime, default=datetime.utcnow)

class ProviderRelationship(Base):
    __tablename__ = "provider_relationships"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    provider_id = Column(String(36), ForeignKey("providers.id"))
    related_provider_id = Column(String(36), ForeignKey("providers.id"))
    relationship_type = Column(String(50))  # e.g., "supervisor", "colleague"
    start_date = Column(DateTime)
    end_date = Column(DateTime, nullable=True)
    status = Column(String(50), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    provider = relationship("Provider", foreign_keys=[provider_id])
    related_provider = relationship("Provider", foreign_keys=[related_provider_id]) 