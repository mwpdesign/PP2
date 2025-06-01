"""Create order management tables.

Revision ID: 20240321_create_order_tables
Revises: 20240320_create_product_tables
Create Date: 2024-03-21 10:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB


# revision identifiers, used by Alembic
revision = "20240321_create_order_tables"
down_revision = "20240320_create_product_tables"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create order management tables."""
    # Create orders table
    op.create_table(
        "orders",
        sa.Column("id", UUID, primary_key=True),
        sa.Column("order_number", sa.String(50), unique=True, nullable=False),
        sa.Column("patient_id", UUID, sa.ForeignKey("patients.id"), nullable=False),
        sa.Column("provider_id", UUID, sa.ForeignKey("providers.id"), nullable=False),
        sa.Column(
            "territory_id", UUID, sa.ForeignKey("territories.id"), nullable=False
        ),
        sa.Column("ivr_session_id", UUID, sa.ForeignKey("ivr_sessions.id")),
        sa.Column("status", sa.String(20), nullable=False, default="pending"),
        sa.Column("order_date", sa.DateTime, nullable=False, default=sa.func.now()),
        sa.Column("completion_date", sa.DateTime),
        sa.Column("_total_amount", sa.String(255), nullable=False),
        sa.Column("notes", sa.Text),
        sa.Column("insurance_data", JSONB),
        sa.Column("payment_info", JSONB),
        sa.Column("delivery_info", JSONB),
        sa.Column("created_at", sa.DateTime, nullable=False, default=sa.func.now()),
        sa.Column(
            "updated_at",
            sa.DateTime,
            nullable=False,
            default=sa.func.now(),
            onupdate=sa.func.now(),
        ),
    )

    # Create order_items table
    op.create_table(
        "order_items",
        sa.Column("id", UUID, primary_key=True),
        sa.Column("order_id", UUID, sa.ForeignKey("orders.id"), nullable=False),
        sa.Column("product_id", UUID, sa.ForeignKey("products.id"), nullable=False),
        sa.Column("quantity", sa.Integer, nullable=False),
        sa.Column("unit_price", sa.Float, nullable=False),
        sa.Column("total_price", sa.Float, nullable=False),
        sa.Column("status", sa.String(20), nullable=False, default="pending"),
        sa.Column("notes", sa.Text),
        sa.Column("insurance_coverage", JSONB),
        sa.Column("created_at", sa.DateTime, nullable=False, default=sa.func.now()),
        sa.Column(
            "updated_at",
            sa.DateTime,
            nullable=False,
            default=sa.func.now(),
            onupdate=sa.func.now(),
        ),
    )

    # Create order_status_history table
    op.create_table(
        "order_status_history",
        sa.Column("id", UUID, primary_key=True),
        sa.Column("order_id", UUID, sa.ForeignKey("orders.id"), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("changed_by", UUID, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("reason", sa.Text),
        sa.Column("metadata", JSONB),
        sa.Column("timestamp", sa.DateTime, nullable=False, default=sa.func.now()),
        sa.Column("created_at", sa.DateTime, nullable=False, default=sa.func.now()),
        sa.Column(
            "updated_at",
            sa.DateTime,
            nullable=False,
            default=sa.func.now(),
            onupdate=sa.func.now(),
        ),
    )

    # Create order_approvals table
    op.create_table(
        "order_approvals",
        sa.Column("id", UUID, primary_key=True),
        sa.Column("order_id", UUID, sa.ForeignKey("orders.id"), nullable=False),
        sa.Column("approver_id", UUID, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("approval_type", sa.String(20), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, default="pending"),
        sa.Column("notes", sa.Text),
        sa.Column("metadata", JSONB),
        sa.Column("timestamp", sa.DateTime, nullable=False, default=sa.func.now()),
        sa.Column("created_at", sa.DateTime, nullable=False, default=sa.func.now()),
        sa.Column(
            "updated_at",
            sa.DateTime,
            nullable=False,
            default=sa.func.now(),
            onupdate=sa.func.now(),
        ),
    )

    # Create indexes
    op.create_index("ix_orders_order_number", "orders", ["order_number"])
    op.create_index("ix_orders_patient_id", "orders", ["patient_id"])
    op.create_index("ix_orders_provider_id", "orders", ["provider_id"])
    op.create_index("ix_orders_territory_id", "orders", ["territory_id"])
    op.create_index("ix_orders_status", "orders", ["status"])
    op.create_index("ix_orders_order_date", "orders", ["order_date"])

    op.create_index("ix_order_items_order_id", "order_items", ["order_id"])
    op.create_index("ix_order_items_product_id", "order_items", ["product_id"])
    op.create_index("ix_order_items_status", "order_items", ["status"])

    op.create_index(
        "ix_order_status_history_order_id", "order_status_history", ["order_id"]
    )
    op.create_index(
        "ix_order_status_history_status", "order_status_history", ["status"]
    )
    op.create_index(
        "ix_order_status_history_changed_by", "order_status_history", ["changed_by"]
    )
    op.create_index(
        "ix_order_status_history_timestamp", "order_status_history", ["timestamp"]
    )

    op.create_index("ix_order_approvals_order_id", "order_approvals", ["order_id"])
    op.create_index(
        "ix_order_approvals_approver_id", "order_approvals", ["approver_id"]
    )
    op.create_index(
        "ix_order_approvals_approval_type", "order_approvals", ["approval_type"]
    )
    op.create_index("ix_order_approvals_status", "order_approvals", ["status"])
    op.create_index("ix_order_approvals_timestamp", "order_approvals", ["timestamp"])


def downgrade() -> None:
    """Drop order management tables."""
    # Drop indexes first
    op.drop_index("ix_orders_order_number", "orders")
    op.drop_index("ix_orders_patient_id", "orders")
    op.drop_index("ix_orders_provider_id", "orders")
    op.drop_index("ix_orders_territory_id", "orders")
    op.drop_index("ix_orders_status", "orders")
    op.drop_index("ix_orders_order_date", "orders")

    op.drop_index("ix_order_items_order_id", "order_items")
    op.drop_index("ix_order_items_product_id", "order_items")
    op.drop_index("ix_order_items_status", "order_items")

    op.drop_index("ix_order_status_history_order_id", "order_status_history")
    op.drop_index("ix_order_status_history_status", "order_status_history")
    op.drop_index("ix_order_status_history_changed_by", "order_status_history")
    op.drop_index("ix_order_status_history_timestamp", "order_status_history")

    op.drop_index("ix_order_approvals_order_id", "order_approvals")
    op.drop_index("ix_order_approvals_approver_id", "order_approvals")
    op.drop_index("ix_order_approvals_approval_type", "order_approvals")
    op.drop_index("ix_order_approvals_status", "order_approvals")
    op.drop_index("ix_order_approvals_timestamp", "order_approvals")

    # Drop tables in reverse order
    op.drop_table("order_approvals")
    op.drop_table("order_status_history")
    op.drop_table("order_items")
    op.drop_table("orders")
