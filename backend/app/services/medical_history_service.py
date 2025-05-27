"""
Medical history service for managing patient medical records.
Implements HIPAA-compliant data handling with encryption.
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

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
from app.core.audit import log_phi_access


class MedicalHistoryService:
    """Service for managing patient medical history."""

    def __init__(
        self,
        db: AsyncSession,
        current_user: Dict[str, Any]
    ):
        """Initialize the service."""
        self.db = db
        self.current_user = current_user
        self.settings = get_settings()

    async def _log_phi_access(
        self,
        action: str,
        details: Dict[str, Any]
    ) -> None:
        """Log PHI access."""
        await log_phi_access(
            self.db,
            {
                'action': action,
                'details': details,
                'user_id': self.current_user["id"],
                'timestamp': datetime.utcnow().isoformat()
            }
        )

    async def create_medical_record(
        self,
        record: MedicalRecordCreate
    ) -> MedicalRecordResponse:
        """Create a new medical record with encryption."""
        # Verify patient exists and access permissions
        patient = await self.db.get(Patient, record.patient_id)
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
                'user_id': self.current_user["id"],
                'territory_id': record.territory_id,
                'record_type': record.record_type
            }
        )

        # Create medical record
        db_record = MedicalRecord(**encrypted_data)
        db_record.created_by = self.current_user["id"]
        db_record.updated_by = self.current_user["id"]
        self.db.add(db_record)
        await self.db.commit()
        await self.db.refresh(db_record)

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
        db_record = await self.db.get(MedicalRecord, record_id)
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
                    'user_id': self.current_user["id"],
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

        db_record.updated_by = self.current_user["id"]
        db_record.updated_at = datetime.utcnow()
        await self.db.commit()
        await self.db.refresh(db_record)

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
        record = await self.db.get(MedicalRecord, record_id)
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
        query = select(MedicalRecord).where(
            MedicalRecord.patient_id == search.patient_id
        )

        # Apply filters
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
        result = await self.db.execute(query.offset(search.skip).limit(search.limit))
        records = result.scalars().all()

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
        record = await self.db.get(MedicalRecord, condition.medical_record_id)
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
                'user_id': self.current_user["id"],
                'territory_id': condition.territory_id,
                'record_type': 'condition'
            }
        )

        # Create condition
        db_condition = MedicalCondition(**encrypted_data)
        db_condition.created_by = self.current_user["id"]
        db_condition.updated_by = self.current_user["id"]
        self.db.add(db_condition)
        await self.db.commit()
        await self.db.refresh(db_condition)

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
        record = await self.db.get(MedicalRecord, medication.medical_record_id)
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
                'user_id': self.current_user["id"],
                'territory_id': medication.territory_id,
                'record_type': 'medication'
            }
        )

        # Create medication
        db_medication = Medication(**encrypted_data)
        db_medication.created_by = self.current_user["id"]
        db_medication.updated_by = self.current_user["id"]
        self.db.add(db_medication)
        await self.db.commit()
        await self.db.refresh(db_medication)

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
        record = await self.db.get(MedicalRecord, allergy.medical_record_id)
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
                'user_id': self.current_user["id"],
                'territory_id': allergy.territory_id,
                'record_type': 'allergy'
            }
        )

        # Create allergy
        db_allergy = Allergy(**encrypted_data)
        db_allergy.created_by = self.current_user["id"]
        db_allergy.updated_by = self.current_user["id"]
        self.db.add(db_allergy)
        await self.db.commit()
        await self.db.refresh(db_allergy)

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
        patient = await self.db.get(Patient, patient_id)
        if not patient:
            raise ValueError("Patient not found")

        # Verify access permissions
        if not self.current_user.has_permission(
            'read_medical_history',
            patient.territory_id
        ):
            raise ValueError("Not authorized to access medical history")

        # Build queries
        record_query = select(MedicalRecord).where(
            MedicalRecord.patient_id == patient_id
        )
        condition_query = select(MedicalCondition).where(
            MedicalCondition.patient_id == patient_id
        )
        medication_query = select(Medication).where(
            Medication.patient_id == patient_id
        )
        allergy_query = select(Allergy).where(
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
        result = await self.db.execute(record_query.offset(0).limit(100))
        records = result.scalars().all()

        result = await self.db.execute(condition_query.offset(0).limit(100))
        conditions = result.scalars().all()

        result = await self.db.execute(medication_query.offset(0).limit(100))
        medications = result.scalars().all()

        result = await self.db.execute(allergy_query.offset(0).limit(100))
        allergies = result.scalars().all()

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

    async def create_medical_history(
        self,
        patient_id: UUID,
        data: Dict[str, Any]
    ) -> MedicalHistory:
        """Create a new medical history record."""
        # Log PHI access
        await self._log_phi_access(
            'create_medical_history',
            {
                'patient_id': str(patient_id),
                'user_id': self.current_user["id"],
                'timestamp': datetime.utcnow().isoformat()
            }
        )

        # Create record
        db_record = MedicalHistory(
            patient_id=patient_id,
            **data
        )
        db_record.created_by = self.current_user["id"]
        db_record.updated_by = self.current_user["id"]

        self.db.add(db_record)
        await self.db.commit()
        await self.db.refresh(db_record)

        return db_record

    async def update_medical_history(
        self,
        record_id: UUID,
        data: Dict[str, Any]
    ) -> Optional[MedicalHistory]:
        """Update a medical history record."""
        # Log PHI access
        await self._log_phi_access(
            'update_medical_history',
            {
                'record_id': str(record_id),
                'user_id': self.current_user["id"],
                'timestamp': datetime.utcnow().isoformat()
            }
        )

        # Get record
        db_record = await self.db.get(MedicalHistory, record_id)
        if not db_record:
            return None

        # Update record
        for key, value in data.items():
            setattr(db_record, key, value)
        db_record.updated_by = self.current_user["id"]

        await self.db.commit()
        await self.db.refresh(db_record)

        return db_record

    async def get_medical_history(
        self,
        patient_id: UUID
    ) -> Dict[str, Any]:
        """Get complete medical history for a patient."""
        # Log PHI access
        await self._log_phi_access(
            'get_medical_history',
            {
                'patient_id': str(patient_id),
                'user_id': self.current_user["id"],
                'timestamp': datetime.utcnow().isoformat()
            }
        )

        # Get base history
        query = select(MedicalHistory).where(
            MedicalHistory.patient_id == patient_id
        )
        result = await self.db.execute(query)
        history = result.scalar_one_or_none()

        # Get conditions
        conditions_query = select(MedicalCondition).where(
            MedicalCondition.patient_id == patient_id
        )
        conditions_result = await self.db.execute(conditions_query)
        conditions = conditions_result.scalars().all()

        # Get medications
        medications_query = select(Medication).where(
            Medication.patient_id == patient_id
        )
        medications_result = await self.db.execute(medications_query)
        medications = medications_result.scalars().all()

        # Get allergies
        allergies_query = select(Allergy).where(
            Allergy.patient_id == patient_id
        )
        allergies_result = await self.db.execute(allergies_query)
        allergies = allergies_result.scalars().all()

        return {
            "history": history,
            "conditions": conditions,
            "medications": medications,
            "allergies": allergies
        }

    async def add_condition(
        self,
        patient_id: UUID,
        data: Dict[str, Any]
    ) -> MedicalCondition:
        """Add a medical condition."""
        # Log PHI access
        await self._log_phi_access(
            'add_condition',
            {
                'patient_id': str(patient_id),
                'user_id': self.current_user["id"],
                'timestamp': datetime.utcnow().isoformat()
            }
        )

        # Create condition
        db_condition = MedicalCondition(
            patient_id=patient_id,
            **data
        )
        db_condition.created_by = self.current_user["id"]
        db_condition.updated_by = self.current_user["id"]

        self.db.add(db_condition)
        await self.db.commit()
        await self.db.refresh(db_condition)

        return db_condition

    async def add_medication(
        self,
        patient_id: UUID,
        data: Dict[str, Any]
    ) -> Medication:
        """Add a medication."""
        # Log PHI access
        await self._log_phi_access(
            'add_medication',
            {
                'patient_id': str(patient_id),
                'user_id': self.current_user["id"],
                'timestamp': datetime.utcnow().isoformat()
            }
        )

        # Create medication
        db_medication = Medication(
            patient_id=patient_id,
            **data
        )
        db_medication.created_by = self.current_user["id"]
        db_medication.updated_by = self.current_user["id"]

        self.db.add(db_medication)
        await self.db.commit()
        await self.db.refresh(db_medication)

        return db_medication

    async def add_allergy(
        self,
        patient_id: UUID,
        data: Dict[str, Any]
    ) -> Allergy:
        """Add an allergy."""
        # Log PHI access
        await self._log_phi_access(
            'add_allergy',
            {
                'patient_id': str(patient_id),
                'user_id': self.current_user["id"],
                'timestamp': datetime.utcnow().isoformat()
            }
        )

        # Create allergy
        db_allergy = Allergy(
            patient_id=patient_id,
            **data
        )
        db_allergy.created_by = self.current_user["id"]
        db_allergy.updated_by = self.current_user["id"]

        self.db.add(db_allergy)
        await self.db.commit()
        await self.db.refresh(db_allergy)

        return db_allergy