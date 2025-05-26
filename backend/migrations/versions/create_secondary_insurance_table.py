"""Create secondary insurance table.

Revision ID: create_secondary_insurance_table
Revises: update_patient_insurance_columns
Create Date: 2024-03-20 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'create_secondary_insurance_table'
down_revision = 'update_patient_insurance_columns'
branch_labels = None
depends_on = None


def upgrade():
    """Create secondary_insurance table."""
    op.create_table(
        'secondary_insurance',
        sa.Column(
            'id',
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text('gen_random_uuid()')
        ),
        sa.Column(
            'patient_id',
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey('patients.id'),
            nullable=False
        ),
        sa.Column(
            'insurance_provider',
            sa.String(100),
            nullable=False
        ),
        sa.Column(
            'insurance_id',
            sa.String(100),
            nullable=False
        ),
        sa.Column(
            'insurance_group',
            sa.String(100),
            nullable=True
        ),
        sa.Column(
            'insurance_phone',
            sa.String(20),
            nullable=True
        ),
        sa.Column(
            'coverage_start_date',
            sa.DateTime(timezone=True),
            nullable=False
        ),
        sa.Column(
            'coverage_end_date',
            sa.DateTime(timezone=True),
            nullable=True
        ),
        sa.Column(
            'verification_status',
            sa.String(50),
            nullable=False,
            server_default='pending'
        ),
        sa.Column(
            'verification_data',
            postgresql.JSONB,
            nullable=True
        ),
        sa.Column(
            'territory_id',
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey('territories.id'),
            nullable=False
        ),
        sa.Column(
            'created_by_id',
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey('users.id'),
            nullable=False
        ),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text('now()')
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            nullable=True,
            onupdate=sa.text('now()')
        )
    )

    # Add indexes
    op.create_index(
        'ix_secondary_insurance_patient_id',
        'secondary_insurance',
        ['patient_id']
    )
    op.create_index(
        'ix_secondary_insurance_territory_id',
        'secondary_insurance',
        ['territory_id']
    )
    op.create_index(
        'ix_secondary_insurance_created_by_id',
        'secondary_insurance',
        ['created_by_id']
    )


def downgrade():
    """Drop secondary_insurance table."""
    op.drop_index('ix_secondary_insurance_created_by_id')
    op.drop_index('ix_secondary_insurance_territory_id')
    op.drop_index('ix_secondary_insurance_patient_id')
    op.drop_table('secondary_insurance') 