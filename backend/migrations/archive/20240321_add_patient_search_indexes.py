"""Add patient search indexes.

Revision ID: 20240321_add_patient_search_indexes
Revises: 20240327_add_ivr_sessions
Create Date: 2024-03-21 10:00:00.000000

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = '20240321_add_patient_search_indexes'
down_revision = '20240327_add_ivr_sessions'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create GIN index for full-text search
    op.create_index(
        'ix_patients_search_vector',
        'patients',
        ['search_vector'],
        postgresql_using='gin'
    )
    
    # Create composite index for territory-based filtering
    op.create_index(
        'ix_patients_territory_org',
        'patients',
        ['territory_id', 'organization_id']
    )
    
    # Create index for status-based filtering
    op.create_index(
        'ix_patients_status',
        'patients',
        ['status']
    )
    
    # Create index for insurance verification filtering
    op.create_index(
        'ix_patients_insurance_verified',
        'patients',
        ['insurance_verified']
    )
    
    # Create index for last visit date range queries
    op.create_index(
        'ix_patients_last_visit_date',
        'patients',
        ['last_visit_date']
    )
    
    # Create index for consent status filtering
    op.create_index(
        'ix_patients_consent_status',
        'patients',
        ['consent_status']
    )
    
    # Create composite index for provider/facility filtering
    op.create_index(
        'ix_patients_provider_facility',
        'patients',
        ['provider_id', 'facility_id']
    )
    
    # Create index for medical record number (encrypted)
    op.create_index(
        'ix_patients_mrn_encrypted',
        'patients',
        ['medical_record_number_encrypted']
    )


def downgrade() -> None:
    # Drop all created indexes
    op.drop_index('ix_patients_search_vector', table_name='patients')
    op.drop_index('ix_patients_territory_org', table_name='patients')
    op.drop_index('ix_patients_status', table_name='patients')
    op.drop_index('ix_patients_insurance_verified', table_name='patients')
    op.drop_index('ix_patients_last_visit_date', table_name='patients')
    op.drop_index('ix_patients_consent_status', table_name='patients')
    op.drop_index('ix_patients_provider_facility', table_name='patients')
    op.drop_index('ix_patients_mrn_encrypted', table_name='patients') 