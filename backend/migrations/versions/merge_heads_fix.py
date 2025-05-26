"""Merge multiple heads.

Revision ID: merge_heads_fix
Revises: fix_alembic_version_length, 20240320_001_create_core_tables
Create Date: 2024-03-21 10:30:00.000000
"""

# revision identifiers, used by Alembic
revision = 'merge_heads_fix'
down_revision = (
    'fix_alembic_version_length',
    '20240320_001_create_core_tables'
)
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Merge heads - no changes needed."""
    pass


def downgrade() -> None:
    """Downgrade merge - no changes needed."""
    pass 