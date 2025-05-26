"""rename_patient_document_created_by_column

Revision ID: 8a123873a4e8
Revises: merge_heads
Create Date: 2025-05-25 21:15:55.900652+00:00

"""
from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = '8a123873a4e8'
down_revision: Union[str, None] = 'merge_heads'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # No changes needed - the column is already named created_by_id
    pass


def downgrade() -> None:
    # No changes needed - the column is already named created_by_id
    pass