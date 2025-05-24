"""Add updated_by_id column to patients table.

Revision ID: add_patient_updated_by_id
Revises: update_patient_encrypted_columns
Create Date: 2025-05-24 04:21:54.127515

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = 'add_patient_updated_by_id'
down_revision = 'update_patient_encrypted_columns'
branch_labels = None
depends_on = None


def upgrade():
    """Upgrade the database."""
    op.add_column(
        'patients',
        sa.Column(
            'updated_by_id',
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey('users.id'),
            nullable=True
        )
    )


def downgrade():
    """Downgrade the database."""
    op.drop_column('patients', 'updated_by_id') 