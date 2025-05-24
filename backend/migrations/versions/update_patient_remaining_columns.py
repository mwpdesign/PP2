"""Update remaining patient column lengths.

Revision ID: update_patient_remaining_columns
Revises: update_patient_insurance_columns
Create Date: 2025-05-24 04:24:45.783649

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'update_patient_remaining_columns'
down_revision = 'update_patient_insurance_columns'
branch_labels = None
depends_on = None


def upgrade():
    """Upgrade the database."""
    # Update remaining column lengths
    op.alter_column(
        'patients',
        'email',
        type_=sa.String(500),
        existing_type=sa.String(255),
        existing_nullable=True,
        existing_comment='ENCRYPTED'
    )
    op.alter_column(
        'patients',
        'phone',
        type_=sa.String(500),
        existing_type=sa.String(20),
        existing_nullable=False,
        existing_comment='ENCRYPTED'
    )
    op.alter_column(
        'patients',
        'address_line1',
        type_=sa.String(500),
        existing_type=sa.String(255),
        existing_nullable=False,
        existing_comment='ENCRYPTED'
    )
    op.alter_column(
        'patients',
        'address_line2',
        type_=sa.String(500),
        existing_type=sa.String(255),
        existing_nullable=True,
        existing_comment='ENCRYPTED'
    )
    op.alter_column(
        'patients',
        'city',
        type_=sa.String(500),
        existing_type=sa.String(100),
        existing_nullable=False,
        existing_comment='ENCRYPTED'
    )
    op.alter_column(
        'patients',
        'state',
        type_=sa.String(500),
        existing_type=sa.String(2),
        existing_nullable=False,
        existing_comment='ENCRYPTED'
    )
    op.alter_column(
        'patients',
        'zip_code',
        type_=sa.String(500),
        existing_type=sa.String(10),
        existing_nullable=False,
        existing_comment='ENCRYPTED'
    )


def downgrade():
    """Downgrade the database."""
    # Revert column lengths
    op.alter_column(
        'patients',
        'email',
        type_=sa.String(255),
        existing_type=sa.String(500),
        existing_nullable=True,
        existing_comment='ENCRYPTED'
    )
    op.alter_column(
        'patients',
        'phone',
        type_=sa.String(20),
        existing_type=sa.String(500),
        existing_nullable=False,
        existing_comment='ENCRYPTED'
    )
    op.alter_column(
        'patients',
        'address_line1',
        type_=sa.String(255),
        existing_type=sa.String(500),
        existing_nullable=False,
        existing_comment='ENCRYPTED'
    )
    op.alter_column(
        'patients',
        'address_line2',
        type_=sa.String(255),
        existing_type=sa.String(500),
        existing_nullable=True,
        existing_comment='ENCRYPTED'
    )
    op.alter_column(
        'patients',
        'city',
        type_=sa.String(100),
        existing_type=sa.String(500),
        existing_nullable=False,
        existing_comment='ENCRYPTED'
    )
    op.alter_column(
        'patients',
        'state',
        type_=sa.String(2),
        existing_type=sa.String(500),
        existing_nullable=False,
        existing_comment='ENCRYPTED'
    )
    op.alter_column(
        'patients',
        'zip_code',
        type_=sa.String(10),
        existing_type=sa.String(500),
        existing_nullable=False,
        existing_comment='ENCRYPTED'
    ) 