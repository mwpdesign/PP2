"""Create patient tables with all required fields and encryption support.

Revision ID: 20240320_003_create_patient_tables
Revises: 20240320_002_create_product_tables
Create Date: 2024-03-20 12:00:00.000000
"""
from datetime import datetime
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid


# revision identifiers, used by Alembic
revision = '20240320_003_create_patient_tables'
down_revision = '20240320_002_create_product_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create patient-related tables with encryption support."""
    # Create patients table
    op.create_table(
        'patients',
        sa.Column(
            'id',
            UUID(as_uuid=True),
            primary_key=True,
            default=uuid.uuid4
        ),
        sa.Column(
            'external_id',
            sa.String(100),
            unique=True,
            nullable=True
        ),
        sa.Column(
            'encrypted_first_name',
            sa.LargeBinary,
            nullable=False
        ),
        sa.Column(
            'encrypted_last_name',
            sa.LargeBinary,
            nullable=False
        ),
        sa.Column(
            'encrypted_dob',
            sa.LargeBinary,
            nullable=False
        ),
        sa.Column(
            'encrypted_ssn',
            sa.LargeBinary,
            nullable=True
        ),
        sa.Column(
            'encrypted_phone',
            sa.LargeBinary,
            nullable=True
        ),
        sa.Column(
            'encrypted_email',
            sa.LargeBinary,
            nullable=True
        ),
        sa.Column(
            'encrypted_address',
            sa.LargeBinary,
            nullable=True
        ),
        sa.Column(
            'status',
            sa.String(20),
            nullable=False,
            default='active'
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
            'facility_id',
            UUID(as_uuid=True),
            sa.ForeignKey('facilities.id'),
            nullable=False
        ),
        sa.Column(
            'provider_id',
            UUID(as_uuid=True),
            sa.ForeignKey('providers.id'),
            nullable=False
        ),
        sa.Column(
            'created_by_id',
            UUID(as_uuid=True),
            sa.ForeignKey('users.id'),
            nullable=False
        ),
        sa.Column(
            'updated_by_id',
            UUID(as_uuid=True),
            sa.ForeignKey('users.id'),
            nullable=True
        ),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            nullable=False,
            default=datetime.utcnow
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            nullable=True,
            onupdate=datetime.utcnow
        ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create encrypted_patient_data table
    op.create_table(
        'encrypted_patient_data',
        sa.Column(
            'patient_id',
            UUID(as_uuid=True),
            sa.ForeignKey('patients.id'),
            primary_key=True
        ),
        sa.Column('encrypted_first_name', sa.String(255), nullable=False),
        sa.Column('encrypted_middle_name', sa.String(255)),
        sa.Column('encrypted_last_name', sa.String(255), nullable=False),
        sa.Column('encrypted_date_of_birth', sa.String(255), nullable=False),
        sa.Column('encrypted_gender', sa.String(255), nullable=False),
        sa.Column('encrypted_ssn', sa.String(255)),
        sa.Column('encrypted_email', sa.String(255)),
        sa.Column('encrypted_phone', sa.String(255), nullable=False),
        sa.Column('encrypted_street_address', sa.String(500), nullable=False),
        sa.Column('encrypted_city', sa.String(255), nullable=False),
        sa.Column('encrypted_state', sa.String(255), nullable=False),
        sa.Column('encrypted_zip_code', sa.String(255), nullable=False),
        sa.Column('encrypted_medical_notes', sa.Text),
        sa.Column('id_type', sa.String(50), nullable=False),
        sa.Column('skilled_nursing_facility', sa.Boolean(), default=False),
        sa.Column('part_a_stay_coverage', sa.Boolean(), default=False),
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
        sa.PrimaryKeyConstraint('patient_id')
    )

    # Create patient_insurance table
    op.create_table(
        'patient_insurance',
        sa.Column(
            'id',
            UUID(as_uuid=True),
            primary_key=True,
            default=uuid.uuid4
        ),
        sa.Column(
            'patient_id',
            UUID(as_uuid=True),
            sa.ForeignKey('patients.id'),
            nullable=False
        ),
        sa.Column('insurance_type', sa.String(50), nullable=False),
        sa.Column('encrypted_payer_name', sa.String(255), nullable=False),
        sa.Column('encrypted_policy_number', sa.String(255), nullable=False),
        sa.Column('encrypted_group_number', sa.String(255)),
        sa.Column('encrypted_payer_phone', sa.String(255), nullable=False),
        sa.Column('is_primary', sa.Boolean(), nullable=False),
        sa.Column('coverage_start_date', sa.Date(), nullable=False),
        sa.Column('coverage_end_date', sa.Date()),
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

    # Create patient_documents table
    op.create_table(
        'patient_documents',
        sa.Column(
            'id',
            UUID(as_uuid=True),
            primary_key=True,
            default=uuid.uuid4
        ),
        sa.Column(
            'patient_id',
            UUID(as_uuid=True),
            sa.ForeignKey('patients.id'),
            nullable=False
        ),
        sa.Column(
            'document_type',
            sa.String(50),
            nullable=False
        ),
        sa.Column(
            'file_name',
            sa.String(255),
            nullable=False
        ),
        sa.Column(
            'file_path',
            sa.Text,
            nullable=False
        ),
        sa.Column(
            'document_category',
            sa.String(50),
            nullable=False
        ),
        sa.Column(
            'document_metadata',
            JSONB,
            nullable=True
        ),
        sa.Column(
            'territory_id',
            UUID(as_uuid=True),
            sa.ForeignKey('territories.id'),
            nullable=False
        ),
        sa.Column(
            'created_by_id',
            UUID(as_uuid=True),
            sa.ForeignKey('users.id'),
            nullable=False
        ),
        sa.Column(
            'updated_by_id',
            UUID(as_uuid=True),
            sa.ForeignKey('users.id'),
            nullable=True
        ),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            nullable=False,
            default=datetime.utcnow
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            nullable=True,
            onupdate=datetime.utcnow
        ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes
    op.create_index(
        'ix_patients_external_id',
        'patients',
        ['external_id']
    )
    op.create_index(
        'ix_patients_organization',
        'patients',
        ['organization_id']
    )
    op.create_index(
        'ix_patients_territory',
        'patients',
        ['territory_id']
    )
    op.create_index(
        'ix_patients_facility',
        'patients',
        ['facility_id']
    )
    op.create_index(
        'ix_patients_provider',
        'patients',
        ['provider_id']
    )
    op.create_index(
        'ix_patient_docs_patient',
        'patient_documents',
        ['patient_id']
    )
    op.create_index(
        'ix_patient_docs_territory',
        'patient_documents',
        ['territory_id']
    )

    # Create RLS policies
    op.execute("""
        ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

        CREATE POLICY patient_access_policy ON patients
            FOR ALL
            USING (
                organization_id = current_setting('app.current_org_id')::uuid
                AND territory_id = ANY(
                    current_setting('app.user_territories')::uuid[]
                )
            );
    """)

    op.execute("""
        ALTER TABLE encrypted_patient_data ENABLE ROW LEVEL SECURITY;

        CREATE POLICY patient_data_access_policy ON encrypted_patient_data
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM patients p
                    WHERE p.id = patient_id
                    AND p.organization_id =
                        current_setting('app.current_org_id')::uuid
                    AND p.territory_id = ANY(
                        current_setting('app.user_territories')::uuid[]
                    )
                )
            );
    """)

    op.execute("""
        ALTER TABLE patient_insurance ENABLE ROW LEVEL SECURITY;

        CREATE POLICY insurance_access_policy ON patient_insurance
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM patients p
                    WHERE p.id = patient_id
                    AND p.organization_id =
                        current_setting('app.current_org_id')::uuid
                    AND p.territory_id = ANY(
                        current_setting('app.user_territories')::uuid[]
                    )
                )
            );
    """)

    op.execute("""
        ALTER TABLE patient_documents ENABLE ROW LEVEL SECURITY;

        CREATE POLICY patient_doc_access_policy ON patient_documents
            FOR ALL
            USING (
                territory_id = ANY(
                    current_setting('app.user_territories')::uuid[]
                )
            );
    """)


def downgrade() -> None:
    """Remove patient-related tables."""
    # Drop RLS policies
    op.execute("""
        DROP POLICY IF EXISTS patient_access_policy ON patients;
        DROP POLICY IF EXISTS patient_doc_access_policy ON patient_documents;
    """)

    # Drop tables (this will automatically drop indexes)
    op.drop_table('patient_documents')
    op.drop_table('patients')
