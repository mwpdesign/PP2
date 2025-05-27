"""Migration for order status history."""
from datetime import datetime
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


# revision identifiers, used by Alembic
revision = '004_order_status_history'
down_revision = '20240321_create_order_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create order status history table."""
    op.create_table(
        'order_status_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column(
            'order_id',
            sa.Integer(),
            sa.ForeignKey('orders.id'),
            nullable=False
        ),
        sa.Column('previous_status', sa.String(50), nullable=False),
        sa.Column('new_status', sa.String(50), nullable=False),
        sa.Column(
            'changed_by',
            sa.Integer(),
            sa.ForeignKey('users.id'),
            nullable=False
        ),
        sa.Column(
            'territory_id',
            sa.Integer(),
            sa.ForeignKey('territories.id'),
            nullable=False
        ),
        sa.Column('reason', sa.String(255)),
        sa.Column('metadata', JSONB),
        sa.Column(
            'created_at',
            sa.DateTime(),
            nullable=False,
            default=datetime.utcnow
        ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes for efficient querying
    op.create_index(
        'ix_order_status_history_order',
        'order_status_history',
        ['order_id']
    )
    op.create_index(
        'ix_order_status_history_territory',
        'order_status_history',
        ['territory_id']
    )
    op.create_index(
        'ix_order_status_history_status',
        'order_status_history',
        ['previous_status', 'new_status']
    )
    op.create_index(
        'ix_order_status_history_created',
        'order_status_history',
        ['created_at']
    )


def downgrade() -> None:
    """Remove order status history table."""
    # Drop indexes
    op.drop_index('ix_order_status_history_order', 'order_status_history')
    op.drop_index('ix_order_status_history_territory', 'order_status_history')
    op.drop_index('ix_order_status_history_status', 'order_status_history')
    op.drop_index('ix_order_status_history_created', 'order_status_history')

    # Drop table
    op.drop_table('order_status_history')