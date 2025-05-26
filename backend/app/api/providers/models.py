from datetime import datetime
from typing import Optional
from sqlalchemy import String, ForeignKey, DateTime, Boolean, JSON
from sqlalchemy.orm import relationship, Mapped, mapped_column

from app.core.database import Base
from app.core.encryption import encrypt_field, decrypt_field
from app.core.security import generate_uuid

class Facility(Base):
    """Facility model for healthcare providers."""
    __tablename__ = "facilities"
    __table_args__ = {'extend_existing': True}

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    encrypted_address: Mapped[Optional[str]] = mapped_column(
        String(1024)
    )
    territory_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("provider_territories.id")
    )
    status: Mapped[str] = mapped_column(String(50), default="active")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )
    facility_metadata: Mapped[dict] = mapped_column(JSON, default={})

    # Relationships
    territory = relationship("ProviderTerritory", back_populates="facilities")
    providers = relationship("Provider", back_populates="facility")

    @property
    def address(self) -> Optional[str]:
        return (
            decrypt_field(self.encrypted_address)
            if self.encrypted_address else None
        )

    @address.setter
    def address(self, value: str):
        self.encrypted_address = encrypt_field(value) if value else None

class Provider(Base):
    """Provider model for healthcare providers."""
    __tablename__ = "providers"
    __table_args__ = {'extend_existing': True}

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid
    )
    facility_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("facilities.id")
    )
    # National Provider Identifier
    encrypted_npi: Mapped[Optional[str]] = mapped_column(String(255))
    encrypted_first_name: Mapped[Optional[str]] = mapped_column(
        String(255)
    )
    encrypted_last_name: Mapped[Optional[str]] = mapped_column(
        String(255)
    )
    encrypted_email: Mapped[Optional[str]] = mapped_column(String(255))
    encrypted_phone: Mapped[Optional[str]] = mapped_column(String(255))
    specialty: Mapped[str] = mapped_column(String(100))
    status: Mapped[str] = mapped_column(String(50), default="active")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )
    provider_metadata: Mapped[dict] = mapped_column(JSON, default={})

    # Relationships
    facility = relationship("Facility", back_populates="providers")
    credentials = relationship("ProviderCredentials", back_populates="provider")
    territories = relationship(
        "ProviderTerritory",
        secondary="provider_territory_assignments"
    )

    @property
    def npi(self) -> Optional[str]:
        return decrypt_field(self.encrypted_npi) if self.encrypted_npi else None

    @npi.setter
    def npi(self, value: str):
        self.encrypted_npi = encrypt_field(value) if value else None

    @property
    def first_name(self) -> Optional[str]:
        return (
            decrypt_field(self.encrypted_first_name)
            if self.encrypted_first_name else None
        )

    @first_name.setter
    def first_name(self, value: str):
        self.encrypted_first_name = encrypt_field(value) if value else None

    @property
    def last_name(self) -> Optional[str]:
        return (
            decrypt_field(self.encrypted_last_name)
            if self.encrypted_last_name else None
        )

    @last_name.setter
    def last_name(self, value: str):
        self.encrypted_last_name = encrypt_field(value) if value else None

    @property
    def email(self) -> Optional[str]:
        return (
            decrypt_field(self.encrypted_email)
            if self.encrypted_email else None
        )

    @email.setter
    def email(self, value: str):
        self.encrypted_email = encrypt_field(value) if value else None

    @property
    def phone(self) -> Optional[str]:
        return (
            decrypt_field(self.encrypted_phone)
            if self.encrypted_phone else None
        )

    @phone.setter
    def phone(self, value: str):
        self.encrypted_phone = encrypt_field(value) if value else None

class ProviderCredentials(Base):
    """Provider credentials model."""
    __tablename__ = "provider_credentials"
    __table_args__ = {'extend_existing': True}

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid
    )
    provider_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("providers.id")
    )
    # e.g., "medical_license", "board_certification"
    credential_type: Mapped[str] = mapped_column(String(100))
    encrypted_credential_number: Mapped[Optional[str]] = mapped_column(
        String(255)
    )
    issuing_authority: Mapped[str] = mapped_column(String(255))
    issue_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    expiry_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    verification_status: Mapped[str] = mapped_column(
        String(50),
        default="pending"
    )
    # S3 key for stored document
    document_key: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    # Relationships
    provider = relationship("Provider", back_populates="credentials")

    @property
    def credential_number(self) -> Optional[str]:
        return (
            decrypt_field(self.encrypted_credential_number)
            if self.encrypted_credential_number else None
        )

    @credential_number.setter
    def credential_number(self, value: str):
        self.encrypted_credential_number = encrypt_field(value) if value else None

class ProviderTerritory(Base):
    """Provider territory model."""
    __tablename__ = "provider_territories"
    __table_args__ = {'extend_existing': True}

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    # GeoJSON data for territory boundaries
    boundary_data: Mapped[dict] = mapped_column(JSON)
    parent_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("provider_territories.id")
    )
    status: Mapped[str] = mapped_column(String(50), default="active")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    # Relationships
    facilities = relationship("Facility", back_populates="territory")
    providers = relationship(
        "Provider",
        secondary="provider_territory_assignments"
    )
    children = relationship("ProviderTerritory")

class ProviderTerritoryAssignment(Base):
    """Provider territory assignment model."""
    __tablename__ = "provider_territory_assignments"
    __table_args__ = {'extend_existing': True}

    provider_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("providers.id"),
        primary_key=True
    )
    territory_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("provider_territories.id"),
        primary_key=True
    )
    # e.g., "primary", "secondary"
    role: Mapped[str] = mapped_column(String(50))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow
    )

class ProviderRelationship(Base):
    """Provider relationship model."""
    __tablename__ = "provider_relationships"
    __table_args__ = {'extend_existing': True}

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid
    )
    provider_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("providers.id")
    )
    related_provider_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("providers.id")
    )
    # e.g., "supervisor", "colleague"
    relationship_type: Mapped[str] = mapped_column(String(50))
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    end_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    status: Mapped[str] = mapped_column(String(50), default="active")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    # Relationships
    provider = relationship("Provider", foreign_keys=[provider_id])
    related_provider = relationship(
        "Provider",
        foreign_keys=[related_provider_id]
    ) 