"""Create order tables with status tracking and audit support.

Revision ID: 20240320_004_create_order_tables
Revises: 20240320_003_create_patient_tables
Create Date: 2024-03-20 13:00:00.000000
"""
from datetime import datetime
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid


# revision identifiers, used by Alembic
revision = '20240320_004_create_order_tables'
down_revision = '20240320_003_create_patient_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create order-related tables with audit support."""
    # Create orders table
    op.create_table(
        'orders',
        sa.Column(
            'id',
            UUID(as_uuid=True),
            primary_key=True,
            default=uuid.uuid4
        ),
        sa.Column(
            'organization_id',
            UUID(as_uuid=True),
            sa.ForeignKey('organizations.id'),
            nullable=False
        ),
        sa.Column(
            'territory_id',
            UUID(as_uuid=True),
            sa.ForeignKey('territories.id'),
            nullable=False
        ),
        sa.Column(
            'patient_id',
            UUID(as_uuid=True),
            sa.ForeignKey('patients.id'),
            nullable=False
        ),
        sa.Column(
            'created_by',
            UUID(as_uuid=True),
            sa.ForeignKey('users.id'),
            nullable=False
        ),
        sa.Column(
            'updated_by',
            UUID(as_uuid=True),
            sa.ForeignKey('users.id')
        ),
        sa.Column('order_number', sa.String(50), nullable=False),
        sa.Column('order_date', sa.Date(), nullable=False),
        sa.Column(
            'status',
            sa.String(20),
            nullable=False,
            default='pending'
        ),
        sa.Column('delivery_date', sa.Date()),
        sa.Column('delivery_notes', sa.Text),
        sa.Column(
            'requires_insurance_approval',
            sa.Boolean(),
            nullable=False,
            default=False
        ),
        sa.Column(
            'requires_prescription',
            sa.Boolean(),
            nullable=False,
            default=False
        ),
        sa.Column(
            'insurance_status',
            sa.String(20),
            default='pending'
        ),
        sa.Column('insurance_notes', sa.Text),
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
            'order_number',
            'organization_id',
            name='uq_order_number_org'
        )
    )

    # Create order_items table
    op.create_table(
        'order_items',
        sa.Column(
            'id',
            UUID(as_uuid=True),
            primary_key=True,
            default=uuid.uuid4
        ),
        sa.Column(
            'order_id',
            UUID(as_uuid=True),
            sa.ForeignKey('orders.id'),
            nullable=False
        ),
        sa.Column(
            'product_id',
            UUID(as_uuid=True),
            sa.ForeignKey('products.id'),
            nullable=False
        ),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('unit_price', sa.Numeric(10, 2), nullable=False),
        sa.Column('rental_duration_days', sa.Integer()),
        sa.Column('rental_start_date', sa.Date()),
        sa.Column('rental_end_date', sa.Date()),
        sa.Column(
            'status',
            sa.String(20),
            nullable=False,
            default='pending'
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
        sa.PrimaryKeyConstraint('id')
    )

    # Create order_status_history table
    op.create_table(
        'order_status_history',
        sa.Column(
            'id',
            UUID(as_uuid=True),
            primary_key=True,
            default=uuid.uuid4
        ),
        sa.Column(
            'order_id',
            UUID(as_uuid=True),
            sa.ForeignKey('orders.id'),
            nullable=False
        ),
        sa.Column(
            'changed_by',
            UUID(as_uuid=True),
            sa.ForeignKey('users.id'),
            nullable=False
        ),
        sa.Column(
            'previous_status',
            sa.String(20),
            nullable=False
        ),
        sa.Column(
            'new_status',
            sa.String(20),
            nullable=False
        ),
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
        sa.PrimaryKeyConstraint('id')
    )

    # Create order_documents table
    op.create_table(
        'order_documents',
        sa.Column(
            'id',
            UUID(as_uuid=True),
            primary_key=True,
            default=uuid.uuid4
        ),
        sa.Column(
            'order_id',
            UUID(as_uuid=True),
            sa.ForeignKey('orders.id'),
            nullable=False
        ),
        sa.Column('document_type', sa.String(50), nullable=False),
        sa.Column('file_name', sa.String(255), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('mime_type', sa.String(100), nullable=False),
        sa.Column('s3_key', sa.String(500), nullable=False),
        sa.Column('encryption_key_id', sa.String(255), nullable=False),
        sa.Column(
            'encryption_context',
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
            'uploaded_by',
            UUID(as_uuid=True),
            sa.ForeignKey('users.id'),
            nullable=False
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
    op.create_index('ix_orders_org', 'orders', ['organization_id'])
    op.create_index('ix_orders_territory', 'orders', ['territory_id'])
    op.create_index('ix_orders_patient', 'orders', ['patient_id'])
    op.create_index('ix_orders_created_by', 'orders', ['created_by'])
    op.create_index('ix_orders_updated_by', 'orders', ['updated_by'])
    op.create_index('ix_orders_status', 'orders', ['status'])
    op.create_index('ix_orders_number', 'orders', ['order_number'])
    op.create_index('ix_orders_date', 'orders', ['order_date'])

    op.create_index('ix_order_items_order', 'order_items', ['order_id'])
    op.create_index('ix_order_items_product', 'order_items', ['product_id'])
    op.create_index('ix_order_items_status', 'order_items', ['status'])

    op.create_index(
        'ix_order_status_history_order',
        'order_status_history',
        ['order_id']
    )
    op.create_index(
        'ix_order_status_history_user',
        'order_status_history',
        ['changed_by']
    )

    op.create_index(
        'ix_order_documents_order',
        'order_documents',
        ['order_id']
    )
    op.create_index(
        'ix_order_documents_type',
        'order_documents',
        ['document_type']
    )
    op.create_index(
        'ix_order_documents_uploaded',
        'order_documents',
        ['uploaded_by']
    )

    # Create RLS policies
    op.execute("""
        ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

        CREATE POLICY order_access_policy ON orders
            FOR ALL
            USING (
                organization_id = current_setting('app.current_org_id')::uuid
                AND territory_id = ANY(
                    current_setting('app.user_territories')::uuid[]
                )
            );
    """)

    op.execute("""
        ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

        CREATE POLICY order_items_access_policy ON order_items
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM orders o
                    WHERE o.id = order_id
                    AND o.organization_id =
                        current_setting('app.current_org_id')::uuid
                    AND o.territory_id = ANY(
                        current_setting('app.user_territories')::uuid[]
                    )
                )
            );
    """)

    op.execute("""
        ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

        CREATE POLICY status_history_access_policy ON order_status_history
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM orders o
                    WHERE o.id = order_id
                    AND o.organization_id =
                        current_setting('app.current_org_id')::uuid
                    AND o.territory_id = ANY(
                        current_setting('app.user_territories')::uuid[]
                    )
                )
            );
    """)

    op.execute("""
        ALTER TABLE order_documents ENABLE ROW LEVEL SECURITY;

        CREATE POLICY order_documents_access_policy ON order_documents
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM orders o
                    WHERE o.id = order_id
                    AND o.organization_id =
                        current_setting('app.current_org_id')::uuid
                    AND o.territory_id = ANY(
                        current_setting('app.user_territories')::uuid[]
                    )
                )
            );
    """)


def downgrade() -> None:
    """Remove order-related tables."""
    # Drop RLS policies
    op.execute("""
        DROP POLICY IF EXISTS order_access_policy ON orders;
        DROP POLICY IF EXISTS order_items_access_policy ON order_items;
        DROP POLICY IF EXISTS status_history_access_policy
            ON order_status_history;
        DROP POLICY IF EXISTS order_documents_access_policy
            ON order_documents;
    """)

    # Drop indexes
    op.drop_index('ix_orders_org', 'orders')
    op.drop_index('ix_orders_territory', 'orders')
    op.drop_index('ix_orders_patient', 'orders')
    op.drop_index('ix_orders_created_by', 'orders')
    op.drop_index('ix_orders_updated_by', 'orders')
    op.drop_index('ix_orders_status', 'orders')
    op.drop_index('ix_orders_number', 'orders')
    op.drop_index('ix_orders_date', 'orders')

    op.drop_index('ix_order_items_order', 'order_items')
    op.drop_index('ix_order_items_product', 'order_items')
    op.drop_index('ix_order_items_status', 'order_items')

    op.drop_index('ix_order_status_history_order', 'order_status_history')
    op.drop_index('ix_order_status_history_user', 'order_status_history')

    op.drop_index('ix_order_documents_order', 'order_documents')
    op.drop_index('ix_order_documents_type', 'order_documents')
    op.drop_index('ix_order_documents_uploaded', 'order_documents')

    # Drop tables in correct order
    op.drop_table('order_documents')
    op.drop_table('order_status_history')
    op.drop_table('order_items')
    op.drop_table('orders')
