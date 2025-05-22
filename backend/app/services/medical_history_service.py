"""
Medical history service for managing patient medical records.
Implements HIPAA-compliant data handling with encryption.
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.core.config import get_settings
from app.core.security import get_current_user
from app.api.patients.models import (
    MedicalRecord, MedicalCondition, Medication, Allergy,
    Patient
)
from app.api.patients.schemas import (
    MedicalRecordCreate, MedicalRecordUpdate, MedicalRecordResponse,
    MedicalConditionCreate, MedicalConditionUpdate, MedicalConditionResponse,
    MedicationCreate, MedicationUpdate, MedicationResponse,
    AllergyCreate, AllergyUpdate, AllergyResponse,
    MedicalHistorySearch
)
from app.api.patients.encryption_service import PatientEncryptionService


class MedicalHistoryService:
    """Service for managing patient medical history."""

    def __init__(
        self,
        db: Session,
        current_user: Any,
        encryption_service: PatientEncryptionService
    ):
        """Initialize the service."""
        self.db = db
        self.current_user = current_user
        self.encryption_service = encryption_service
        self.settings = get_settings()

    async def create_medical_record(
        self,
        record: MedicalRecordCreate
    ) -> MedicalRecordResponse:
        """Create a new medical record with encryption."""
        # Verify patient exists and access permissions
        patient = self.db.query(Patient).filter(
            Patient.id == record.patient_id
        ).first()
        if not patient:
            raise ValueError("Patient not found")

        if not self.current_user.has_permission(
            'create_medical_record',
            record.territory_id
        ):
            raise ValueError("Not authorized to create medical records")

        # Encrypt sensitive data
        record_dict = record.dict()
        encrypted_data = await self.encryption_service.encrypt_medical_data(
            record_dict,
            {
                'user_id': self.current_user.id,
                'territory_id': record.territory_id,
                'record_type': record.record_type
            }
        )

        # Create medical record
        db_record = MedicalRecord(**encrypted_data)
        db_record.created_by = self.current_user.id
        db_record.updated_by = self.current_user.id
        self.db.add(db_record)
        self.db.commit()
        self.db.refresh(db_record)

        # Decrypt for response
        decrypted_data = await self.encryption_service.decrypt_medical_data(
            db_record.__dict__
        )
        return MedicalRecordResponse(**decrypted_data)

    async def update_medical_record(
        self,
        record_id: int,
        record: MedicalRecordUpdate
    ) -> MedicalRecordResponse:
        """Update a medical record with encryption."""
        # Get existing record
        db_record = self.db.query(MedicalRecord).filter(
            MedicalRecord.id == record_id
        ).first()
        if not db_record:
            raise ValueError("Medical record not found")

        # Verify access permissions
        if not self.current_user.has_permission(
            'update_medical_record',
            db_record.territory_id
        ):
            raise ValueError("Not authorized to update medical records")

        # Create new version
        old_version = db_record.version
        db_record.version = old_version + 1
        db_record.previous_version_id = record_id

        # Encrypt updated fields
        update_data = record.dict(exclude_unset=True)
        if any(field in self.encryption_service.encrypted_fields
               for field in update_data):
            encrypted_data = await self.encryption_service.encrypt_medical_data(
                update_data,
                {
                    'user_id': self.current_user.id,
                    'territory_id': db_record.territory_id,
                    'record_type': db_record.record_type
                }
            )
            for key, value in encrypted_data.items():
                setattr(db_record, key, value)

        # Update non-encrypted fields
        for key, value in update_data.items():
            if (key not in self.encryption_service.encrypted_fields
                    and value is not None):
                setattr(db_record, key, value)

        db_record.updated_by = self.current_user.id
        db_record.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(db_record)

        # Decrypt for response
        decrypted_data = await self.encryption_service.decrypt_medical_data(
            db_record.__dict__
        )
        return MedicalRecordResponse(**decrypted_data)

    async def get_medical_record(
        self,
        record_id: int
    ) -> MedicalRecordResponse:
        """Get a medical record with decryption."""
        # Get record
        record = self.db.query(MedicalRecord).filter(
            MedicalRecord.id == record_id
        ).first()
        if not record:
            raise ValueError("Medical record not found")

        # Verify access permissions
        if not self.current_user.has_permission(
            'read_medical_record',
            record.territory_id
        ):
            raise ValueError("Not authorized to access medical records")

        # Decrypt record data
        decrypted_data = await self.encryption_service.decrypt_medical_data(
            record.__dict__
        )
        return MedicalRecordResponse(**decrypted_data)

    async def search_medical_history(
        self,
        search: MedicalHistorySearch
    ) -> List[MedicalRecordResponse]:
        """Search medical history with filters."""
        # Build base query
        query = self.db.query(MedicalRecord)

        # Apply filters
        if search.patient_id:
            query = query.filter(MedicalRecord.patient_id == search.patient_id)
        if search.record_type:
            query = query.filter(MedicalRecord.record_type == search.record_type)
        if search.status:
            query = query.filter(MedicalRecord.status == search.status)
        if search.start_date:
            query = query.filter(MedicalRecord.record_date >= search.start_date)
        if search.end_date:
            query = query.filter(MedicalRecord.record_date <= search.end_date)
        if search.territory_id:
            query = query.filter(
                MedicalRecord.territory_id == search.territory_id
            )
        if search.organization_id:
            query = query.filter(
                MedicalRecord.organization_id == search.organization_id
            )
        if not search.include_archived:
            query = query.filter(MedicalRecord.status != 'archived')

        # Verify access permissions
        accessible_territories = self.current_user.get_accessible_territories()
        query = query.filter(
            MedicalRecord.territory_id.in_(accessible_territories)
        )

        # Apply pagination
        records = query.offset(search.skip).limit(search.limit).all()

        # Decrypt records
        decrypted_records = []
        for record in records:
            decrypted_data = await self.encryption_service.decrypt_medical_data(
                record.__dict__
            )
            decrypted_records.append(MedicalRecordResponse(**decrypted_data))

        return decrypted_records

    async def create_medical_condition(
        self,
        condition: MedicalConditionCreate
    ) -> MedicalConditionResponse:
        """Create a new medical condition with encryption."""
        # Verify record exists and access permissions
        record = self.db.query(MedicalRecord).filter(
            MedicalRecord.id == condition.medical_record_id
        ).first()
        if not record:
            raise ValueError("Medical record not found")

        if not self.current_user.has_permission(
            'create_medical_condition',
            condition.territory_id
        ):
            raise ValueError("Not authorized to create medical conditions")

        # Encrypt sensitive data
        condition_dict = condition.dict()
        encrypted_data = await self.encryption_service.encrypt_medical_data(
            condition_dict,
            {
                'user_id': self.current_user.id,
                'territory_id': condition.territory_id,
                'record_type': 'condition'
            }
        )

        # Create condition
        db_condition = MedicalCondition(**encrypted_data)
        db_condition.created_by = self.current_user.id
        db_condition.updated_by = self.current_user.id
        self.db.add(db_condition)
        self.db.commit()
        self.db.refresh(db_condition)

        # Decrypt for response
        decrypted_data = await self.encryption_service.decrypt_medical_data(
            db_condition.__dict__
        )
        return MedicalConditionResponse(**decrypted_data)

    async def create_medication(
        self,
        medication: MedicationCreate
    ) -> MedicationResponse:
        """Create a new medication with encryption."""
        # Verify record exists and access permissions
        record = self.db.query(MedicalRecord).filter(
            MedicalRecord.id == medication.medical_record_id
        ).first()
        if not record:
            raise ValueError("Medical record not found")

        if not self.current_user.has_permission(
            'create_medication',
            medication.territory_id
        ):
            raise ValueError("Not authorized to create medications")

        # Encrypt sensitive data
        medication_dict = medication.dict()
        encrypted_data = await self.encryption_service.encrypt_medical_data(
            medication_dict,
            {
                'user_id': self.current_user.id,
                'territory_id': medication.territory_id,
                'record_type': 'medication'
            }
        )

        # Create medication
        db_medication = Medication(**encrypted_data)
        db_medication.created_by = self.current_user.id
        db_medication.updated_by = self.current_user.id
        self.db.add(db_medication)
        self.db.commit()
        self.db.refresh(db_medication)

        # Decrypt for response
        decrypted_data = await self.encryption_service.decrypt_medical_data(
            db_medication.__dict__
        )
        return MedicationResponse(**decrypted_data)

    async def create_allergy(
        self,
        allergy: AllergyCreate
    ) -> AllergyResponse:
        """Create a new allergy with encryption."""
        # Verify record exists and access permissions
        record = self.db.query(MedicalRecord).filter(
            MedicalRecord.id == allergy.medical_record_id
        ).first()
        if not record:
            raise ValueError("Medical record not found")

        if not self.current_user.has_permission(
            'create_allergy',
            allergy.territory_id
        ):
            raise ValueError("Not authorized to create allergies")

        # Encrypt sensitive data
        allergy_dict = allergy.dict()
        encrypted_data = await self.encryption_service.encrypt_medical_data(
            allergy_dict,
            {
                'user_id': self.current_user.id,
                'territory_id': allergy.territory_id,
                'record_type': 'allergy'
            }
        )

        # Create allergy
        db_allergy = Allergy(**encrypted_data)
        db_allergy.created_by = self.current_user.id
        db_allergy.updated_by = self.current_user.id
        self.db.add(db_allergy)
        self.db.commit()
        self.db.refresh(db_allergy)

        # Decrypt for response
        decrypted_data = await self.encryption_service.decrypt_medical_data(
            db_allergy.__dict__
        )
        return AllergyResponse(**decrypted_data)

    async def get_patient_medical_history(
        self,
        patient_id: int,
        include_archived: bool = False
    ) -> Dict[str, Any]:
        """Get complete medical history for a patient."""
        # Get patient
        patient = self.db.query(Patient).filter(
            Patient.id == patient_id
        ).first()
        if not patient:
            raise ValueError("Patient not found")

        # Verify access permissions
        if not self.current_user.has_permission(
            'read_medical_history',
            patient.territory_id
        ):
            raise ValueError("Not authorized to access medical history")

        # Build queries
        record_query = self.db.query(MedicalRecord).filter(
            MedicalRecord.patient_id == patient_id
        )
        condition_query = self.db.query(MedicalCondition).filter(
            MedicalCondition.patient_id == patient_id
        )
        medication_query = self.db.query(Medication).filter(
            Medication.patient_id == patient_id
        )
        allergy_query = self.db.query(Allergy).filter(
            Allergy.patient_id == patient_id
        )

        # Filter archived records if needed
        if not include_archived:
            record_query = record_query.filter(
                MedicalRecord.status != 'archived'
            )
            condition_query = condition_query.filter(
                MedicalCondition.status != 'archived'
            )
            medication_query = medication_query.filter(
                Medication.status != 'archived'
            )
            allergy_query = allergy_query.filter(
                Allergy.status != 'archived'
            )

        # Get all records
        records = record_query.all()
        conditions = condition_query.all()
        medications = medication_query.all()
        allergies = allergy_query.all()

        # Decrypt all data
        decrypted_records = []
        for record in records:
            decrypted_data = await self.encryption_service.decrypt_medical_data(
                record.__dict__
            )
            decrypted_records.append(MedicalRecordResponse(**decrypted_data))

        decrypted_conditions = []
        for condition in conditions:
            decrypted_data = await self.encryption_service.decrypt_medical_data(
                condition.__dict__
            )
            decrypted_conditions.append(
                MedicalConditionResponse(**decrypted_data)
            )

        decrypted_medications = []
        for medication in medications:
            decrypted_data = await self.encryption_service.decrypt_medical_data(
                medication.__dict__
            )
            decrypted_medications.append(MedicationResponse(**decrypted_data))

        decrypted_allergies = []
        for allergy in allergies:
            decrypted_data = await self.encryption_service.decrypt_medical_data(
                allergy.__dict__
            )
            decrypted_allergies.append(AllergyResponse(**decrypted_data))

        return {
            'records': decrypted_records,
            'conditions': decrypted_conditions,
            'medications': decrypted_medications,
            'allergies': decrypted_allergies
        } 