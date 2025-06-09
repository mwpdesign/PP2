"""Add multi-size product selection tables

Revision ID: ada6949b5e77
Revises: auto_pop_voice_2025
Create Date: 2025-06-09 00:57:45.578636+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'ada6949b5e77'
down_revision: Union[str, None] = 'auto_pop_voice_2025'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add IVR product tables for multi-size product selection."""

    # Create ivr_products table
    op.create_table(
        'ivr_products',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('ivr_request_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('ivr_requests.id'), nullable=False),
        sa.Column('product_name', sa.String(255), nullable=False),
        sa.Column('q_code', sa.String(50), nullable=False),
        sa.Column('total_quantity', sa.Integer, nullable=False, default=0),
        sa.Column('total_cost', sa.Numeric(10, 2), nullable=False, default=0.00),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True),
                  server_default=sa.text('now()'), nullable=False),
    )

    # Create ivr_product_sizes table
    op.create_table(
        'ivr_product_sizes',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('ivr_product_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('ivr_products.id'), nullable=False),
        sa.Column('size', sa.String(10), nullable=False),
        sa.Column('dimensions', sa.String(20), nullable=False),
        sa.Column('unit_price', sa.Numeric(10, 2), nullable=False),
        sa.Column('quantity', sa.Integer, nullable=False),
        sa.Column('total', sa.Numeric(10, 2), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True),
                  server_default=sa.text('now()'), nullable=False),
    )

    # Create indexes for better query performance
    op.create_index('ix_ivr_products_ivr_request_id', 'ivr_products', ['ivr_request_id'])
    op.create_index('ix_ivr_products_q_code', 'ivr_products', ['q_code'])
    op.create_index('ix_ivr_product_sizes_ivr_product_id', 'ivr_product_sizes', ['ivr_product_id'])
    op.create_index('ix_ivr_product_sizes_size', 'ivr_product_sizes', ['size'])


def downgrade() -> None:
    """Remove IVR product tables."""

    # Drop indexes
    op.drop_index('ix_ivr_product_sizes_size', 'ivr_product_sizes')
    op.drop_index('ix_ivr_product_sizes_ivr_product_id', 'ivr_product_sizes')
    op.drop_index('ix_ivr_products_q_code', 'ivr_products')
    op.drop_index('ix_ivr_products_ivr_request_id', 'ivr_products')

    # Drop tables
    op.drop_table('ivr_product_sizes')
    op.drop_table('ivr_products')