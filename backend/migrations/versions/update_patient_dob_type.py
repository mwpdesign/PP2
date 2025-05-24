"""Update patient date_of_birth column type.

Revision ID: update_patient_dob_type
Revises: add_patient_updated_by_id
Create Date: 2025-05-24 04:23:20.580993

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'update_patient_dob_type'
down_revision = 'add_patient_updated_by_id'
branch_labels = None
depends_on = None


def upgrade():
    """Upgrade the database."""
    op.alter_column(
        'patients',
        '_date_of_birth_encrypted',
        type_=sa.String(500),
        existing_type=sa.Date(),
        existing_nullable=True,
        existing_comment='ENCRYPTED'
    )


def downgrade():
    """Downgrade the database."""
    op.alter_column(
        'patients',
        '_date_of_birth_encrypted',
        type_=sa.Date(),
        existing_type=sa.String(500),
        existing_nullable=True,
        existing_comment='ENCRYPTED'
    ) 