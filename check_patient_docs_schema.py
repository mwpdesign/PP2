#!/usr/bin/env python3
"""
Script to check patient_documents table schema and identify missing columns
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from sqlalchemy import inspect

def check_patient_documents_schema():
    """Check the current schema of patient_documents table"""
    try:
        # Get database connection
        from app.core.database import engine
        import asyncio

        async def inspect_schema():
            async with engine.begin() as conn:
                return await conn.run_sync(
                    lambda sync_conn: inspect(sync_conn)
                )

        # Run async inspection
        inspector = asyncio.run(inspect_schema())

        if 'patient_documents' not in inspector.get_table_names():
            print("❌ patient_documents table does not exist!")
            return

        columns = inspector.get_columns('patient_documents')
        print('Current patient_documents table columns:')
        for col in columns:
            nullable_str = "nullable" if col["nullable"] else "NOT NULL"
            print(f'  - {col["name"]}: {col["type"]} ({nullable_str})')

        print('\nChecking against PatientDocument model...')
        column_names = [col['name'] for col in columns]

        # Expected columns based on PatientDocument model
        expected_columns = {
            'id': 'Primary key',
            'patient_id': 'Foreign key to patients',
            'document_type': 'Type of document',
            'file_name': 'Original filename',
            'display_name': 'Display name for UI',
            's3_key': 'S3 object key',
            'file_size': 'File size in bytes',
            'content_type': 'MIME type',
            'upload_date': 'Upload timestamp',
            'uploaded_by': 'User who uploaded',
            'is_active': 'Soft delete flag'
        }

        missing_columns = []
        present_columns = []

        for col_name, description in expected_columns.items():
            if col_name in column_names:
                present_columns.append(f'✅ {col_name}: {description}')
            else:
                missing_columns.append(f'❌ {col_name}: {description}')

        print('\nColumn Status:')
        for col in present_columns:
            print(col)
        for col in missing_columns:
            print(col)

        if missing_columns:
            print(f'\n🔧 Need to add {len(missing_columns)} missing columns')
            return False
        else:
            print('\n✅ All required columns are present')
            return True

    except Exception as e:
        print(f"❌ Error checking schema: {e}")
        return False


if __name__ == "__main__":
    check_patient_documents_schema()