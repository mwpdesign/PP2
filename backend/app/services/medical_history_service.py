"""
Medical history service for managing patient medical records.
Implements HIPAA-compliant data handling with encryption.
"""

from datetime import datetime
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import get_settings
from app.api.patients.models import (
    MedicalRecord,
    MedicalCondition,
    Medication,
    Allergy,
    Patient,
)
from app.api.patients.schemas import (
    MedicalRecordCreate,
    MedicalRecordUpdate,
    MedicalRecordResponse,
    MedicalConditionCreate,
    MedicalConditionResponse,
    MedicationCreate,
    MedicationResponse,
    AllergyCreate,
    AllergyResponse,
    MedicalHistorySearch,
)
from app.core.audit import log_phi_access


class MedicalHistoryService:
    """Service for managing patient medical history."""

    def __init__(self, db: AsyncSession, current_user: Dict[str, Any]):
        """Initialize the service."""
        self.db = db
        self.current_user = current_user
        self.settings = get_settings()

    async def _log_phi_access(
        self, action: str, details: Dict[str, Any]
    ) -> None:
        """Log PHI access."""
        await log_phi_access(
            self.db,
            {
                "action": action,
                "details": details,
                "user_id": self.current_user["id"],
                "timestamp": datetime.utcnow().isoformat(),
            },
        )

    async def create_medical_record(
        self, record: MedicalRecordCreate
    ) -> MedicalRecordResponse:
        """Create a new medical record with encryption."""
        # Verify patient exists and access permissions
        patient = await self.db.get(Patient, record.patient_id)
        if not patient:
            raise ValueError("Patient not found")

        if not self.current_user.has_permission(
            "create_medical_record", record.territory_id
        ):
            raise ValueError("Not authorized to create medical records")

        # Encrypt sensitive data
        record_dict = record.dict()
        encrypted_data = await self.encryption_service.encrypt_medical_data(
            record_dict,
            {
                "user_id": self.current_user["id"],
                "territory_id": record.territory_id,
                "record_type": record.record_type,
            },
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
        self, record_id: int, record: MedicalRecordUpdate
    ) -> MedicalRecordResponse:
        """Update a medical record with encryption."""
        # Get existing record
        db_record = await self.db.get(MedicalRecord, record_id)
        if not db_record:
            raise ValueError("Medical record not found")

        # Verify access permissions
        if not self.current_user.has_permission(
            "update_medical_record", db_record.territory_id
        ):
            raise ValueError("Not authorized to update medical records")

        # Create new version
        old_version = db_record.version
        db_record.version = old_version + 1
        db_record.previous_version_id = record_id

        # Encrypt updated fields
        update_data = record.dict(exclude_unset=True)
        encrypted_fields = getattr(
            self.encryption_service, 'encrypted_fields', []
        )
        if any(field in encrypted_fields for field in update_data):
            encrypt_data = await self.encryption_service.encrypt_medical_data(
                update_data,
                {
                    "user_id": self.current_user["id"],
                    "territory_id": db_record.territory_id,
                    "record_type": db_record.record_type,
                },
            )
            for key, value in encrypt_data.items():
                setattr(db_record, key, value)

        # Update non-encrypted fields
        for key, value in update_data.items():
            if key not in encrypted_fields and value is not None:
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
            "read_medical_record", record.territory_id
        ):
            raise ValueError("Not authorized to access medical records")

        # Decrypt record data
        decrypted_data = await self.encryption_service.decrypt_medical_data(
            record.__dict__
        )
        return MedicalRecordResponse(**decrypted_data)

    async def search_medical_history(
        self, search: MedicalHistorySearch
    ) -> List[MedicalRecordResponse]:
        """Search medical history with filters."""
        # Build base query
        query = select(MedicalRecord).where(
            MedicalRecord.patient_id == search.patient_id
        )

        # Apply filters
        if search.record_type:
            query = query.filter(
                MedicalRecord.record_type == search.record_type
            )
        if search.status:
            query = query.filter(MedicalRecord.status == search.status)
        if search.start_date:
            query = query.filter(
                MedicalRecord.record_date >= search.start_date
            )
        if search.end_date:
            query = query.filter(
                MedicalRecord.record_date <= search.end_date
            )
        if search.territory_id:
            query = query.filter(
                MedicalRecord.territory_id == search.territory_id
            )
        if search.organization_id:
            query = query.filter(
                MedicalRecord.organization_id == search.organization_id
            )
        if not search.include_archived:
            query = query.filter(MedicalRecord.is_archived.is_(False))

        # Execute query
        result = await self.db.execute(query)
        records = result.scalars().all()

        # Decrypt and return
        decrypted_records = []
        for record in records:
            decrypt_data = await self.encryption_service.decrypt_medical_data(
                record.__dict__
            )
            decrypted_records.append(MedicalRecordResponse(**decrypt_data))

        return decrypted_records

    async def create_medical_condition(
        self, condition: MedicalConditionCreate
    ) -> MedicalConditionResponse:
        """Create a new medical condition with encryption."""
        # Verify patient exists and access permissions
        patient = await self.db.get(Patient, condition.patient_id)
        if not patient:
            raise ValueError("Patient not found")

        if not self.current_user.has_permission(
            "create_medical_condition", condition.territory_id
        ):
            raise ValueError("Not authorized to create medical conditions")

        # Encrypt sensitive data
        condition_dict = condition.dict()
        encrypt_data = await self.encryption_service.encrypt_medical_data(
            condition_dict,
            {
                "user_id": self.current_user["id"],
                "territory_id": condition.territory_id,
                "record_type": "medical_condition",
            },
        )

        # Create medical condition
        db_condition = MedicalCondition(**encrypt_data)
        db_condition.created_by = self.current_user["id"]
        db_condition.updated_by = self.current_user["id"]
        self.db.add(db_condition)
        await self.db.commit()
        await self.db.refresh(db_condition)

        # Decrypt for response
        decrypt_data = await self.encryption_service.decrypt_medical_data(
            db_condition.__dict__
        )
        return MedicalConditionResponse(**decrypt_data)

    async def create_medication(
        self, medication: MedicationCreate
    ) -> MedicationResponse:
        """Create a new medication with encryption."""
        # Verify patient exists and access permissions
        patient = await self.db.get(Patient, medication.patient_id)
        if not patient:
            raise ValueError("Patient not found")

        if not self.current_user.has_permission(
            "create_medication", medication.territory_id
        ):
            raise ValueError("Not authorized to create medications")

        # Encrypt sensitive data
        medication_dict = medication.dict()
        encrypt_data = await self.encryption_service.encrypt_medical_data(
            medication_dict,
            {
                "user_id": self.current_user["id"],
                "territory_id": medication.territory_id,
                "record_type": "medication",
            },
        )

        # Create medication
        db_medication = Medication(**encrypt_data)
        db_medication.created_by = self.current_user["id"]
        db_medication.updated_by = self.current_user["id"]
        self.db.add(db_medication)
        await self.db.commit()
        await self.db.refresh(db_medication)

        # Decrypt for response
        decrypt_data = await self.encryption_service.decrypt_medical_data(
            db_medication.__dict__
        )
        return MedicationResponse(**decrypt_data)

    async def create_allergy(self, allergy: AllergyCreate) -> AllergyResponse:
        """Create a new allergy with encryption."""
        # Verify patient exists and access permissions
        patient = await self.db.get(Patient, allergy.patient_id)
        if not patient:
            raise ValueError("Patient not found")

        if not self.current_user.has_permission(
            "create_allergy", allergy.territory_id
        ):
            raise ValueError("Not authorized to create allergies")

        # Encrypt sensitive data
        allergy_dict = allergy.dict()
        encrypt_data = await self.encryption_service.encrypt_medical_data(
            allergy_dict,
            {
                "user_id": self.current_user["id"],
                "territory_id": allergy.territory_id,
                "record_type": "allergy",
            },
        )

        # Create allergy
        db_allergy = Allergy(**encrypt_data)
        db_allergy.created_by = self.current_user["id"]
        db_allergy.updated_by = self.current_user["id"]
        self.db.add(db_allergy)
        await self.db.commit()
        await self.db.refresh(db_allergy)

        # Decrypt for response
        decrypt_data = await self.encryption_service.decrypt_medical_data(
            db_allergy.__dict__
        )
        return AllergyResponse(**decrypt_data)

    async def get_patient_medical_history(
        self, patient_id: int, include_archived: bool = False
    ) -> Dict[str, Any]:
        """Get complete medical history for a patient."""
        # Log PHI access
        await self._log_phi_access(
            "get_patient_medical_history",
            {
                "patient_id": patient_id,
                "user_id": self.current_user["id"],
                "timestamp": datetime.utcnow().isoformat(),
            },
        )

        # Get medical records
        records_query = select(MedicalRecord).where(
            MedicalRecord.patient_id == patient_id
        )
        if not include_archived:
            records_query = records_query.filter(
                MedicalRecord.is_archived.is_(False)
            )
        records_result = await self.db.execute(records_query)
        records = records_result.scalars().all()

        # Get conditions
        conditions_query = select(MedicalCondition).where(
            MedicalCondition.patient_id == patient_id
        )
        if not include_archived:
            conditions_query = conditions_query.filter(
                MedicalCondition.is_archived.is_(False)
            )
        conditions_result = await self.db.execute(conditions_query)
        conditions = conditions_result.scalars().all()

        # Get medications
        medications_query = select(Medication).where(
            Medication.patient_id == patient_id
        )
        if not include_archived:
            medications_query = medications_query.filter(
                Medication.is_archived.is_(False)
            )
        medications_result = await self.db.execute(medications_query)
        medications = medications_result.scalars().all()

        # Get allergies
        allergies_query = select(Allergy).where(
            Allergy.patient_id == patient_id
        )
        if not include_archived:
            allergies_query = allergies_query.filter(
                Allergy.is_archived.is_(False)
            )
        allergies_result = await self.db.execute(allergies_query)
        allergies = allergies_result.scalars().all()

        # Decrypt all data
        decrypted_records = []
        for record in records:
            decrypt_data = await self.encryption_service.decrypt_medical_data(
                record.__dict__
            )
            decrypted_records.append(MedicalRecordResponse(**decrypt_data))

        decrypted_conditions = []
        for condition in conditions:
            decrypt_data = await self.encryption_service.decrypt_medical_data(
                condition.__dict__
            )
            decrypted_conditions.append(
                MedicalConditionResponse(**decrypt_data)
            )

        decrypted_medications = []
        for medication in medications:
            decrypt_data = await self.encryption_service.decrypt_medical_data(
                medication.__dict__
            )
            decrypted_medications.append(MedicationResponse(**decrypt_data))

        decrypted_allergies = []
        for allergy in allergies:
            decrypt_data = await self.encryption_service.decrypt_medical_data(
                allergy.__dict__
            )
            decrypted_allergies.append(AllergyResponse(**decrypt_data))

        return {
            "records": decrypted_records,
            "conditions": decrypted_conditions,
            "medications": decrypted_medications,
            "allergies": decrypted_allergies,
        }
