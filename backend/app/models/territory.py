"""Territory management models for the healthcare IVR platform."""
from datetime import datetime
from sqlalchemy import (
    Column, String, DateTime, ForeignKey, Table, Float, JSON
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.core.database import Base


# Association table for territory-role access
territory_role_access = Table(
    'territory_role_access',
    Base.metadata,
    Column(
        'territory_id',
        UUID(as_uuid=True),
        ForeignKey('territories.id'),
        primary_key=True
    ),
    Column(
        'role_id',
        UUID(as_uuid=True),
        ForeignKey('roles.id'),
        primary_key=True
    ),
    Column(
        'access_level',
        String(50),
        nullable=False
    ),
    Column(
        'granted_at',
        DateTime,
        nullable=False,
        default=datetime.utcnow
    ),
    Column(
        'granted_by',
        UUID(as_uuid=True),
        ForeignKey('users.id')
    )
)


class Territory(Base):
    """Territory model for geographic and organizational boundaries."""
    
    __tablename__ = 'territories'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    code = Column(String(20), nullable=False)
    organization_id = Column(
        UUID(as_uuid=True),
        ForeignKey('organizations.id'),
        nullable=False
    )
    parent_territory_id = Column(
        UUID(as_uuid=True),
        ForeignKey('territories.id')
    )
    type = Column(String(50), nullable=False)
    territory_metadata = Column(JSON, nullable=False, server_default='{}')
    security_policy = Column(JSON, nullable=False, server_default='{}')
    latitude = Column(Float)
    longitude = Column(Float)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)

    # Relationships
    organization = relationship("Organization", back_populates="territories")
    parent_territory = relationship("Territory", remote_side=[id])
    allowed_roles = relationship(
        "Role",
        secondary=territory_role_access,
        back_populates="accessible_territories"
    )
    users = relationship(
        "User",
        primaryjoin="Territory.id==User.primary_territory_id",
        back_populates="primary_territory"
    )
    facilities = relationship("Facility", back_populates="territory")
    orders = relationship("Order", back_populates="territory")

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