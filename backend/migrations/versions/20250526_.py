"""empty message

Revision ID: 46d9087f6904
Revises: 8a123873a4e8, merge_heads_fix
Create Date: 2025-05-26 01:09:06.606724+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '46d9087f6904'
down_revision: Union[str, None] = ('8a123873a4e8', 'merge_heads_fix')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass 