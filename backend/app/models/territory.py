"""Territory management models for the healthcare IVR platform."""
from datetime import datetime
from uuid import UUID as PyUUID, uuid4
from sqlalchemy import (
    String, DateTime, ForeignKey, Float, JSON
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, Mapped, mapped_column

from app.core.database import Base
from app.models.associations import user_territories, territory_role_access


class Territory(Base):
    """Territory model for geographic and organizational boundaries."""
    
    __tablename__ = 'territories'

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    description: Mapped[str] = mapped_column(String(500))
    
    # Geographic boundaries
    latitude: Mapped[float] = mapped_column(Float, nullable=True)
    longitude: Mapped[float] = mapped_column(Float, nullable=True)
    radius_miles: Mapped[float] = mapped_column(Float, nullable=True)
    boundaries: Mapped[dict] = mapped_column(JSON, nullable=True)  # GeoJSON
    
    # Organization
    organization_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey('organizations.id'),
        nullable=False
    )
    parent_territory_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey('territories.id'),
        nullable=True
    )
    
    # Settings and metadata
    settings: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
        server_default='{}'
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        onupdate=datetime.utcnow
    )

    # Relationships
    organization = relationship("Organization", back_populates="territories")
    parent_territory = relationship(
        "Territory",
        remote_side=[id],
        back_populates="child_territories"
    )
    child_territories = relationship(
        "Territory",
        back_populates="parent_territory"
    )
    users = relationship(
        "User",
        foreign_keys="User.primary_territory_id",
        back_populates="territory"
    )
    authorized_users = relationship(
        "User",
        secondary=user_territories,
        back_populates="accessible_territories"
    )
    facilities = relationship("Facility", back_populates="territory")
    orders = relationship("Order", back_populates="territory")
    allowed_roles = relationship(
        "Role",
        secondary=territory_role_access,
        back_populates="accessible_territories"
    )
    phi_access_logs = relationship(
        "PHIAccess",
        back_populates="territory"
    )
    audit_logs = relationship(
        "AuditLog",
        back_populates="territory"
    )
    compliance_checks = relationship(
        "ComplianceCheck",
        back_populates="territory"
    )
    audit_reports = relationship(
        "AuditReport",
        back_populates="territory"
    )
    secondary_insurance = relationship(
        "SecondaryInsurance",
        back_populates="territory"
    )
    ivr_requests = relationship(
        "IVRRequest",
        back_populates="territory",
        cascade="all, delete-orphan"
    )
    ivr_sessions = relationship(
        "IVRSession",
        back_populates="territory",
        cascade="all, delete-orphan"
    )
    patients = relationship(
        "Patient",
        back_populates="territory"
    )

    def __repr__(self):
        """String representation of the territory."""
        return f"<Territory(name='{self.name}', code='{self.code}')>"

    @property
    def full_code(self):
        """Get the full territory code including parent codes."""
        codes = []
        current = self
        while current:
            codes.insert(0, current.code)
            current = current.parent_territory
        return ".".join(codes)

    def is_ancestor_of(self, other_territory) -> bool:
        """Check if this territory is an ancestor of another territory."""
        current = other_territory
        while current:
            if current.id == self.id:
                return True
            current = current.parent_territory
        return False

    def is_descendant_of(self, other_territory) -> bool:
        """Check if this territory is a descendant of another territory."""
        return other_territory.is_ancestor_of(self) 