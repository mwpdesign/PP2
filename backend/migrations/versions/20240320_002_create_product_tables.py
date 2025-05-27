"""Create product tables for catalog and inventory management.

Revision ID: 20240320_002_create_product_tables
Revises: 20240320_001_6_create_provider_credentials
Create Date: 2024-03-20 11:00:00.000000
"""
from datetime import datetime
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid


# revision identifiers, used by Alembic
revision = '20240320_002_create_product_tables'
down_revision = '20240320_001_6_create_provider_credentials'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create product and inventory tables."""
    # Create product categories table
    op.create_table(
        'product_categories',
        sa.Column(
            'id',
            UUID(as_uuid=True),
            primary_key=True,
            default=uuid.uuid4
        ),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.String(500)),
        sa.Column(
            'parent_category_id',
            UUID(as_uuid=True),
            sa.ForeignKey('product_categories.id')
        ),
        sa.Column(
            'organization_id',
            UUID(as_uuid=True),
            sa.ForeignKey('organizations.id'),
            nullable=False
        ),
        sa.Column(
            'metadata',
            JSONB,
            nullable=False,
            server_default='{}'
        ),
        sa.Column(
            'created_at',
            sa.DateTime(),
            nullable=False,
            default=datetime.utcnow
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(),
            onupdate=datetime.utcnow
        ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint(
            'name',
            'organization_id',
            name='uq_category_name_org'
        )
    )

    # Create products table
    op.create_table(
        'products',
        sa.Column(
            'id',
            UUID(as_uuid=True),
            primary_key=True,
            default=uuid.uuid4
        ),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text),
        sa.Column('sku', sa.String(50), nullable=False),
        sa.Column('hcpcs_code', sa.String(20)),
        sa.Column('ndc_code', sa.String(20)),
        sa.Column('manufacturer', sa.String(100)),
        sa.Column('model_number', sa.String(50)),
        sa.Column('unit_price', sa.Numeric(10, 2), nullable=False),
        sa.Column(
            'category_id',
            UUID(as_uuid=True),
            sa.ForeignKey('product_categories.id'),
            nullable=False
        ),
        sa.Column(
            'organization_id',
            UUID(as_uuid=True),
            sa.ForeignKey('organizations.id'),
            nullable=False
        ),
        sa.Column(
            'requires_prescription',
            sa.Boolean(),
            nullable=False,
            default=False
        ),
        sa.Column(
            'requires_insurance',
            sa.Boolean(),
            nullable=False,
            default=False
        ),
        sa.Column(
            'is_rental',
            sa.Boolean(),
            nullable=False,
            default=False
        ),
        sa.Column(
            'rental_duration_days',
            sa.Integer()
        ),
        sa.Column(
            'specifications',
            JSONB,
            nullable=False,
            server_default='{}'
        ),
        sa.Column(
            'metadata',
            JSONB,
            nullable=False,
            server_default='{}'
        ),
        sa.Column(
            'is_active',
            sa.Boolean(),
            nullable=False,
            default=True
        ),
        sa.Column(
            'created_at',
            sa.DateTime(),
            nullable=False,
            default=datetime.utcnow
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(),
            onupdate=datetime.utcnow
        ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint(
            'sku',
            'organization_id',
            name='uq_product_sku_org'
        )
    )

    # Create inventory table
    op.create_table(
        'inventory',
        sa.Column(
            'id',
            UUID(as_uuid=True),
            primary_key=True,
            default=uuid.uuid4
        ),
        sa.Column(
            'product_id',
            UUID(as_uuid=True),
            sa.ForeignKey('products.id'),
            nullable=False
        ),
        sa.Column(
            'territory_id',
            UUID(as_uuid=True),
            sa.ForeignKey('territories.id'),
            nullable=False
        ),
        sa.Column(
            'organization_id',
            UUID(as_uuid=True),
            sa.ForeignKey('organizations.id'),
            nullable=False
        ),
        sa.Column(
            'quantity_available',
            sa.Integer(),
            nullable=False,
            default=0
        ),
        sa.Column(
            'quantity_reserved',
            sa.Integer(),
            nullable=False,
            default=0
        ),
        sa.Column(
            'reorder_point',
            sa.Integer(),
            nullable=False,
            default=0
        ),
        sa.Column(
            'reorder_quantity',
            sa.Integer(),
            nullable=False,
            default=0
        ),
        sa.Column(
            'metadata',
            JSONB,
            nullable=False,
            server_default='{}'
        ),
        sa.Column(
            'created_at',
            sa.DateTime(),
            nullable=False,
            default=datetime.utcnow
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(),
            onupdate=datetime.utcnow
        ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint(
            'product_id',
            'territory_id',
            name='uq_inventory_product_territory'
        )
    )

    # Create inventory_transactions table
    op.create_table(
        'inventory_transactions',
        sa.Column(
            'id',
            UUID(as_uuid=True),
            primary_key=True,
            default=uuid.uuid4
        ),
        sa.Column(
            'inventory_id',
            UUID(as_uuid=True),
            sa.ForeignKey('inventory.id'),
            nullable=False
        ),
        sa.Column(
            'user_id',
            UUID(as_uuid=True),
            sa.ForeignKey('users.id'),
            nullable=False
        ),
        sa.Column(
            'organization_id',
            UUID(as_uuid=True),
            sa.ForeignKey('organizations.id'),
            nullable=False
        ),
        sa.Column(
            'transaction_type',
            sa.String(20),
            nullable=False
        ),
        sa.Column(
            'quantity',
            sa.Integer(),
            nullable=False
        ),
        sa.Column('reference_id', UUID(as_uuid=True)),
        sa.Column('reference_type', sa.String(50)),
        sa.Column('notes', sa.Text),
        sa.Column(
            'metadata',
            JSONB,
            nullable=False,
            server_default='{}'
        ),
        sa.Column(
            'created_at',
            sa.DateTime(),
            nullable=False,
            default=datetime.utcnow
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(),
            onupdate=datetime.utcnow
        ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes
    op.create_index(
        'ix_products_category',
        'products',
        ['category_id']
    )
    op.create_index(
        'ix_products_org',
        'products',
        ['organization_id']
    )
    op.create_index(
        'ix_products_sku',
        'products',
        ['sku']
    )
    op.create_index(
        'ix_products_hcpcs',
        'products',
        ['hcpcs_code']
    )
    op.create_index(
        'ix_products_ndc',
        'products',
        ['ndc_code']
    )

    op.create_index(
        'ix_inventory_product',
        'inventory',
        ['product_id']
    )
    op.create_index(
        'ix_inventory_territory',
        'inventory',
        ['territory_id']
    )
    op.create_index(
        'ix_inventory_org',
        'inventory',
        ['organization_id']
    )

    op.create_index(
        'ix_inventory_txn_inventory',
        'inventory_transactions',
        ['inventory_id']
    )
    op.create_index(
        'ix_inventory_txn_user',
        'inventory_transactions',
        ['user_id']
    )
    op.create_index(
        'ix_inventory_txn_org',
        'inventory_transactions',
        ['organization_id']
    )
    op.create_index(
        'ix_inventory_txn_ref',
        'inventory_transactions',
        ['reference_id']
    )

    # Create RLS policies
    op.execute("""
        ALTER TABLE products ENABLE ROW LEVEL SECURITY;

        CREATE POLICY product_access_policy ON products
            FOR ALL
            USING (
                organization_id = current_setting('app.current_org_id')::uuid
            );
    """)

    op.execute("""
        ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

        CREATE POLICY inventory_access_policy ON inventory
            FOR ALL
            USING (
                organization_id = current_setting('app.current_org_id')::uuid
                AND territory_id = ANY(
                    current_setting('app.user_territories')::uuid[]
                )
            );
    """)

    op.execute("""
        ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

        CREATE POLICY inventory_txn_access_policy ON inventory_transactions
            FOR ALL
            USING (
                organization_id = current_setting('app.current_org_id')::uuid
                AND EXISTS (
                    SELECT 1 FROM inventory i
                    WHERE i.id = inventory_id
                    AND i.territory_id = ANY(
                        current_setting('app.user_territories')::uuid[]
                    )
                )
            );
    """)


def downgrade() -> None:
    """Remove product and inventory tables."""
    # Drop RLS policies
    op.execute("""
        DROP POLICY IF EXISTS product_access_policy ON products;
        DROP POLICY IF EXISTS inventory_access_policy ON inventory;
        DROP POLICY IF EXISTS inventory_txn_access_policy ON \
            inventory_transactions;
    """)

    # Drop indexes
    op.drop_index('ix_products_category', 'products')
    op.drop_index('ix_products_org', 'products')
    op.drop_index('ix_products_sku', 'products')
    op.drop_index('ix_products_hcpcs', 'products')
    op.drop_index('ix_products_ndc', 'products')

    op.drop_index('ix_inventory_product', 'inventory')
    op.drop_index('ix_inventory_territory', 'inventory')
    op.drop_index('ix_inventory_org', 'inventory')

    op.drop_index('ix_inventory_txn_inventory', 'inventory_transactions')
    op.drop_index('ix_inventory_txn_user', 'inventory_transactions')
    op.drop_index('ix_inventory_txn_org', 'inventory_transactions')
    op.drop_index('ix_inventory_txn_ref', 'inventory_transactions')

    # Drop tables in correct order
    op.drop_table('inventory_transactions')
    op.drop_table('inventory')
    op.drop_table('products')
    op.drop_table('product_categories')
