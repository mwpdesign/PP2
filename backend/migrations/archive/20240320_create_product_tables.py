"""Create product management tables.

Revision ID: 20240320_create_product_tables
Revises: None
Create Date: 2024-03-20 10:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB


# revision identifiers, used by Alembic
revision = "20240320_create_product_tables"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create product management tables."""
    # Create products table
    op.create_table(
        "products",
        sa.Column("id", UUID, primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("description", sa.Text),
        sa.Column("sku", sa.String(50), unique=True, nullable=False),
        sa.Column(
            "category_id", UUID, sa.ForeignKey("product_categories.id"), nullable=False
        ),
        sa.Column(
            "territory_id", UUID, sa.ForeignKey("territories.id"), nullable=False
        ),
        sa.Column("price", sa.Float, nullable=False),
        sa.Column("status", sa.String(20), nullable=False, default="active"),
        sa.Column("metadata", JSONB),
        sa.Column("created_at", sa.DateTime, nullable=False, default=sa.func.now()),
        sa.Column(
            "updated_at",
            sa.DateTime,
            nullable=False,
            default=sa.func.now(),
            onupdate=sa.func.now(),
        ),
    )

    # Create product_categories table
    op.create_table(
        "product_categories",
        sa.Column("id", UUID, primary_key=True),
        sa.Column("name", sa.String(50), nullable=False),
        sa.Column("description", sa.Text),
        sa.Column("parent_id", UUID, sa.ForeignKey("product_categories.id")),
        sa.Column(
            "territory_id", UUID, sa.ForeignKey("territories.id"), nullable=False
        ),
        sa.Column("status", sa.String(20), nullable=False, default="active"),
        sa.Column("metadata", JSONB),
        sa.Column("created_at", sa.DateTime, nullable=False, default=sa.func.now()),
        sa.Column(
            "updated_at",
            sa.DateTime,
            nullable=False,
            default=sa.func.now(),
            onupdate=sa.func.now(),
        ),
    )

    # Create product_inventory table
    op.create_table(
        "product_inventory",
        sa.Column("id", UUID, primary_key=True),
        sa.Column("product_id", UUID, sa.ForeignKey("products.id"), nullable=False),
        sa.Column(
            "territory_id", UUID, sa.ForeignKey("territories.id"), nullable=False
        ),
        sa.Column("quantity", sa.Integer, nullable=False, default=0),
        sa.Column("reorder_point", sa.Integer, nullable=False, default=10),
        sa.Column("metadata", JSONB),
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
    op.create_index("ix_products_sku", "products", ["sku"])
    op.create_index("ix_products_category", "products", ["category_id"])
    op.create_index("ix_products_territory", "products", ["territory_id"])
    op.create_index("ix_products_status", "products", ["status"])

    op.create_index("ix_product_categories_parent", "product_categories", ["parent_id"])
    op.create_index(
        "ix_product_categories_territory", "product_categories", ["territory_id"]
    )

    op.create_index("ix_product_inventory_product", "product_inventory", ["product_id"])
    op.create_index(
        "ix_product_inventory_territory", "product_inventory", ["territory_id"]
    )


def downgrade() -> None:
    """Remove product management tables."""
    # Drop indexes
    op.drop_index("ix_products_sku", table_name="products")
    op.drop_index("ix_products_category", table_name="products")
    op.drop_index("ix_products_territory", table_name="products")
    op.drop_index("ix_products_status", table_name="products")

    op.drop_index("ix_product_categories_parent", table_name="product_categories")
    op.drop_index("ix_product_categories_territory", table_name="product_categories")

    op.drop_index("ix_product_inventory_product", table_name="product_inventory")
    op.drop_index("ix_product_inventory_territory", table_name="product_inventory")

    # Drop tables
    op.drop_table("product_inventory")
    op.drop_table("products")
    op.drop_table("product_categories")
