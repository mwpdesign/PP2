"""Migration for HIPAA audit tables."""
from datetime import datetime
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, ARRAY


# revision identifiers, used by Alembic
revision = '005_hipaa_audit_tables'
down_revision = '004_order_status_history'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create HIPAA audit tables."""
    # Create phi_access_logs table
    op.create_table(
        'phi_access_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column(
            'user_id',
            sa.Integer(),
            sa.ForeignKey('users.id'),
            nullable=False
        ),
        sa.Column(
            'patient_id',
            sa.Integer(),
            sa.ForeignKey('patients.id'),
            nullable=False
        ),
        sa.Column('action', sa.String(50), nullable=False),
        sa.Column(
            'territory_id',
            sa.Integer(),
            sa.ForeignKey('territories.id'),
            nullable=False
        ),
        sa.Column('resource_type', sa.String(50), nullable=False),
        sa.Column('resource_id', sa.Integer(), nullable=False),
        sa.Column('accessed_fields', ARRAY(sa.String()), nullable=False),
        sa.Column('ip_address', sa.String(50)),
        sa.Column('user_agent', sa.String(255)),
        sa.Column('request_id', sa.String(100)),
        sa.Column('correlation_id', sa.String(100)),
        sa.Column('session_id', sa.String(100)),
        sa.Column('access_reason', sa.String(255)),
        sa.Column('access_location', sa.String(100)),
        sa.Column(
            'created_at',
            sa.DateTime(),
            nullable=False,
            default=datetime.utcnow
        ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create audit_logs table
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column(
            'user_id',
            sa.Integer(),
            sa.ForeignKey('users.id'),
            nullable=False
        ),
        sa.Column('action', sa.String(100), nullable=False),
        sa.Column('resource_type', sa.String(50), nullable=False),
        sa.Column('resource_id', sa.Integer(), nullable=False),
        sa.Column(
            'territory_id',
            sa.Integer(),
            sa.ForeignKey('territories.id'),
            nullable=False
        ),
        sa.Column('details', JSONB),
        sa.Column(
            'created_at',
            sa.DateTime(),
            nullable=False,
            default=datetime.utcnow
        ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create compliance_checks table
    op.create_table(
        'compliance_checks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('check_type', sa.String(50), nullable=False),
        sa.Column(
            'territory_id',
            sa.Integer(),
            sa.ForeignKey('territories.id')
        ),
        sa.Column('status', sa.String(20), nullable=False),
        sa.Column('results', JSONB, nullable=False),
        sa.Column(
            'created_at',
            sa.DateTime(),
            nullable=False,
            default=datetime.utcnow
        ),
        sa.Column('completed_at', sa.DateTime()),
        sa.PrimaryKeyConstraint('id')
    )

    # Create security_incidents table
    op.create_table(
        'security_incidents',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('incident_type', sa.String(50), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column(
            'reported_by',
            sa.Integer(),
            sa.ForeignKey('users.id'),
            nullable=False
        ),
        sa.Column(
            'territory_id',
            sa.Integer(),
            sa.ForeignKey('territories.id'),
            nullable=False
        ),
        sa.Column('severity', sa.String(20), nullable=False),
        sa.Column(
            'status',
            sa.String(20),
            nullable=False,
            default='open'
        ),
        sa.Column('affected_resources', JSONB, nullable=False),
        sa.Column('metadata', JSONB),
        sa.Column(
            'reported_at',
            sa.DateTime(),
            nullable=False,
            default=datetime.utcnow
        ),
        sa.Column('resolved_at', sa.DateTime()),
        sa.Column('resolution_notes', sa.Text()),
        sa.PrimaryKeyConstraint('id')
    )

    # Create audit_reports table
    op.create_table(
        'audit_reports',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('report_type', sa.String(50), nullable=False),
        sa.Column(
            'territory_id',
            sa.Integer(),
            sa.ForeignKey('territories.id')
        ),
        sa.Column('start_date', sa.DateTime(), nullable=False),
        sa.Column('end_date', sa.DateTime(), nullable=False),
        sa.Column('report_data', JSONB, nullable=False),
        sa.Column(
            'created_at',
            sa.DateTime(),
            nullable=False,
            default=datetime.utcnow
        ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes for efficient querying
    op.create_index(
        'ix_phi_access_user',
        'phi_access_logs',
        ['user_id']
    )
    op.create_index(
        'ix_phi_access_patient',
        'phi_access_logs',
        ['patient_id']
    )
    op.create_index(
        'ix_phi_access_territory',
        'phi_access_logs',
        ['territory_id']
    )
    op.create_index(
        'ix_phi_access_created',
        'phi_access_logs',
        ['created_at']
    )
    op.create_index(
        'ix_phi_access_resource',
        'phi_access_logs',
        ['resource_type', 'resource_id']
    )

    op.create_index(
        'ix_audit_logs_user',
        'audit_logs',
        ['user_id']
    )
    op.create_index(
        'ix_audit_logs_territory',
        'audit_logs',
        ['territory_id']
    )
    op.create_index(
        'ix_audit_logs_created',
        'audit_logs',
        ['created_at']
    )
    op.create_index(
        'ix_audit_logs_action',
        'audit_logs',
        ['action']
    )

    op.create_index(
        'ix_compliance_checks_type',
        'compliance_checks',
        ['check_type']
    )
    op.create_index(
        'ix_compliance_checks_territory',
        'compliance_checks',
        ['territory_id']
    )
    op.create_index(
        'ix_compliance_checks_status',
        'compliance_checks',
        ['status']
    )
    op.create_index(
        'ix_compliance_checks_created',
        'compliance_checks',
        ['created_at']
    )

    op.create_index(
        'ix_security_incidents_type',
        'security_incidents',
        ['incident_type']
    )
    op.create_index(
        'ix_security_incidents_territory',
        'security_incidents',
        ['territory_id']
    )
    op.create_index(
        'ix_security_incidents_severity',
        'security_incidents',
        ['severity']
    )
    op.create_index(
        'ix_security_incidents_status',
        'security_incidents',
        ['status']
    )
    op.create_index(
        'ix_security_incidents_reported',
        'security_incidents',
        ['reported_at']
    )

    op.create_index(
        'ix_audit_reports_type',
        'audit_reports',
        ['report_type']
    )
    op.create_index(
        'ix_audit_reports_territory',
        'audit_reports',
        ['territory_id']
    )
    op.create_index(
        'ix_audit_reports_period',
        'audit_reports',
        ['start_date', 'end_date']
    )
    op.create_index(
        'ix_audit_reports_created',
        'audit_reports',
        ['created_at']
    )


def downgrade() -> None:
    """Remove HIPAA audit tables."""
    # Drop indexes
    op.drop_index('ix_phi_access_user', 'phi_access_logs')
    op.drop_index('ix_phi_access_patient', 'phi_access_logs')
    op.drop_index('ix_phi_access_territory', 'phi_access_logs')
    op.drop_index('ix_phi_access_created', 'phi_access_logs')
    op.drop_index('ix_phi_access_resource', 'phi_access_logs')

    op.drop_index('ix_audit_logs_user', 'audit_logs')
    op.drop_index('ix_audit_logs_territory', 'audit_logs')
    op.drop_index('ix_audit_logs_created', 'audit_logs')
    op.drop_index('ix_audit_logs_action', 'audit_logs')

    op.drop_index('ix_compliance_checks_type', 'compliance_checks')
    op.drop_index('ix_compliance_checks_territory', 'compliance_checks')
    op.drop_index('ix_compliance_checks_status', 'compliance_checks')
    op.drop_index('ix_compliance_checks_created', 'compliance_checks')

    op.drop_index('ix_security_incidents_type', 'security_incidents')
    op.drop_index('ix_security_incidents_territory', 'security_incidents')
    op.drop_index('ix_security_incidents_severity', 'security_incidents')
    op.drop_index('ix_security_incidents_status', 'security_incidents')
    op.drop_index('ix_security_incidents_reported', 'security_incidents')

    op.drop_index('ix_audit_reports_type', 'audit_reports')
    op.drop_index('ix_audit_reports_territory', 'audit_reports')
    op.drop_index('ix_audit_reports_period', 'audit_reports')
    op.drop_index('ix_audit_reports_created', 'audit_reports')

    # Drop tables
    op.drop_table('audit_reports')
    op.drop_table('security_incidents')
    op.drop_table('compliance_checks')
    op.drop_table('audit_logs')
    op.drop_table('phi_access_logs')
