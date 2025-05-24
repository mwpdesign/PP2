"""Create core tables for users, organizations, roles, and territories.

Revision ID: 20240320_001_create_core_tables
Revises: None
Create Date: 2024-03-20 10:00:00.000000
"""
from datetime import datetime
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid


# revision identifiers, used by Alembic
revision = '20240320_001_create_core_tables'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create core tables with security features."""
    # Create organizations table
    op.create_table(
        'organizations',
        sa.Column(
            'id',
            UUID(as_uuid=True),
            primary_key=True,
            default=uuid.uuid4
        ),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.String(500)),
        sa.Column(
            'settings',
            JSONB,
            nullable=False,
            server_default='{}'
        ),
        sa.Column(
            'security_policy',
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
        sa.UniqueConstraint('name', name='uq_org_name')
    )

    # Create roles table
    op.create_table(
        'roles',
        sa.Column(
            'id',
            UUID(as_uuid=True),
            primary_key=True,
            default=uuid.uuid4
        ),
        sa.Column('name', sa.String(50), nullable=False),
        sa.Column('description', sa.String(255)),
        sa.Column(
            'organization_id',
            UUID(as_uuid=True),
            sa.ForeignKey('organizations.id')
        ),
        sa.Column(
            'parent_role_id',
            UUID(as_uuid=True),
            sa.ForeignKey('roles.id')
        ),
        sa.Column(
            'permissions',
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
            name='uq_role_name_org'
        )
    )

    # Create territories table
    op.create_table(
        'territories',
        sa.Column(
            'id',
            UUID(as_uuid=True),
            primary_key=True,
            default=uuid.uuid4
        ),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('code', sa.String(20), nullable=False),
        sa.Column(
            'organization_id',
            UUID(as_uuid=True),
            sa.ForeignKey('organizations.id'),
            nullable=False
        ),
        sa.Column(
            'parent_territory_id',
            UUID(as_uuid=True),
            sa.ForeignKey('territories.id')
        ),
        sa.Column('type', sa.String(50), nullable=False),
        sa.Column(
            'metadata',
            JSONB,
            nullable=False,
            server_default='{}'
        ),
        sa.Column(
            'security_policy',
            JSONB,
            nullable=False,
            server_default='{}'
        ),
        sa.Column('latitude', sa.Float()),
        sa.Column('longitude', sa.Float()),
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
            'code',
            'organization_id',
            name='uq_territory_code_org'
        )
    )

    # Create users table
    op.create_table(
        'users',
        sa.Column(
            'id',
            UUID(as_uuid=True),
            primary_key=True,
            default=uuid.uuid4
        ),
        sa.Column('username', sa.String(50), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('encrypted_password', sa.String(255), nullable=False),
        sa.Column('first_name', sa.String(100)),
        sa.Column('last_name', sa.String(100)),
        sa.Column(
            'organization_id',
            UUID(as_uuid=True),
            sa.ForeignKey('organizations.id'),
            nullable=False
        ),
        sa.Column(
            'role_id',
            UUID(as_uuid=True),
            sa.ForeignKey('roles.id'),
            nullable=False
        ),
        sa.Column(
            'primary_territory_id',
            UUID(as_uuid=True),
            sa.ForeignKey('territories.id')
        ),
        sa.Column(
            'assigned_territories',
            sa.ARRAY(UUID(as_uuid=True))
        ),
        sa.Column('security_groups', sa.ARRAY(sa.String(50))),
        sa.Column('last_login', sa.DateTime()),
        sa.Column(
            'failed_login_attempts',
            sa.Integer(),
            nullable=False,
            default=0
        ),
        sa.Column('locked_until', sa.DateTime()),
        sa.Column('password_changed_at', sa.DateTime()),
        sa.Column(
            'force_password_change',
            sa.Boolean(),
            nullable=False,
            default=False
        ),
        sa.Column(
            'mfa_enabled',
            sa.Boolean(),
            nullable=False,
            default=False
        ),
        sa.Column('mfa_secret', sa.String(255)),
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
        sa.UniqueConstraint('username', name='uq_username'),
        sa.UniqueConstraint('email', name='uq_email')
    )

    # Create sensitive_user_data table with encryption support
    op.create_table(
        'sensitive_user_data',
        sa.Column(
            'user_id',
            UUID(as_uuid=True),
            sa.ForeignKey('users.id'),
            primary_key=True
        ),
        sa.Column('encrypted_ssn', sa.String(255)),
        sa.Column('encrypted_phone', sa.String(255)),
        sa.Column('encrypted_address', sa.String(500)),
        sa.Column('encryption_key_id', sa.String(255), nullable=False),
        sa.Column(
            'encryption_context',
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
        sa.PrimaryKeyConstraint('user_id')
    )

    # Create indexes for efficient querying
    op.create_index('ix_users_org', 'users', ['organization_id'])
    op.create_index('ix_users_role', 'users', ['role_id'])
    op.create_index('ix_users_territory', 'users', ['primary_territory_id'])
    op.create_index(
        'ix_users_email_lower',
        'users',
        [sa.text('lower(email)')]
    )
    op.create_index(
        'ix_users_username_lower',
        'users',
        [sa.text('lower(username)')]
    )

    op.create_index('ix_territories_org', 'territories', ['organization_id'])
    op.create_index(
        'ix_territories_parent',
        'territories',
        ['parent_territory_id']
    )
    op.create_index('ix_territories_code', 'territories', ['code'])

    op.create_index('ix_roles_org', 'roles', ['organization_id'])
    op.create_index('ix_roles_parent', 'roles', ['parent_role_id'])

    # Create RLS policies
    op.execute("""
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY user_isolation_policy ON users
            FOR ALL
            USING (
                organization_id = current_setting('app.current_org_id')::uuid
                AND (
                    id = current_setting('app.current_user_id')::uuid
                    OR current_setting('app.current_user_role') = 'admin'
                    OR primary_territory_id = ANY(
                        current_setting('app.user_territories')::uuid[]
                    )
                )
            );
    """)

    op.execute("""
        ALTER TABLE sensitive_user_data ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY sensitive_data_access_policy ON sensitive_user_data
            FOR ALL
            USING (
                user_id = current_setting('app.current_user_id')::uuid
                OR current_setting('app.current_user_role') = 'admin'
            );
    """)

    op.execute("""
        ALTER TABLE territories ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY territory_access_policy ON territories
            FOR ALL
            USING (
                organization_id = current_setting('app.current_org_id')::uuid
                AND (
                    id = ANY(current_setting('app.user_territories')::uuid[])
                    OR current_setting('app.current_user_role') = 'admin'
                )
            );
    """)


def downgrade() -> None:
    """Remove core tables."""
    # Drop RLS policies
    op.execute("""
        DROP POLICY IF EXISTS user_isolation_policy ON users;
        DROP POLICY IF EXISTS sensitive_data_access_policy ON sensitive_user_data;
        DROP POLICY IF EXISTS territory_access_policy ON territories;
    """)

    # Drop indexes
    op.drop_index('ix_users_org', 'users')
    op.drop_index('ix_users_role', 'users')
    op.drop_index('ix_users_territory', 'users')
    op.drop_index('ix_users_email_lower', 'users')
    op.drop_index('ix_users_username_lower', 'users')

    op.drop_index('ix_territories_org', 'territories')
    op.drop_index('ix_territories_parent', 'territories')
    op.drop_index('ix_territories_code', 'territories')

    op.drop_index('ix_roles_org', 'roles')
    op.drop_index('ix_roles_parent', 'roles')

    # Drop tables in correct order
    op.drop_table('sensitive_user_data')
    op.drop_table('users')
    op.drop_table('territories')
    op.drop_table('roles')
    op.drop_table('organizations') 