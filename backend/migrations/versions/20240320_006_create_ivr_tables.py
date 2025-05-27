"""Create IVR tables for call handling and session management.

Revision ID: 20240320_006_create_ivr_tables
Revises: 20240320_005_create_analytics_tables
Create Date: 2024-03-20 15:00:00.000000
"""
from datetime import datetime
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid


# revision identifiers, used by Alembic
revision = '20240320_006_create_ivr_tables'
down_revision = '20240320_005_create_analytics_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create IVR-related tables."""
    # Create ivr_sessions table
    op.create_table(
        'ivr_sessions',
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
            sa.ForeignKey('patients.id')
        ),
        sa.Column('call_id', sa.String(100), nullable=False),
        sa.Column('caller_number', sa.String(20), nullable=False),
        sa.Column('called_number', sa.String(20), nullable=False),
        sa.Column(
            'session_type',
            sa.String(20),
            nullable=False,
            default='inbound'
        ),
        sa.Column(
            'status',
            sa.String(20),
            nullable=False,
            default='active'
        ),
        sa.Column('start_time', sa.DateTime(), nullable=False),
        sa.Column('end_time', sa.DateTime()),
        sa.Column('duration_seconds', sa.Integer()),
        sa.Column(
            'session_data',
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
        sa.UniqueConstraint('call_id', name='uq_call_id')
    )

    # Create ivr_prompts table
    op.create_table(
        'ivr_prompts',
        sa.Column(
            'id',
            UUID(as_uuid=True),
            primary_key=True,
            default=uuid.uuid4
        ),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.String(500)),
        sa.Column('prompt_type', sa.String(50), nullable=False),
        sa.Column('prompt_text', sa.Text, nullable=False),
        sa.Column('voice_name', sa.String(50)),
        sa.Column('language_code', sa.String(10)),
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
            name='uq_prompt_name_org'
        )
    )

    # Create ivr_interactions table
    op.create_table(
        'ivr_interactions',
        sa.Column(
            'id',
            UUID(as_uuid=True),
            primary_key=True,
            default=uuid.uuid4
        ),
        sa.Column(
            'session_id',
            UUID(as_uuid=True),
            sa.ForeignKey('ivr_sessions.id'),
            nullable=False
        ),
        sa.Column(
            'prompt_id',
            UUID(as_uuid=True),
            sa.ForeignKey('ivr_prompts.id'),
            nullable=False
        ),
        sa.Column('interaction_type', sa.String(50), nullable=False),
        sa.Column('user_input', sa.String(255)),
        sa.Column('confidence_score', sa.Float()),
        sa.Column('start_time', sa.DateTime(), nullable=False),
        sa.Column('end_time', sa.DateTime()),
        sa.Column('duration_seconds', sa.Integer()),
        sa.Column(
            'interaction_data',
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

    # Create ivr_recordings table
    op.create_table(
        'ivr_recordings',
        sa.Column(
            'id',
            UUID(as_uuid=True),
            primary_key=True,
            default=uuid.uuid4
        ),
        sa.Column(
            'session_id',
            UUID(as_uuid=True),
            sa.ForeignKey('ivr_sessions.id'),
            nullable=False
        ),
        sa.Column('recording_url', sa.String(500), nullable=False),
        sa.Column('recording_type', sa.String(50), nullable=False),
        sa.Column('start_time', sa.DateTime(), nullable=False),
        sa.Column('end_time', sa.DateTime()),
        sa.Column('duration_seconds', sa.Integer()),
        sa.Column('file_size', sa.Integer()),
        sa.Column('mime_type', sa.String(100)),
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
    op.create_index('ix_ivr_sessions_org', 'ivr_sessions', ['organization_id'])
    op.create_index(
        'ix_ivr_sessions_territory',
        'ivr_sessions',
        ['territory_id']
    )
    op.create_index('ix_ivr_sessions_patient', 'ivr_sessions', ['patient_id'])
    op.create_index('ix_ivr_sessions_call', 'ivr_sessions', ['call_id'])
    op.create_index('ix_ivr_sessions_status', 'ivr_sessions', ['status'])
    op.create_index('ix_ivr_sessions_start', 'ivr_sessions', ['start_time'])

    op.create_index('ix_ivr_prompts_org', 'ivr_prompts', ['organization_id'])
    op.create_index('ix_ivr_prompts_type', 'ivr_prompts', ['prompt_type'])

    op.create_index(
        'ix_ivr_interactions_session',
        'ivr_interactions',
        ['session_id']
    )
    op.create_index(
        'ix_ivr_interactions_prompt',
        'ivr_interactions',
        ['prompt_id']
    )
    op.create_index(
        'ix_ivr_interactions_type',
        'ivr_interactions',
        ['interaction_type']
    )
    op.create_index(
        'ix_ivr_interactions_start',
        'ivr_interactions',
        ['start_time']
    )

    op.create_index(
        'ix_ivr_recordings_session',
        'ivr_recordings',
        ['session_id']
    )
    op.create_index(
        'ix_ivr_recordings_type',
        'ivr_recordings',
        ['recording_type']
    )

    # Create RLS policies
    op.execute("""
        ALTER TABLE ivr_sessions ENABLE ROW LEVEL SECURITY;

        CREATE POLICY session_access_policy ON ivr_sessions
            FOR ALL
            USING (
                organization_id = current_setting('app.current_org_id')::uuid
                AND territory_id = ANY(
                    current_setting('app.user_territories')::uuid[]
                )
            );
    """)

    op.execute("""
        ALTER TABLE ivr_prompts ENABLE ROW LEVEL SECURITY;

        CREATE POLICY prompt_access_policy ON ivr_prompts
            FOR ALL
            USING (
                organization_id = current_setting('app.current_org_id')::uuid
            );
    """)

    op.execute("""
        ALTER TABLE ivr_interactions ENABLE ROW LEVEL SECURITY;

        CREATE POLICY interaction_access_policy ON ivr_interactions
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM ivr_sessions s
                    WHERE s.id = session_id
                    AND s.organization_id = \
                        current_setting('app.current_org_id')::uuid
                    AND s.territory_id = ANY(
                        current_setting('app.user_territories')::uuid[]
                    )
                )
            );
    """)

    op.execute("""
        ALTER TABLE ivr_recordings ENABLE ROW LEVEL SECURITY;

        CREATE POLICY recording_access_policy ON ivr_recordings
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM ivr_sessions s
                    WHERE s.id = session_id
                    AND s.organization_id = \
                        current_setting('app.current_org_id')::uuid
                    AND s.territory_id = ANY(
                        current_setting('app.user_territories')::uuid[]
                    )
                )
            );
    """)


def downgrade() -> None:
    """Remove IVR-related tables."""
    # Drop RLS policies
    op.execute("""
        DROP POLICY IF EXISTS session_access_policy ON ivr_sessions;
        DROP POLICY IF EXISTS prompt_access_policy ON ivr_prompts;
        DROP POLICY IF EXISTS interaction_access_policy ON ivr_interactions;
        DROP POLICY IF EXISTS recording_access_policy ON ivr_recordings;
    """)

    # Drop indexes
    op.drop_index('ix_ivr_sessions_org', 'ivr_sessions')
    op.drop_index('ix_ivr_sessions_territory', 'ivr_sessions')
    op.drop_index('ix_ivr_sessions_patient', 'ivr_sessions')
    op.drop_index('ix_ivr_sessions_call', 'ivr_sessions')
    op.drop_index('ix_ivr_sessions_status', 'ivr_sessions')
    op.drop_index('ix_ivr_sessions_start', 'ivr_sessions')

    op.drop_index('ix_ivr_prompts_org', 'ivr_prompts')
    op.drop_index('ix_ivr_prompts_type', 'ivr_prompts')

    op.drop_index('ix_ivr_interactions_session', 'ivr_interactions')
    op.drop_index('ix_ivr_interactions_prompt', 'ivr_interactions')
    op.drop_index('ix_ivr_interactions_type', 'ivr_interactions')
    op.drop_index('ix_ivr_interactions_start', 'ivr_interactions')

    op.drop_index('ix_ivr_recordings_session', 'ivr_recordings')
    op.drop_index('ix_ivr_recordings_type', 'ivr_recordings')

    # Drop tables in correct order
    op.drop_table('ivr_recordings')
    op.drop_table('ivr_interactions')
    op.drop_table('ivr_prompts')
    op.drop_table('ivr_sessions')
