"""Add new analytics dimensions for satisfaction and verification
performance."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


# revision identifiers, used by Alembic.
revision = '20240326_01'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Create patient satisfaction dimension
    op.create_table(
        'dim_patient_satisfaction',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('satisfaction_level', sa.String(20), nullable=False),
        sa.Column('feedback_category', sa.String(50), nullable=False),
        sa.Column('response_channel', sa.String(20), nullable=False),
        sa.Column('sentiment_score', sa.Float(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_index(
        'idx_satisfaction_level',
        'dim_patient_satisfaction',
        ['satisfaction_level']
    )
    op.create_index(
        'idx_feedback_category',
        'dim_patient_satisfaction',
        ['feedback_category']
    )
    
    # Create verification performance dimension
    op.create_table(
        'dim_verification_performance',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('verification_type', sa.String(50), nullable=False),
        sa.Column('response_time_category', sa.String(20), nullable=False),
        sa.Column('error_type', sa.String(50)),
        sa.Column('retry_count', sa.Integer(), server_default='0'),
        sa.Column('sla_category', sa.String(20), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_index(
        'idx_verification_type',
        'dim_verification_performance',
        ['verification_type']
    )
    op.create_index(
        'idx_sla_category',
        'dim_verification_performance',
        ['sla_category']
    )
    
    # Add new columns to fact_calls
    op.add_column(
        'fact_calls',
        sa.Column('satisfaction_id', sa.Integer())
    )
    op.add_column(
        'fact_calls',
        sa.Column('verification_performance_id', sa.Integer())
    )
    op.add_column(
        'fact_calls',
        sa.Column('sentiment_score', sa.Float())
    )
    op.add_column(
        'fact_calls',
        sa.Column('feedback_text', sa.String(500))
    )
    
    # Add foreign key constraints
    op.create_foreign_key(
        'fk_calls_satisfaction',
        'fact_calls',
        'dim_patient_satisfaction',
        ['satisfaction_id'],
        ['id']
    )
    op.create_foreign_key(
        'fk_calls_verification',
        'fact_calls',
        'dim_verification_performance',
        ['verification_performance_id'],
        ['id']
    )
    
    # Add indexes for new columns
    op.create_index(
        'idx_calls_satisfaction',
        'fact_calls',
        ['satisfaction_id']
    )
    op.create_index(
        'idx_calls_verification',
        'fact_calls',
        ['verification_performance_id']
    )
    
    # Add new columns to agg_daily_metrics
    op.add_column(
        'agg_daily_metrics',
        sa.Column(
            'satisfaction_by_category',
            JSONB,
            nullable=False,
            server_default='{}'
        )
    )
    op.add_column(
        'agg_daily_metrics',
        sa.Column(
            'sentiment_trend',
            JSONB,
            nullable=False,
            server_default='{}'
        )
    )
    op.add_column(
        'agg_daily_metrics',
        sa.Column(
            'feedback_categories',
            JSONB,
            nullable=False,
            server_default='{}'
        )
    )
    op.add_column(
        'agg_daily_metrics',
        sa.Column(
            'verification_by_type',
            JSONB,
            nullable=False,
            server_default='{}'
        )
    )
    op.add_column(
        'agg_daily_metrics',
        sa.Column(
            'sla_performance',
            JSONB,
            nullable=False,
            server_default='{}'
        )
    )
    op.add_column(
        'agg_daily_metrics',
        sa.Column(
            'error_distribution',
            JSONB,
            nullable=False,
            server_default='{}'
        )
    )


def downgrade():
    # Remove indexes
    op.drop_index('idx_calls_satisfaction', 'fact_calls')
    op.drop_index('idx_calls_verification', 'fact_calls')
    
    # Remove foreign key constraints
    op.drop_constraint('fk_calls_satisfaction', 'fact_calls')
    op.drop_constraint('fk_calls_verification', 'fact_calls')
    
    # Remove columns from fact_calls
    op.drop_column('fact_calls', 'satisfaction_id')
    op.drop_column('fact_calls', 'verification_performance_id')
    op.drop_column('fact_calls', 'sentiment_score')
    op.drop_column('fact_calls', 'feedback_text')
    
    # Remove columns from agg_daily_metrics
    op.drop_column('agg_daily_metrics', 'satisfaction_by_category')
    op.drop_column('agg_daily_metrics', 'sentiment_trend')
    op.drop_column('agg_daily_metrics', 'feedback_categories')
    op.drop_column('agg_daily_metrics', 'verification_by_type')
    op.drop_column('agg_daily_metrics', 'sla_performance')
    op.drop_column('agg_daily_metrics', 'error_distribution')
    
    # Drop indexes from dimension tables
    op.drop_index('idx_satisfaction_level', 'dim_patient_satisfaction')
    op.drop_index('idx_feedback_category', 'dim_patient_satisfaction')
    op.drop_index('idx_verification_type', 'dim_verification_performance')
    op.drop_index('idx_sla_category', 'dim_verification_performance')
    
    # Drop dimension tables
    op.drop_table('dim_patient_satisfaction')
    op.drop_table('dim_verification_performance') 