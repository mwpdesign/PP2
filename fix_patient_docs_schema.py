#!/usr/bin/env python3
"""
Script to check and fix patient_documents table schema
"""

import sqlite3
import os

def get_db_path():
    """Get the database path"""
    db_path = os.path.join(
        os.path.dirname(__file__), 'backend', 'healthcare_ivr.db'
    )
    if not os.path.exists(db_path):
        # Try alternative path
        db_path = os.path.join(os.path.dirname(__file__), 'healthcare_ivr.db')
    return db_path

def check_and_fix_schema():
    """Check and fix the patient_documents table schema"""
    db_path = get_db_path()

    if not os.path.exists(db_path):
        print(f"❌ Database not found at {db_path}")
        return False

    print(f"📁 Using database: {db_path}")

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Check if patient_documents table exists
        cursor.execute("""
            SELECT name FROM sqlite_master
            WHERE type='table' AND name='patient_documents'
        """)

        if not cursor.fetchone():
            print("❌ patient_documents table does not exist!")
            conn.close()
            return False

        # Get current table schema
        cursor.execute("PRAGMA table_info(patient_documents)")
        columns = cursor.fetchall()

        print("Current patient_documents table columns:")
        current_columns = {}
        for col in columns:
            col_name = col[1]
            col_type = col[2]
            not_null = col[3]
            current_columns[col_name] = {
                'type': col_type,
                'not_null': not_null
            }
            nullable_str = "NOT NULL" if not_null else "nullable"
            print(f"  - {col_name}: {col_type} ({nullable_str})")

        # Define required columns
        required_columns = {
            'display_name': 'TEXT',
            's3_key': 'TEXT',
            'file_size': 'INTEGER',
            'content_type': 'TEXT'
        }

        # Check for missing columns
        missing_columns = []
        for col_name, col_type in required_columns.items():
            if col_name not in current_columns:
                missing_columns.append((col_name, col_type))

        if not missing_columns:
            print("✅ All required columns are present")
            conn.close()
            return True

        print(f"\n🔧 Found {len(missing_columns)} missing columns:")
        for col_name, col_type in missing_columns:
            print(f"  - {col_name}: {col_type}")

        # Add missing columns
        print("\n🔨 Adding missing columns...")
        for col_name, col_type in missing_columns:
            try:
                alter_sql = (
                    f"ALTER TABLE patient_documents ADD COLUMN "
                    f"{col_name} {col_type}"
                )
                print(f"  Executing: {alter_sql}")
                cursor.execute(alter_sql)
                print(f"  ✅ Added {col_name}")
            except sqlite3.Error as e:
                print(f"  ❌ Failed to add {col_name}: {e}")

        # Commit changes
        conn.commit()

        # Verify the changes
        cursor.execute("PRAGMA table_info(patient_documents)")
        updated_columns = cursor.fetchall()

        print("\n📋 Updated table schema:")
        for col in updated_columns:
            col_name = col[1]
            col_type = col[2]
            not_null = col[3]
            nullable_str = "NOT NULL" if not_null else "nullable"
            print(f"  - {col_name}: {col_type} ({nullable_str})")

        conn.close()
        print("\n✅ Schema update completed successfully!")
        return True

    except Exception as e:
        print(f"❌ Error: {e}")
        return False


if __name__ == "__main__":
    check_and_fix_schema()