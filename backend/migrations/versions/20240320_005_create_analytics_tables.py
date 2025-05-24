"""Create analytics tables for business intelligence.

Revision ID: 20240320_005_create_analytics_tables
Revises: 20240320_004_create_order_tables
Create Date: 2024-03-20 14:00:00.000000
"""
from datetime import datetime
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid


# revision identifiers, used by Alembic
revision = '20240320_005_create_analytics_tables'
down_revision = '20240320_004_create_order_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create analytics tables for reporting."""
    # Create analytics_dimensions table
    op.create_table(
        'analytics_dimensions',
        sa.Column(
            'id',
            UUID(as_uuid=True),
            primary_key=True,
            default=uuid.uuid4
        ),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.String(500)),
        sa.Column('dimension_type', sa.String(50), nullable=False),
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
            name='uq_dimension_name_org'
        )
    )

    # Create analytics_metrics table
    op.create_table(
        'analytics_metrics',
        sa.Column(
            'id',
            UUID(as_uuid=True),
            primary_key=True,
            default=uuid.uuid4
        ),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.String(500)),
        sa.Column('metric_type', sa.String(50), nullable=False),
        sa.Column(
            'organization_id',
            UUID(as_uuid=True),
            sa.ForeignKey('organizations.id'),
            nullable=False
        ),
        sa.Column(
            'aggregation_type',
            sa.String(20),
            nullable=False,
            default='sum'
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
            name='uq_metric_name_org'
        )
    )

    # Create analytics_facts table
    op.create_table(
        'analytics_facts',
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
            'metric_id',
            UUID(as_uuid=True),
            sa.ForeignKey('analytics_metrics.id'),
            nullable=False
        ),
        sa.Column('fact_date', sa.Date(), nullable=False),
        sa.Column('value', sa.Numeric(20, 4), nullable=False),
        sa.Column(
            'dimensions',
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

    # Create analytics_reports table
    op.create_table(
        'analytics_reports',
        sa.Column(
            'id',
            UUID(as_uuid=True),
            primary_key=True,
            default=uuid.uuid4
        ),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.String(500)),
        sa.Column(
            'organization_id',
            UUID(as_uuid=True),
            sa.ForeignKey('organizations.id'),
            nullable=False
        ),
        sa.Column(
            'created_by',
            UUID(as_uuid=True),
            sa.ForeignKey('users.id'),
            nullable=False
        ),
        sa.Column(
            'report_config',
            JSONB,
            nullable=False,
            server_default='{}'
        ),
        sa.Column(
            'schedule_config',
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
            name='uq_report_name_org'
        )
    )

    # Create indexes
    op.create_index(
        'ix_analytics_dimensions_org',
        'analytics_dimensions',
        ['organization_id']
    )
    op.create_index(
        'ix_analytics_dimensions_type',
        'analytics_dimensions',
        ['dimension_type']
    )

    op.create_index(
        'ix_analytics_metrics_org',
        'analytics_metrics',
        ['organization_id']
    )
    op.create_index(
        'ix_analytics_metrics_type',
        'analytics_metrics',
        ['metric_type']
    )

    op.create_index(
        'ix_analytics_facts_org',
        'analytics_facts',
        ['organization_id']
    )
    op.create_index(
        'ix_analytics_facts_territory',
        'analytics_facts',
        ['territory_id']
    )
    op.create_index(
        'ix_analytics_facts_metric',
        'analytics_facts',
        ['metric_id']
    )
    op.create_index(
        'ix_analytics_facts_date',
        'analytics_facts',
        ['fact_date']
    )

    op.create_index(
        'ix_analytics_reports_org',
        'analytics_reports',
        ['organization_id']
    )
    op.create_index(
        'ix_analytics_reports_created',
        'analytics_reports',
        ['created_by']
    )

    # Create RLS policies
    op.execute("""
        ALTER TABLE analytics_dimensions ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY dimension_access_policy ON analytics_dimensions
            FOR ALL
            USING (
                organization_id = current_setting('app.current_org_id')::uuid
            );
    """)

    op.execute("""
        ALTER TABLE analytics_metrics ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY metric_access_policy ON analytics_metrics
            FOR ALL
            USING (
                organization_id = current_setting('app.current_org_id')::uuid
            );
    """)

    op.execute("""
        ALTER TABLE analytics_facts ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY fact_access_policy ON analytics_facts
            FOR ALL
            USING (
                organization_id = current_setting('app.current_org_id')::uuid
                AND territory_id = ANY(
                    current_setting('app.user_territories')::uuid[]
                )
            );
    """)

    op.execute("""
        ALTER TABLE analytics_reports ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY report_access_policy ON analytics_reports
            FOR ALL
            USING (
                organization_id = current_setting('app.current_org_id')::uuid
            );
    """)


def downgrade() -> None:
    """Remove analytics tables."""
    # Drop RLS policies
    op.execute("""
        DROP POLICY IF EXISTS dimension_access_policy ON analytics_dimensions;
        DROP POLICY IF EXISTS metric_access_policy ON analytics_metrics;
        DROP POLICY IF EXISTS fact_access_policy ON analytics_facts;
        DROP POLICY IF EXISTS report_access_policy ON analytics_reports;
    """)

    # Drop indexes
    op.drop_index('ix_analytics_dimensions_org', 'analytics_dimensions')
    op.drop_index('ix_analytics_dimensions_type', 'analytics_dimensions')

    op.drop_index('ix_analytics_metrics_org', 'analytics_metrics')
    op.drop_index('ix_analytics_metrics_type', 'analytics_metrics')

    op.drop_index('ix_analytics_facts_org', 'analytics_facts')
    op.drop_index('ix_analytics_facts_territory', 'analytics_facts')
    op.drop_index('ix_analytics_facts_metric', 'analytics_facts')
    op.drop_index('ix_analytics_facts_date', 'analytics_facts')

    op.drop_index('ix_analytics_reports_org', 'analytics_reports')
    op.drop_index('ix_analytics_reports_created', 'analytics_reports')

    # Drop tables in correct order
    op.drop_table('analytics_reports')
    op.drop_table('analytics_facts')
    op.drop_table('analytics_metrics')
    op.drop_table('analytics_dimensions') 