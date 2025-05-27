"""Fix provider territory assignments table UUID columns.

Revision ID: 20240401_fix_provider_territory_assignments
Revises: 20240320_006_create_ivr_tables
Create Date: 2024-04-01 10:00:00.000000
"""
from datetime import datetime
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic
revision = '20240401_fix_provider_territory_assignments'
down_revision = '20240320_006_create_ivr_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create and fix provider_territory_assignments table."""
    # Create provider_territory_assignments table with UUID columns
    op.create_table(
        'provider_territory_assignments',
        sa.Column(
            'provider_id',
            UUID(as_uuid=True),
            sa.ForeignKey('providers.id'),
            primary_key=True
        ),
        sa.Column(
            'territory_id',
            UUID(as_uuid=True),
            sa.ForeignKey('territories.id'),
            primary_key=True
        ),
        sa.Column(
            'role',
            sa.String(50),
            nullable=False
        ),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            nullable=False,
            default=datetime.utcnow
        )
    )

    # Create indexes
    op.create_index(
        'ix_provider_territory_assignments_provider',
        'provider_territory_assignments',
        ['provider_id']
    )
    op.create_index(
        'ix_provider_territory_assignments_territory',
        'provider_territory_assignments',
        ['territory_id']
    )


def downgrade() -> None:
    """Remove provider_territory_assignments table."""
    op.drop_index('ix_provider_territory_assignments_territory')
    op.drop_index('ix_provider_territory_assignments_provider')
    op.drop_table('provider_territory_assignments')
