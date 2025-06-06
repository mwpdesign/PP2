"""Add auto-population and voice transcription tables

Revision ID: 20250115_add_auto_population_voice_tables
Revises: 20250605_add_missing_patient_document_columns
Create Date: 2025-01-15 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'auto_pop_voice_2025'
down_revision = '923ab08accad'
branch_labels = None
depends_on = None


def upgrade():
    """Add auto-population and voice transcription tables."""

    # Create auto_population_sources table
    op.create_table(
        'auto_population_sources',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('source_type', sa.String(length=50), nullable=False),
        sa.Column('provider', sa.String(length=100), nullable=True),
        sa.Column('api_endpoint', sa.String(length=500), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('confidence_threshold', sa.Float(), nullable=False, default=0.8),
        sa.Column('requires_verification', sa.Boolean(), nullable=False, default=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('last_sync', sa.DateTime(), nullable=True),
        sa.Column('sync_frequency', sa.String(length=50), nullable=False, default='daily'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_auto_population_sources_id'), 'auto_population_sources', ['id'], unique=False)
    op.create_index(op.f('ix_auto_population_sources_name'), 'auto_population_sources', ['name'], unique=False)
    op.create_index(op.f('ix_auto_population_sources_source_type'), 'auto_population_sources', ['source_type'], unique=False)

    # Create auto_population_records table
    op.create_table(
        'auto_population_records',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('source_id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('patient_id', sa.String(), nullable=True),
        sa.Column('ivr_request_id', sa.String(), nullable=True),
        sa.Column('form_field', sa.String(length=100), nullable=False),
        sa.Column('suggested_value', sa.Text(), nullable=False),
        sa.Column('confidence_score', sa.Float(), nullable=False),
        sa.Column('was_accepted', sa.Boolean(), nullable=True),
        sa.Column('final_value', sa.Text(), nullable=True),
        sa.Column('population_method', sa.String(length=50), nullable=False),
        sa.Column('source_reference', sa.String(length=500), nullable=True),
        sa.Column('processing_time_ms', sa.Integer(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.Column('session_id', sa.String(), nullable=True),
        sa.Column('user_agent', sa.String(), nullable=True),
        sa.Column('ip_address', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['source_id'], ['auto_population_sources.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_auto_population_records_id'), 'auto_population_records', ['id'], unique=False)
    op.create_index(op.f('ix_auto_population_records_source_id'), 'auto_population_records', ['source_id'], unique=False)
    op.create_index(op.f('ix_auto_population_records_user_id'), 'auto_population_records', ['user_id'], unique=False)
    op.create_index(op.f('ix_auto_population_records_patient_id'), 'auto_population_records', ['patient_id'], unique=False)
    op.create_index(op.f('ix_auto_population_records_ivr_request_id'), 'auto_population_records', ['ivr_request_id'], unique=False)
    op.create_index(op.f('ix_auto_population_records_form_field'), 'auto_population_records', ['form_field'], unique=False)
    op.create_index(op.f('ix_auto_population_records_timestamp'), 'auto_population_records', ['timestamp'], unique=False)

    # Create insurance_databases table
    op.create_table(
        'insurance_databases',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('provider_name', sa.String(length=255), nullable=False),
        sa.Column('provider_code', sa.String(length=50), nullable=False),
        sa.Column('coverage_types', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('formulary_data', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('prior_auth_requirements', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('network_providers', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('coverage_areas', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('last_updated', sa.DateTime(), nullable=False),
        sa.Column('data_version', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('provider_code')
    )
    op.create_index(op.f('ix_insurance_databases_id'), 'insurance_databases', ['id'], unique=False)
    op.create_index(op.f('ix_insurance_databases_provider_name'), 'insurance_databases', ['provider_name'], unique=False)

    # Create patient_history_cache table
    op.create_table(
        'patient_history_cache',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.String(), nullable=False),
        sa.Column('medical_conditions', sa.Text(), nullable=True),
        sa.Column('medications', sa.Text(), nullable=True),
        sa.Column('allergies', sa.Text(), nullable=True),
        sa.Column('previous_treatments', sa.Text(), nullable=True),
        sa.Column('insurance_info', sa.Text(), nullable=True),
        sa.Column('cache_version', sa.String(length=50), nullable=False, default='1.0'),
        sa.Column('last_accessed', sa.DateTime(), nullable=False),
        sa.Column('access_count', sa.Integer(), nullable=False, default=0),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_patient_history_cache_id'), 'patient_history_cache', ['id'], unique=False)
    op.create_index(op.f('ix_patient_history_cache_patient_id'), 'patient_history_cache', ['patient_id'], unique=False)

    # Create voice_transcriptions table
    op.create_table(
        'voice_transcriptions',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('patient_id', sa.String(), nullable=True),
        sa.Column('ivr_request_id', sa.String(), nullable=True),
        sa.Column('form_field', sa.String(length=100), nullable=False),
        sa.Column('audio_duration_seconds', sa.Float(), nullable=False),
        sa.Column('audio_format', sa.String(length=20), nullable=False),
        sa.Column('audio_quality', sa.String(length=20), nullable=True),
        sa.Column('sample_rate', sa.Integer(), nullable=True),
        sa.Column('transcribed_text', sa.Text(), nullable=False),
        sa.Column('confidence_score', sa.Float(), nullable=False),
        sa.Column('language_detected', sa.String(length=10), nullable=True),
        sa.Column('transcription_service', sa.String(length=50), nullable=False),
        sa.Column('processing_time_ms', sa.Integer(), nullable=True),
        sa.Column('was_successful', sa.Boolean(), nullable=False, default=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('was_accepted', sa.Boolean(), nullable=True),
        sa.Column('final_text', sa.Text(), nullable=True),
        sa.Column('edit_distance', sa.Integer(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.Column('session_id', sa.String(), nullable=True),
        sa.Column('user_agent', sa.String(), nullable=True),
        sa.Column('ip_address', sa.String(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_voice_transcriptions_id'), 'voice_transcriptions', ['id'], unique=False)
    op.create_index(op.f('ix_voice_transcriptions_user_id'), 'voice_transcriptions', ['user_id'], unique=False)
    op.create_index(op.f('ix_voice_transcriptions_patient_id'), 'voice_transcriptions', ['patient_id'], unique=False)
    op.create_index(op.f('ix_voice_transcriptions_ivr_request_id'), 'voice_transcriptions', ['ivr_request_id'], unique=False)
    op.create_index(op.f('ix_voice_transcriptions_form_field'), 'voice_transcriptions', ['form_field'], unique=False)
    op.create_index(op.f('ix_voice_transcriptions_timestamp'), 'voice_transcriptions', ['timestamp'], unique=False)

    # Create voice_transcription_settings table
    op.create_table(
        'voice_transcription_settings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('is_enabled', sa.Boolean(), nullable=False, default=True),
        sa.Column('preferred_language', sa.String(length=10), nullable=False, default='en'),
        sa.Column('confidence_threshold', sa.Float(), nullable=False, default=0.8),
        sa.Column('auto_accept_high_confidence', sa.Boolean(), nullable=False, default=False),
        sa.Column('noise_reduction', sa.Boolean(), nullable=False, default=True),
        sa.Column('auto_punctuation', sa.Boolean(), nullable=False, default=True),
        sa.Column('speaker_adaptation', sa.Boolean(), nullable=False, default=True),
        sa.Column('store_audio', sa.Boolean(), nullable=False, default=False),
        sa.Column('audio_retention_days', sa.Integer(), nullable=False, default=30),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )
    op.create_index(op.f('ix_voice_transcription_settings_id'), 'voice_transcription_settings', ['id'], unique=False)
    op.create_index(op.f('ix_voice_transcription_settings_user_id'), 'voice_transcription_settings', ['user_id'], unique=False)

    # Create voice_transcription_analytics table
    op.create_table(
        'voice_transcription_analytics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('total_transcriptions', sa.Integer(), nullable=False, default=0),
        sa.Column('successful_transcriptions', sa.Integer(), nullable=False, default=0),
        sa.Column('total_audio_duration', sa.Float(), nullable=False, default=0.0),
        sa.Column('average_confidence', sa.Float(), nullable=True),
        sa.Column('average_processing_time', sa.Float(), nullable=True),
        sa.Column('acceptance_rate', sa.Float(), nullable=True),
        sa.Column('edit_frequency', sa.Float(), nullable=True),
        sa.Column('period_start', sa.DateTime(), nullable=False),
        sa.Column('period_end', sa.DateTime(), nullable=False),
        sa.Column('period_type', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_voice_transcription_analytics_id'), 'voice_transcription_analytics', ['id'], unique=False)
    op.create_index(op.f('ix_voice_transcription_analytics_user_id'), 'voice_transcription_analytics', ['user_id'], unique=False)
    op.create_index(op.f('ix_voice_transcription_analytics_period_start'), 'voice_transcription_analytics', ['period_start'], unique=False)
    op.create_index(op.f('ix_voice_transcription_analytics_period_end'), 'voice_transcription_analytics', ['period_end'], unique=False)


def downgrade():
    """Remove auto-population and voice transcription tables."""

    # Drop voice transcription tables
    op.drop_table('voice_transcription_analytics')
    op.drop_table('voice_transcription_settings')
    op.drop_table('voice_transcriptions')

    # Drop auto-population tables
    op.drop_table('patient_history_cache')
    op.drop_table('insurance_databases')
    op.drop_table('auto_population_records')
    op.drop_table('auto_population_sources')