"""Update patient date_of_birth column name.

Revision ID: update_patient_dob_column
Revises: 2248d882fb10
Create Date: 2025-05-24 04:20:39.162458

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'update_patient_dob_column'
down_revision = '2248d882fb10'  # Points to the previous migration
branch_labels = None
depends_on = None


def upgrade():
    """Upgrade the database."""
    # Rename the column
    op.alter_column(
        'patients',
        'date_of_birth',
        new_column_name='_date_of_birth_encrypted',
        existing_type=sa.String(500),
        existing_nullable=True,
        existing_comment='ENCRYPTED'
    )


def downgrade():
    """Downgrade the database."""
    # Rename the column back
    op.alter_column(
        'patients',
        '_date_of_birth_encrypted',
        new_column_name='date_of_birth',
        existing_type=sa.String(500),
        existing_nullable=True,
        existing_comment='ENCRYPTED'
    ) 