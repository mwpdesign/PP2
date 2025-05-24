"""Update patient encrypted column names.

Revision ID: update_patient_encrypted_columns
Revises: update_patient_dob_column
Create Date: 2025-05-24 04:21:20.519536

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'update_patient_encrypted_columns'
down_revision = 'update_patient_dob_column'
branch_labels = None
depends_on = None


def upgrade():
    """Upgrade the database."""
    # Rename all encrypted columns
    op.alter_column(
        'patients',
        'ssn',
        new_column_name='_ssn',
        existing_type=sa.String(500),
        existing_nullable=True,
        existing_comment='ENCRYPTED'
    )
    op.alter_column(
        'patients',
        'insurance_provider',
        new_column_name='_insurance_provider',
        existing_type=sa.String(500),
        existing_nullable=True,
        existing_comment='ENCRYPTED'
    )
    op.alter_column(
        'patients',
        'insurance_id',
        new_column_name='_insurance_id',
        existing_type=sa.String(500),
        existing_nullable=True,
        existing_comment='ENCRYPTED'
    )
    op.alter_column(
        'patients',
        'medical_history',
        new_column_name='_medical_history',
        existing_type=sa.String(2000),
        existing_nullable=True,
        existing_comment='ENCRYPTED'
    )
    op.alter_column(
        'patients',
        'allergies',
        new_column_name='_allergies',
        existing_type=sa.String(1000),
        existing_nullable=True,
        existing_comment='ENCRYPTED'
    )
    op.alter_column(
        'patients',
        'medications',
        new_column_name='_medications',
        existing_type=sa.String(1000),
        existing_nullable=True,
        existing_comment='ENCRYPTED'
    )


def downgrade():
    """Downgrade the database."""
    # Rename columns back
    op.alter_column(
        'patients',
        '_ssn',
        new_column_name='ssn',
        existing_type=sa.String(500),
        existing_nullable=True,
        existing_comment='ENCRYPTED'
    )
    op.alter_column(
        'patients',
        '_insurance_provider',
        new_column_name='insurance_provider',
        existing_type=sa.String(500),
        existing_nullable=True,
        existing_comment='ENCRYPTED'
    )
    op.alter_column(
        'patients',
        '_insurance_id',
        new_column_name='insurance_id',
        existing_type=sa.String(500),
        existing_nullable=True,
        existing_comment='ENCRYPTED'
    )
    op.alter_column(
        'patients',
        '_medical_history',
        new_column_name='medical_history',
        existing_type=sa.String(2000),
        existing_nullable=True,
        existing_comment='ENCRYPTED'
    )
    op.alter_column(
        'patients',
        '_allergies',
        new_column_name='allergies',
        existing_type=sa.String(1000),
        existing_nullable=True,
        existing_comment='ENCRYPTED'
    )
    op.alter_column(
        'patients',
        '_medications',
        new_column_name='medications',
        existing_type=sa.String(1000),
        existing_nullable=True,
        existing_comment='ENCRYPTED'
    ) 