"""Organization model for the healthcare IVR platform."""
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.core.database import Base


class Organization(Base):
    """Organization model representing healthcare providers."""
    
    __tablename__ = 'organizations'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(String(500))
    settings = Column(JSON, nullable=False, server_default='{}')
    security_policy = Column(JSON, nullable=False, server_default='{}')
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)

    # Relationships
    users = relationship("User", back_populates="organization")
    territories = relationship("Territory", back_populates="organization")
    roles = relationship("Role", back_populates="organization")
    facilities = relationship("Facility", back_populates="organization")

    def __repr__(self):
        """String representation of the organization."""
        return f"<Organization(name='{self.name}')>" 