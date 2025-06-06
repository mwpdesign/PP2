"""Add delegation permissions table

Revision ID: add_delegation_permissions
Revises:
Create Date: 2025-01-06 07:45:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_delegation_permissions'
down_revision = None  # Update this to the latest revision
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add delegation permissions table."""
    op.create_table(
        'delegation_permissions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('delegator_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id'), nullable=False),
        sa.Column('delegate_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id'), nullable=False),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('organizations.id'), nullable=False),
        sa.Column('permissions', postgresql.ARRAY(sa.String), nullable=False),
        sa.Column('scope_restrictions', postgresql.JSONB, nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('requires_approval', sa.Boolean, default=False,
                  nullable=False),
        sa.Column('delegation_reason', sa.Text, nullable=True),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('is_active', sa.Boolean, default=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  server_default=sa.text('now()'), nullable=False),
        sa.Column('created_by_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id'), nullable=False),
        sa.Column('approved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('approved_by_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id'), nullable=True),
        sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('revoked_by_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id'), nullable=True),
    )

    # Create indexes for better query performance
    op.create_index(
        'ix_delegation_permissions_delegator_id',
        'delegation_permissions',
        ['delegator_id']
    )
    op.create_index(
        'ix_delegation_permissions_delegate_id',
        'delegation_permissions',
        ['delegate_id']
    )
    op.create_index(
        'ix_delegation_permissions_organization_id',
        'delegation_permissions',
        ['organization_id']
    )
    op.create_index(
        'ix_delegation_permissions_is_active',
        'delegation_permissions',
        ['is_active']
    )
    op.create_index(
        'ix_delegation_permissions_expires_at',
        'delegation_permissions',
        ['expires_at']
    )

    # Create composite index for common queries
    op.create_index(
        'ix_delegation_permissions_delegate_active',
        'delegation_permissions',
        ['delegate_id', 'is_active', 'expires_at']
    )


def downgrade() -> None:
    """Remove delegation permissions table."""
    op.drop_index('ix_delegation_permissions_delegate_active')
    op.drop_index('ix_delegation_permissions_expires_at')
    op.drop_index('ix_delegation_permissions_is_active')
    op.drop_index('ix_delegation_permissions_organization_id')
    op.drop_index('ix_delegation_permissions_delegate_id')
    op.drop_index('ix_delegation_permissions_delegator_id')
    op.drop_table('delegation_permissions')