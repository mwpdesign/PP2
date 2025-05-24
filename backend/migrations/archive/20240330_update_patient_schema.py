"""Update patient schema for new form fields.

Revision ID: 20240330_update_patient_schema
Revises: 20240326_add_analytics_dimensions
Create Date: 2024-03-30 10:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB
import uuid

# revision identifiers, used by Alembic
revision = '20240330_update_patient_schema'
down_revision = '20240326_add_analytics_dimensions'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add new patient fields and related tables."""
    
    # Add new columns to patients table
    op.add_column('patients', sa.Column('middle_name', sa.String(100)))
    op.add_column('patients', sa.Column('gender', sa.String(50)))
    op.add_column('patients', sa.Column('street_address', sa.String(255)))
    op.add_column('patients', sa.Column('city', sa.String(100)))
    op.add_column('patients', sa.Column('state', sa.String(50)))
    op.add_column('patients', sa.Column('zip_code', sa.String(20)))
    op.add_column('patients', sa.Column('id_type', sa.String(50)))
    op.add_column('patients', sa.Column('skilled_nursing_facility', sa.Boolean(), server_default='false'))
    op.add_column('patients', sa.Column('part_a_stay_coverage', sa.Boolean(), server_default='false'))
    op.add_column('patients', sa.Column('primary_payer_phone', sa.String(50)))
    op.add_column('patients', sa.Column('medical_notes', sa.Text()))

    # Create patient_documents table
    op.create_table(
        'patient_documents',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('patient_id', UUID(as_uuid=True), sa.ForeignKey('patients.id'), nullable=False),
        sa.Column('document_type', sa.String(50), nullable=False),
        sa.Column('file_name', sa.String(255), nullable=False),
        sa.Column('file_path', sa.String(500), nullable=False),
        sa.Column('upload_date', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('document_category', sa.String(50), nullable=False),
        sa.Column('document_metadata', JSONB, nullable=False, server_default='{}'),
        sa.Column('territory_id', UUID(as_uuid=True), sa.ForeignKey('territories.id'), nullable=False),
        sa.Column('created_by', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()'), onupdate=sa.text('now()'))
    )

    # Create secondary_insurance table
    op.create_table(
        'secondary_insurance',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('patient_id', UUID(as_uuid=True), sa.ForeignKey('patients.id'), nullable=False),
        sa.Column('insurance_provider', sa.String(255), nullable=False),
        sa.Column('policy_number', sa.String(100), nullable=False),
        sa.Column('payer_phone', sa.String(50)),
        sa.Column('verification_status', sa.String(50)),
        sa.Column('verified_at', sa.DateTime()),
        sa.Column('coverage_start_date', sa.Date()),
        sa.Column('coverage_end_date', sa.Date()),
        sa.Column('territory_id', UUID(as_uuid=True), sa.ForeignKey('territories.id'), nullable=False),
        sa.Column('created_by', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()'), onupdate=sa.text('now()'))
    )

    # Create indexes
    op.create_index('ix_patient_documents_patient_id', 'patient_documents', ['patient_id'])
    op.create_index('ix_patient_documents_type', 'patient_documents', ['document_type'])
    op.create_index('ix_patient_documents_category', 'patient_documents', ['document_category'])
    op.create_index('ix_secondary_insurance_patient_id', 'secondary_insurance', ['patient_id'])
    op.create_index('ix_secondary_insurance_provider', 'secondary_insurance', ['insurance_provider'])

    # Enable RLS
    op.execute("""
        ALTER TABLE patient_documents ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY patient_documents_isolation_policy ON patient_documents
            FOR ALL
            USING (
                territory_id = current_setting('app.current_territory_id')::uuid
                AND EXISTS (
                    SELECT 1 FROM patients p
                    WHERE p.id = patient_documents.patient_id
                    AND p.territory_id = current_setting('app.current_territory_id')::uuid
                )
            );
    """)

    op.execute("""
        ALTER TABLE secondary_insurance ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY secondary_insurance_isolation_policy ON secondary_insurance
            FOR ALL
            USING (
                territory_id = current_setting('app.current_territory_id')::uuid
                AND EXISTS (
                    SELECT 1 FROM patients p
                    WHERE p.id = secondary_insurance.patient_id
                    AND p.territory_id = current_setting('app.current_territory_id')::uuid
                )
            );
    """)


def downgrade() -> None:
    """Remove new patient fields and related tables."""
    # Drop RLS policies
    op.execute('DROP POLICY IF EXISTS patient_documents_isolation_policy ON patient_documents')
    op.execute('DROP POLICY IF EXISTS secondary_insurance_isolation_policy ON secondary_insurance')

    # Drop indexes
    op.drop_index('ix_patient_documents_patient_id')
    op.drop_index('ix_patient_documents_type')
    op.drop_index('ix_patient_documents_category')
    op.drop_index('ix_secondary_insurance_patient_id')
    op.drop_index('ix_secondary_insurance_provider')

    # Drop tables
    op.drop_table('patient_documents')
    op.drop_table('secondary_insurance')

    # Drop columns from patients table
    op.drop_column('patients', 'middle_name')
    op.drop_column('patients', 'gender')
    op.drop_column('patients', 'street_address')
    op.drop_column('patients', 'city')
    op.drop_column('patients', 'state')
    op.drop_column('patients', 'zip_code')
    op.drop_column('patients', 'id_type')
    op.drop_column('patients', 'skilled_nursing_facility')
    op.drop_column('patients', 'part_a_stay_coverage')
    op.drop_column('patients', 'primary_payer_phone')
    op.drop_column('patients', 'medical_notes') 