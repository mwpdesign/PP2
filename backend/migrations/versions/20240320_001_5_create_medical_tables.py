"""Create medical practice tables for facilities and providers.

Revision ID: 20240320_001_5_create_medical_tables
Revises: 20240320_001_create_core_tables
Create Date: 2024-03-20 10:30:00.000000
"""
from datetime import datetime
import uuid

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic
revision = '20240320_001_5_create_medical_tables'
down_revision = '20240320_001_create_core_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create facilities and providers tables."""
    # Create facilities table
    op.create_table(
        'facilities',
        sa.Column(
            'id',
            UUID(as_uuid=True),
            primary_key=True,
            default=uuid.uuid4,
            nullable=False
        ),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('facility_type', sa.String(50), nullable=False),
        sa.Column('npi', sa.String(10), unique=True),
        sa.Column('address_line1', sa.String(255), nullable=False),
        sa.Column('address_line2', sa.String(255)),
        sa.Column('city', sa.String(100), nullable=False),
        sa.Column('state', sa.String(2), nullable=False),
        sa.Column('zip_code', sa.String(10), nullable=False),
        sa.Column('phone', sa.String(20), nullable=False),
        sa.Column('fax', sa.String(20)),
        sa.Column('email', sa.String(255)),
        sa.Column(
            'organization_id',
            UUID(as_uuid=True),
            sa.ForeignKey('organizations.id'),
            nullable=False
        ),
        sa.Column(
            'territory_id',
            UUID(as_uuid=True),
            sa.ForeignKey('territories.id'),
            nullable=False
        ),
        sa.Column(
            'is_active',
            sa.Boolean,
            nullable=False,
            default=True
        ),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            nullable=False,
            default=datetime.utcnow
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            nullable=True,
            onupdate=datetime.utcnow
        )
    )

    # Create providers table
    op.create_table(
        'providers',
        sa.Column(
            'id',
            UUID(as_uuid=True),
            primary_key=True,
            default=uuid.uuid4,
            nullable=False
        ),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('npi', sa.String(10), unique=True, nullable=False),
        sa.Column('tax_id', sa.String(10), unique=True, nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('phone', sa.String(20), nullable=False),
        sa.Column('fax', sa.String(20)),
        sa.Column('address_line1', sa.String(255), nullable=False),
        sa.Column('address_line2', sa.String(255)),
        sa.Column('city', sa.String(100), nullable=False),
        sa.Column('state', sa.String(2), nullable=False),
        sa.Column('zip_code', sa.String(10), nullable=False),
        sa.Column('specialty', sa.String(100)),
        sa.Column(
            'accepting_new_patients',
            sa.Boolean,
            nullable=False,
            default=True
        ),
        sa.Column('insurance_networks', sa.Text),
        sa.Column('office_hours', sa.Text),
        sa.Column(
            'is_active',
            sa.Boolean,
            nullable=False,
            default=True
        ),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            nullable=False,
            default=datetime.utcnow
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            nullable=False,
            default=datetime.utcnow,
            onupdate=datetime.utcnow
        ),
        sa.Column(
            'created_by_id',
            UUID(as_uuid=True),
            sa.ForeignKey('users.id'),
            nullable=False
        )
    )

    # Create provider relationships table
    op.create_table(
        'provider_relationships',
        sa.Column(
            'id',
            UUID(as_uuid=True),
            primary_key=True,
            default=uuid.uuid4,
            nullable=False
        ),
        sa.Column(
            'provider_id',
            UUID(as_uuid=True),
            sa.ForeignKey('providers.id'),
            nullable=False
        ),
        sa.Column(
            'related_provider_id',
            UUID(as_uuid=True),
            sa.ForeignKey('providers.id'),
            nullable=False
        ),
        sa.Column(
            'relationship_type',
            sa.String(50),
            nullable=False
        ),
        sa.Column(
            'start_date',
            sa.DateTime(timezone=True),
            nullable=False
        ),
        sa.Column(
            'end_date',
            sa.DateTime(timezone=True),
            nullable=True
        ),
        sa.Column(
            'status',
            sa.String(50),
            nullable=False
        ),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            nullable=False,
            default=datetime.utcnow
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            nullable=False,
            default=datetime.utcnow,
            onupdate=datetime.utcnow
        )
    )

    # Create indexes
    op.create_index(
        'ix_facilities_name',
        'facilities',
        ['name']
    )
    op.create_index(
        'ix_facilities_npi',
        'facilities',
        ['npi']
    )
    op.create_index(
        'ix_facilities_territory',
        'facilities',
        ['territory_id']
    )
    op.create_index(
        'ix_providers_name',
        'providers',
        ['name']
    )
    op.create_index(
        'ix_providers_npi',
        'providers',
        ['npi']
    )
    op.create_index(
        'ix_providers_specialty',
        'providers',
        ['specialty']
    )
    op.create_index(
        'ix_provider_relationships_provider',
        'provider_relationships',
        ['provider_id']
    )
    op.create_index(
        'ix_provider_relationships_related',
        'provider_relationships',
        ['related_provider_id']
    )


def downgrade() -> None:
    """Remove medical practice tables."""
    op.drop_index('ix_provider_relationships_related')
    op.drop_index('ix_provider_relationships_provider')
    op.drop_index('ix_providers_specialty')
    op.drop_index('ix_providers_npi')
    op.drop_index('ix_providers_name')
    op.drop_index('ix_facilities_territory')
    op.drop_index('ix_facilities_npi')
    op.drop_index('ix_facilities_name')
    op.drop_table('provider_relationships')
    op.drop_table('providers')
    op.drop_table('facilities')
