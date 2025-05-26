"""Add role and security fields to user model

Revision ID: e1c947aa7f0c
Revises: 46d9087f6904
Create Date: 2025-05-26 01:40:14.691649+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'e1c947aa7f0c'
down_revision: Union[str, None] = '46d9087f6904'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop foreign key constraints first
    op.drop_constraint('verification_requests_insurance_policy_id_fkey', 'verification_requests', type_='foreignkey')
    
    # Drop tables in correct order
    op.drop_table('verification_requests')
    op.drop_table('insurance_policies')
    
    # Add new columns to users table
    op.add_column('users', sa.Column('is_superuser', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('users', sa.Column('role', sa.String(50), nullable=False, server_default='user'))
    
    # Update existing columns
    op.alter_column('users', 'username',
        existing_type=sa.String(50),
        nullable=False)
    op.alter_column('users', 'email',
        existing_type=sa.String(255),
        nullable=False)
    op.alter_column('users', 'encrypted_password',
        existing_type=sa.String(255),
        nullable=False)
    op.alter_column('users', 'is_active',
        existing_type=sa.Boolean(),
        nullable=False,
        server_default='true')
    op.alter_column('users', 'created_at',
        existing_type=sa.TIMESTAMP(),
        type_=sa.DateTime(timezone=True),
        nullable=False,
        server_default=sa.text('CURRENT_TIMESTAMP'))
    op.alter_column('users', 'updated_at',
        existing_type=sa.TIMESTAMP(),
        type_=sa.DateTime(timezone=True),
        nullable=False,
        server_default=sa.text('CURRENT_TIMESTAMP'))
    op.alter_column('users', 'last_login',
        existing_type=sa.TIMESTAMP(),
        type_=sa.DateTime(timezone=True),
        nullable=True)
    op.alter_column('users', 'mfa_enabled',
        existing_type=sa.Boolean(),
        nullable=False,
        server_default='false')
    op.alter_column('users', 'mfa_secret',
        existing_type=sa.String(255),
        type_=sa.String(32),
        nullable=True)
    op.alter_column('users', 'force_password_change',
        existing_type=sa.Boolean(),
        nullable=False,
        server_default='false')
    op.alter_column('users', 'password_changed_at',
        existing_type=sa.TIMESTAMP(),
        type_=sa.DateTime(timezone=True),
        nullable=True)
    op.alter_column('users', 'failed_login_attempts',
        existing_type=sa.Integer(),
        nullable=False,
        server_default='0')
    op.alter_column('users', 'locked_until',
        existing_type=sa.TIMESTAMP(),
        type_=sa.DateTime(timezone=True),
        nullable=True)
    
    # Drop old indexes
    op.drop_index('idx_users_email', table_name='users')
    op.drop_index('idx_users_organization', table_name='users')
    op.drop_index('ix_users_email_lower', table_name='users')
    op.drop_index('ix_users_org', table_name='users')
    op.drop_index('ix_users_role', table_name='users')
    op.drop_index('ix_users_territory', table_name='users')
    op.drop_index('ix_users_username_lower', table_name='users')
    
    # Create new indexes
    op.create_index('ix_users_email', 'users', ['email'], unique=True)
    op.create_index('ix_users_id', 'users', ['id'], unique=True)
    op.create_index('ix_users_username', 'users', ['username'], unique=True)


def downgrade() -> None:
    # Drop new indexes
    op.drop_index('ix_users_username', table_name='users')
    op.drop_index('ix_users_id', table_name='users')
    op.drop_index('ix_users_email', table_name='users')
    
    # Restore old indexes
    op.create_index('ix_users_username_lower', 'users', ['username'], unique=True)
    op.create_index('ix_users_territory', 'users', ['territory_id'])
    op.create_index('ix_users_role', 'users', ['role'])
    op.create_index('ix_users_org', 'users', ['organization_id'])
    op.create_index('ix_users_email_lower', 'users', ['email'], unique=True)
    op.create_index('idx_users_organization', 'users', ['organization_id'])
    op.create_index('idx_users_email', 'users', ['email'])
    
    # Restore column defaults and types
    op.alter_column('users', 'locked_until',
        existing_type=sa.DateTime(timezone=True),
        type_=sa.TIMESTAMP(),
        nullable=True)
    op.alter_column('users', 'failed_login_attempts',
        existing_type=sa.Integer(),
        nullable=True,
        server_default=None)
    op.alter_column('users', 'password_changed_at',
        existing_type=sa.DateTime(timezone=True),
        type_=sa.TIMESTAMP(),
        nullable=True)
    op.alter_column('users', 'force_password_change',
        existing_type=sa.Boolean(),
        nullable=True,
        server_default=None)
    op.alter_column('users', 'mfa_secret',
        existing_type=sa.String(32),
        type_=sa.String(255),
        nullable=True)
    op.alter_column('users', 'mfa_enabled',
        existing_type=sa.Boolean(),
        nullable=True,
        server_default=None)
    op.alter_column('users', 'last_login',
        existing_type=sa.DateTime(timezone=True),
        type_=sa.TIMESTAMP(),
        nullable=True)
    op.alter_column('users', 'updated_at',
        existing_type=sa.DateTime(timezone=True),
        type_=sa.TIMESTAMP(),
        nullable=True,
        server_default=None)
    op.alter_column('users', 'created_at',
        existing_type=sa.DateTime(timezone=True),
        type_=sa.TIMESTAMP(),
        nullable=True,
        server_default=None)
    op.alter_column('users', 'is_active',
        existing_type=sa.Boolean(),
        nullable=True,
        server_default=None)
    op.alter_column('users', 'encrypted_password',
        existing_type=sa.String(255),
        nullable=True)
    op.alter_column('users', 'email',
        existing_type=sa.String(255),
        nullable=True)
    op.alter_column('users', 'username',
        existing_type=sa.String(50),
        nullable=True)
    
    # Drop new columns
    op.drop_column('users', 'role')
    op.drop_column('users', 'is_superuser')
    
    # Recreate tables in correct order
    op.create_table('insurance_policies',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('policy_number', sa.String(length=50), nullable=False),
        sa.Column('provider_id', sa.UUID(), nullable=False),
        sa.Column('patient_id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('verification_requests',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('insurance_policy_id', sa.UUID(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['insurance_policy_id'], ['insurance_policies.id'], ),
        sa.PrimaryKeyConstraint('id')
    ) 