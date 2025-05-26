"""Merge heads.

Revision ID: merge_heads
Revises: create_secondary_insurance_table,
         update_patient_remaining_columns
Create Date: 2024-03-20 11:00:00.000000

"""

# revision identifiers, used by Alembic.
revision = 'merge_heads'
down_revision = (
    'create_secondary_insurance_table',
    'update_patient_remaining_columns'
)
branch_labels = None
depends_on = None


def upgrade():
    """Merge migration heads."""
    pass


def downgrade():
    """Downgrade both heads."""
    pass 