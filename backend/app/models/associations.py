"""Association tables for models."""
from sqlalchemy import Column, ForeignKey, Table, String
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


# Association table for user-territory relationships
user_territories = Table(
    'user_territories',
    Base.metadata,
    Column(
        'user_id',
        UUID(as_uuid=True),
        ForeignKey('users.id'),
        primary_key=True
    ),
    Column(
        'territory_id',
        UUID(as_uuid=True),
        ForeignKey('territories.id'),
        primary_key=True
    )
)

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
    )
)