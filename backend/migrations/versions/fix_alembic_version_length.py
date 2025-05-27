"""Fix alembic_version table column length.

Revision ID: fix_alembic_version_length
Revises: None
Create Date: 2025-05-27 11:30:00.000000
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic
revision = 'fix_alembic_version_length'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Fix alembic_version table column length."""
    # Drop existing alembic_version table if it exists
    op.execute('DROP TABLE IF EXISTS alembic_version')

    # Create new alembic_version table with correct column length
    op.create_table(
        'alembic_version',
        sa.Column('version_num', sa.String(255), nullable=False),
        sa.PrimaryKeyConstraint('version_num')
    )


def downgrade() -> None:
    """Revert alembic_version table changes."""
    # Drop existing alembic_version table
    op.execute('DROP TABLE IF EXISTS alembic_version')


    # Create original alembic_version table
    op.create_table(
        'alembic_version',
        sa.Column('version_num', sa.String(32), nullable=False),
        sa.PrimaryKeyConstraint('version_num')
    )