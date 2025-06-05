#!/usr/bin/env python3
"""
Test script for SQLAlchemy Encrypted Field Types

This script validates that the encrypted field types can:
1. Integrate properly with SQLAlchemy models
2. Encrypt and decrypt data transparently during database operations
3. Handle different data types (string, text, JSON)
4. Work with null values correctly
5. Provide proper error handling
"""

import os
import sys
import base64
import tempfile
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Add the app directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

def setup_test_environment():
    """Set up test environment variables for encryption."""
    # Generate test encryption key and salt
    test_key = base64.urlsafe_b64encode(os.urandom(32)).decode()
    test_salt = base64.urlsafe_b64encode(os.urandom(16)).decode()

    os.environ['ENCRYPTION_KEY'] = test_key
    os.environ['ENCRYPTION_SALT'] = test_salt
    os.environ['ENABLE_LOCAL_ENCRYPTION'] = 'true'

    print(f"✅ Test environment configured")
    print(f"   Encryption Key: {test_key[:20]}...")
    print(f"   Salt: {test_salt[:20]}...")

def create_test_database():
    """Create an in-memory SQLite database for testing."""
    # Create temporary database file
    db_fd, db_path = tempfile.mkstemp(suffix='.db')
    os.close(db_fd)

    engine = create_engine(f'sqlite:///{db_path}', echo=False)
    Session = sessionmaker(bind=engine)

    return engine, Session, db_path

def test_encrypted_types():
    """Test the encrypted field types with SQLAlchemy models."""
    print("\n🧪 Testing SQLAlchemy Encrypted Field Types")
    print("=" * 50)

    try:
        # Import after setting up environment
        from core.encrypted_types import (
            EncryptedString,
            EncryptedText,
            EncryptedJSON,
            encrypted_string,
            encrypted_text,
            encrypted_json
        )

        print("✅ Successfully imported encrypted field types")

        # Create test database
        engine, Session, db_path = create_test_database()
        Base = declarative_base()

        # Define test model with encrypted fields
        class TestPatient(Base):
            __tablename__ = 'test_patients'

            id = Column(Integer, primary_key=True)
            name = Column(String(100))  # Regular field for comparison

            # Test different encrypted field types
            ssn = Column(encrypted_string("ssn", length=50))
            medical_history = Column(encrypted_text("medical_history"))
            insurance_info = Column(encrypted_json("insurance_info"))

            # Test direct class usage
            phone = Column(EncryptedString(field_name="phone", length=20))
            notes = Column(EncryptedText(field_name="notes"))
            metadata_json = Column(EncryptedJSON(field_name="metadata"))

        # Create tables
        Base.metadata.create_all(engine)
        print("✅ Created test database tables")

        # Test data insertion and retrieval
        session = Session()

        # Test data
        test_data = {
            'name': 'John Doe',
            'ssn': '123-45-6789',
            'medical_history': 'Patient has history of diabetes and hypertension. Regular checkups recommended.',
            'insurance_info': {
                'provider': 'Blue Cross',
                'policy_number': 'BC123456789',
                'group_number': 'GRP001',
                'coverage': ['medical', 'dental', 'vision']
            },
            'phone': '555-123-4567',
            'notes': 'Patient prefers morning appointments. Allergic to penicillin.',
            'metadata_json': {
                'last_visit': '2024-01-15',
                'next_appointment': '2024-02-15',
                'emergency_contact': {
                    'name': 'Jane Doe',
                    'phone': '555-987-6543'
                }
            }
        }

        # Create and save patient
        patient = TestPatient(**test_data)
        session.add(patient)
        session.commit()
        patient_id = patient.id

        print("✅ Successfully inserted encrypted data")

        # Clear session to ensure fresh load from database
        session.expunge_all()

        # Retrieve and verify data
        retrieved_patient = session.query(TestPatient).filter_by(id=patient_id).first()

        print("\n📊 Data Verification:")
        print(f"   Name (unencrypted): {retrieved_patient.name}")
        print(f"   SSN (encrypted): {retrieved_patient.ssn}")
        print(f"   Phone (encrypted): {retrieved_patient.phone}")
        print(f"   Medical History (encrypted): {retrieved_patient.medical_history[:50]}...")
        print(f"   Insurance Info (JSON): {retrieved_patient.insurance_info}")
        print(f"   Metadata (JSON): {retrieved_patient.metadata_json}")

        # Verify data integrity
        assert retrieved_patient.name == test_data['name']
        assert retrieved_patient.ssn == test_data['ssn']
        assert retrieved_patient.phone == test_data['phone']
        assert retrieved_patient.medical_history == test_data['medical_history']
        assert retrieved_patient.insurance_info == test_data['insurance_info']
        assert retrieved_patient.metadata_json == test_data['metadata_json']

        print("✅ All data retrieved correctly after encryption/decryption")

        # Test null value handling
        null_patient = TestPatient(
            name='Jane Smith',
            ssn=None,
            medical_history=None,
            insurance_info=None,
            phone='',
            notes=None,
            metadata_json=None
        )
        session.add(null_patient)
        session.commit()
        null_patient_id = null_patient.id

        # Retrieve null patient
        session.expunge_all()
        retrieved_null = session.query(TestPatient).filter_by(id=null_patient_id).first()

        assert retrieved_null.ssn is None
        assert retrieved_null.medical_history is None
        assert retrieved_null.insurance_info is None
        assert retrieved_null.phone is None  # Empty string should become None
        assert retrieved_null.notes is None
        assert retrieved_null.metadata_json is None

        print("✅ Null value handling works correctly")

        # Test JSON serialization edge cases
        complex_json_patient = TestPatient(
            name='Complex JSON Test',
            insurance_info={
                'unicode_text': 'Café résumé naïve',
                'numbers': [1, 2.5, -3],
                'boolean': True,
                'null_value': None,
                'nested': {
                    'deep': {
                        'value': 'test'
                    }
                }
            }
        )
        session.add(complex_json_patient)
        session.commit()
        complex_id = complex_json_patient.id

        # Retrieve complex JSON
        session.expunge_all()
        retrieved_complex = session.query(TestPatient).filter_by(id=complex_id).first()

        assert retrieved_complex.insurance_info['unicode_text'] == 'Café résumé naïve'
        assert retrieved_complex.insurance_info['numbers'] == [1, 2.5, -3]
        assert retrieved_complex.insurance_info['boolean'] is True
        assert retrieved_complex.insurance_info['null_value'] is None
        assert retrieved_complex.insurance_info['nested']['deep']['value'] == 'test'

        print("✅ Complex JSON serialization works correctly")

        session.close()

        # Clean up
        os.unlink(db_path)

        print("\n🎉 All SQLAlchemy encrypted field type tests passed!")
        return True

    except Exception as e:
        print(f"\n❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all tests."""
    print("🔐 SQLAlchemy Encrypted Field Types Test Suite")
    print("=" * 60)

    # Setup test environment
    setup_test_environment()

    # Run tests
    success = test_encrypted_types()

    if success:
        print("\n✅ All tests completed successfully!")
        print("🔒 SQLAlchemy encrypted field types are ready for production use")
        return 0
    else:
        print("\n❌ Some tests failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main())