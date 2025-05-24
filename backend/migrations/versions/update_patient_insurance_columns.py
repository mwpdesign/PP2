"""Update patient insurance column lengths.

Revision ID: update_patient_insurance_columns
Revises: update_patient_column_lengths
Create Date: 2025-05-24 04:24:26.096267

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'update_patient_insurance_columns'
down_revision = 'update_patient_column_lengths'
branch_labels = None
depends_on = None


def upgrade():
    """Upgrade the database."""
    # Update insurance column lengths
    op.alter_column(
        'patients',
        'insurance_group',
        type_=sa.String(500),
        existing_type=sa.String(50),
        existing_nullable=True
    )
    op.alter_column(
        'patients',
        'insurance_phone',
        type_=sa.String(500),
        existing_type=sa.String(20),
        existing_nullable=True
    )
    op.alter_column(
        'patients',
        'primary_payer_phone',
        type_=sa.String(500),
        existing_type=sa.String(20),
        existing_nullable=True
    )


def downgrade():
    """Downgrade the database."""
    # Revert insurance column lengths
    op.alter_column(
        'patients',
        'insurance_group',
        type_=sa.String(50),
        existing_type=sa.String(500),
        existing_nullable=True
    )
    op.alter_column(
        'patients',
        'insurance_phone',
        type_=sa.String(20),
        existing_type=sa.String(500),
        existing_nullable=True
    )
    op.alter_column(
        'patients',
        'primary_payer_phone',
        type_=sa.String(20),
        existing_type=sa.String(500),
        existing_nullable=True
    ) 