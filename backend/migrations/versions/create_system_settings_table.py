"""create system settings table

Revision ID: create_system_settings_table
Revises: None
Create Date: 2024-02-20 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'create_system_settings_table'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'system_settings',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('platform_name', sa.String(), nullable=False),
        sa.Column('support_email', sa.String(), nullable=False),
        sa.Column('support_phone', sa.String(), nullable=False),
        sa.Column('maintenance_mode', sa.Boolean(), default=False),
        sa.Column('password_policy', sa.JSON(), nullable=False),
        sa.Column('hipaa_logging', sa.Boolean(), default=True),
        sa.Column('audit_retention_days', sa.Integer(), default=365),
        sa.Column('data_encryption', sa.Boolean(), default=True),
        sa.Column('api_rate_limit', sa.Integer(), default=1000),
        sa.Column('webhook_url', sa.String()),
        sa.Column('enable_webhooks', sa.Boolean(), default=True),
        sa.Column('email_notifications', sa.Boolean(), default=True),
        sa.Column('sms_notifications', sa.Boolean(), default=True),
        sa.Column('push_notifications', sa.Boolean(), default=True),
        sa.Column('created_at', sa.String(), server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.String(), server_default=sa.text('NOW()')),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        op.f('ix_system_settings_id'),
        'system_settings',
        ['id'],
        unique=True
    )


def downgrade() -> None:
    op.drop_index(op.f('ix_system_settings_id'), table_name='system_settings')
    op.drop_table('system_settings') 