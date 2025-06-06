"""add_missing_patient_document_columns

Revision ID: 923ab08accad
Revises: 40606d3453b9
Create Date: 2025-06-05 23:59:42.913077+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '923ab08accad'
down_revision: Union[str, None] = '40606d3453b9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add missing columns to patient_documents table
    op.add_column(
        'patient_documents',
        sa.Column('display_name', sa.String(255), nullable=True)
    )
    op.add_column(
        'patient_documents',
        sa.Column('s3_key', sa.Text(), nullable=True)
    )
    op.add_column(
        'patient_documents',
        sa.Column('file_size', sa.Integer(), nullable=True)
    )
    op.add_column(
        'patient_documents',
        sa.Column('content_type', sa.String(100), nullable=True)
    )


def downgrade() -> None:
    # Remove the added columns
    op.drop_column('patient_documents', 'content_type')
    op.drop_column('patient_documents', 'file_size')
    op.drop_column('patient_documents', 's3_key')
    op.drop_column('patient_documents', 'display_name')