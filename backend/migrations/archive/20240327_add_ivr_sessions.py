"""Add IVR session tables.

Revision ID: 20240327_add_ivr_sessions
Revises: 20240330_update_patient_schema
Create Date: 2024-03-27 10:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20240327_add_ivr_sessions'
down_revision = '20240330_update_patient_schema'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create IVR session tables."""
    # Create ivr_sessions table
    op.create_table(
        'ivr_sessions',
        sa.Column(
            'id',
            postgresql.UUID(as_uuid=True),
            primary_key=True
        ),
        sa.Column(
            'patient_id',
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey('patients.id'),
            nullable=False
        ),
        sa.Column(
            'provider_id',
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey('providers.id'),
            nullable=False
        ),
        sa.Column(
            'territory_id',
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey('territories.id'),
            nullable=False
        ),
        sa.Column(
            'status',
            sa.String(20),
            nullable=False,
            default='pending'
        ),
        sa.Column(
            'insurance_data',
            postgresql.JSONB,
            nullable=True
        ),
        sa.Column(
            'metadata',
            postgresql.JSONB,
            nullable=True
        ),
        sa.Column(
            'created_at',
            sa.DateTime,
            nullable=False,
            server_default=sa.text('now()')
        ),
        sa.Column(
            'updated_at',
            sa.DateTime,
            nullable=False,
            server_default=sa.text('now()'),
            onupdate=sa.text('now()')
        )
    )

    # Create ivr_session_items table
    op.create_table(
        'ivr_session_items',
        sa.Column(
            'id',
            postgresql.UUID(as_uuid=True),
            primary_key=True
        ),
        sa.Column(
            'session_id',
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey('ivr_sessions.id'),
            nullable=False
        ),
        sa.Column(
            'product_id',
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey('products.id'),
            nullable=False
        ),
        sa.Column(
            'quantity',
            sa.Integer,
            nullable=False
        ),
        sa.Column(
            'notes',
            sa.String(1000),
            nullable=True
        ),
        sa.Column(
            'insurance_coverage',
            postgresql.JSONB,
            nullable=True
        ),
        sa.Column(
            'created_at',
            sa.DateTime,
            nullable=False,
            server_default=sa.text('now()')
        ),
        sa.Column(
            'updated_at',
            sa.DateTime,
            nullable=False,
            server_default=sa.text('now()'),
            onupdate=sa.text('now()')
        )
    )

    # Create indexes
    op.create_index(
        'ix_ivr_sessions_patient_id',
        'ivr_sessions',
        ['patient_id']
    )
    op.create_index(
        'ix_ivr_sessions_provider_id',
        'ivr_sessions',
        ['provider_id']
    )
    op.create_index(
        'ix_ivr_sessions_territory_id',
        'ivr_sessions',
        ['territory_id']
    )
    op.create_index(
        'ix_ivr_sessions_status',
        'ivr_sessions',
        ['status']
    )
    op.create_index(
        'ix_ivr_session_items_session_id',
        'ivr_session_items',
        ['session_id']
    )
    op.create_index(
        'ix_ivr_session_items_product_id',
        'ivr_session_items',
        ['product_id']
    )


def downgrade() -> None:
    """Drop IVR session tables."""
    # Drop indexes
    op.drop_index('ix_ivr_session_items_product_id')
    op.drop_index('ix_ivr_session_items_session_id')
    op.drop_index('ix_ivr_sessions_status')
    op.drop_index('ix_ivr_sessions_territory_id')
    op.drop_index('ix_ivr_sessions_provider_id')
    op.drop_index('ix_ivr_sessions_patient_id')

    # Drop tables
    op.drop_table('ivr_session_items')
    op.drop_table('ivr_sessions')