"""Create provider credentials table.

Revision ID: 20240320_001_6_create_provider_credentials
Revises: 20240320_001_5_create_medical_tables
Create Date: 2024-03-20 10:35:00.000000
"""
from datetime import datetime
import uuid

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic
revision = '20240320_001_6_create_provider_credentials'
down_revision = '20240320_001_5_create_medical_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create provider credentials table."""
    op.create_table(
        'provider_credentials',
        sa.Column(
            'id',
            UUID(as_uuid=True),
            primary_key=True,
            default=uuid.uuid4,
            nullable=False
        ),
        sa.Column(
            'provider_id',
            UUID(as_uuid=True),
            sa.ForeignKey('providers.id'),
            nullable=False
        ),
        sa.Column(
            'credential_type',
            sa.String(100),
            nullable=False,
            comment="License, Certificate, etc."
        ),
        sa.Column(
            'credential_number',
            sa.String(100),
            nullable=False,
            comment="ENCRYPTED"
        ),
        sa.Column(
            'issuing_authority',
            sa.String(255),
            nullable=False
        ),
        sa.Column(
            'issue_date',
            sa.DateTime(timezone=True),
            nullable=False
        ),
        sa.Column(
            'expiration_date',
            sa.DateTime(timezone=True),
            nullable=True
        ),
        sa.Column(
            'status',
            sa.String(20),
            nullable=False,
            default='active'
        ),
        sa.Column(
            'document_key',
            sa.String(255),
            nullable=False
        ),
        sa.Column(
            'encrypted_credential_number',
            sa.String(255),
            nullable=True
        ),
        sa.Column(
            'expiry_date',
            sa.DateTime(timezone=True),
            nullable=False
        ),
        sa.Column(
            'verification_status',
            sa.String(50),
            nullable=False,
            default='pending'
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
        )
    )

    # Create indexes
    op.create_index(
        'ix_provider_credentials_provider',
        'provider_credentials',
        ['provider_id']
    )
    op.create_index(
        'ix_provider_credentials_expiry',
        'provider_credentials',
        ['expiry_date']
    )


def downgrade() -> None:
    """Remove provider credentials table."""
    op.drop_index('ix_provider_credentials_expiry')
    op.drop_index('ix_provider_credentials_provider')
    op.drop_table('provider_credentials')
