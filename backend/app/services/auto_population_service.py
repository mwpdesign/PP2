"""Auto-population service for Healthcare IVR Platform."""

import json
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc, func

from app.models.auto_population import (
    AutoPopulationSource,
    AutoPopulationRecord,
    InsuranceDatabase,
    PatientHistoryCache,
)
from app.services.encryption_service import LocalEncryptionService


class AutoPopulationService:
    """Service for managing auto-population functionality."""

    def __init__(self, db: AsyncSession, current_user: dict):
        self.db = db
        self.current_user = current_user
        self.encryption_service = LocalEncryptionService()

    async def get_suggestions(
        self,
        patient_id: str,
        form_field: str,
        current_value: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get auto-population suggestions for a form field."""
        suggestions = []

        # Get active auto-population sources
        sources_query = select(AutoPopulationSource).where(
            AutoPopulationSource.is_active == True  # noqa: E712
        )
        result = await self.db.execute(sources_query)
        sources = result.scalars().all()

        for source in sources:
            try:
                if source.source_type == "insurance":
                    suggestion = await self._get_insurance_suggestion(
                        source, patient_id, form_field
                    )
                elif source.source_type == "patient_history":
                    suggestion = await self._get_history_suggestion(
                        source, patient_id, form_field
                    )
                elif source.source_type == "templates":
                    suggestion = await self._get_template_suggestion(
                        source, form_field
                    )
                else:
                    continue

                if suggestion and suggestion["confidence_score"] >= source.confidence_threshold:
                    # Record the suggestion
                    record_id = await self._record_suggestion(
                        source, patient_id, form_field, suggestion
                    )
                    suggestion["record_id"] = record_id
                    suggestions.append(suggestion)

            except Exception as e:
                # Log error but continue with other sources
                print(f"Error getting suggestion from {source.name}: {e}")
                continue

        # Sort by confidence score
        suggestions.sort(key=lambda x: x["confidence_score"], reverse=True)
        return suggestions[:5]  # Return top 5 suggestions

    async def _get_insurance_suggestion(
        self,
        source: AutoPopulationSource,
        patient_id: str,
        form_field: str
    ) -> Optional[Dict[str, Any]]:
        """Get suggestion from insurance database."""
        # Mock insurance lookup - in real implementation, this would
        # query external insurance APIs or databases
        insurance_data = {
            "coverage_type": "PPO",
            "copay": "$25",
            "deductible": "$1000",
            "prior_auth_required": False
        }

        if form_field in insurance_data:
            return {
                "suggested_value": str(insurance_data[form_field]),
                "confidence_score": 0.9,
                "source_name": source.name,
                "population_method": "insurance_lookup",
                "source_reference": f"insurance_db_{source.provider}"
            }
        return None

    async def _get_history_suggestion(
        self,
        source: AutoPopulationSource,
        patient_id: str,
        form_field: str
    ) -> Optional[Dict[str, Any]]:
        """Get suggestion from patient history cache."""
        cache_query = select(PatientHistoryCache).where(
            PatientHistoryCache.patient_id == patient_id
        )
        result = await self.db.execute(cache_query)
        cache = result.scalar_one_or_none()

        if not cache:
            return None

        # Decrypt and parse cached data
        try:
            if form_field == "medical_conditions" and cache.medical_conditions:
                decrypted = self.encryption_service.decrypt(
                    cache.medical_conditions
                )
                conditions = json.loads(decrypted)
                if conditions:
                    return {
                        "suggested_value": ", ".join(conditions[:3]),
                        "confidence_score": 0.85,
                        "source_name": source.name,
                        "population_method": "history_match",
                        "source_reference": f"patient_cache_{patient_id}"
                    }
        except Exception:
            pass

        return None

    async def _get_template_suggestion(
        self,
        source: AutoPopulationSource,
        form_field: str
    ) -> Optional[Dict[str, Any]]:
        """Get suggestion from wound care templates."""
        # Mock template suggestion - in real implementation, this would
        # analyze form context and suggest from appropriate templates
        template_suggestions = {
            "wound_type": "Diabetic foot ulcer",
            "location": "Plantar surface, great toe",
            "treatment": "Debridement, antimicrobial dressing",
            "frequency": "Every 3 days"
        }

        if form_field in template_suggestions:
            return {
                "suggested_value": template_suggestions[form_field],
                "confidence_score": 0.75,
                "source_name": source.name,
                "population_method": "template_match",
                "source_reference": "wound_care_template_diabetic"
            }
        return None

    async def _record_suggestion(
        self,
        source: AutoPopulationSource,
        patient_id: str,
        form_field: str,
        suggestion: Dict[str, Any]
    ) -> int:
        """Record an auto-population suggestion."""
        # Encrypt sensitive data
        encrypted_value = self.encryption_service.encrypt(
            suggestion["suggested_value"]
        )

        record = AutoPopulationRecord(
            source_id=source.id,
            user_id=self.current_user["id"],
            patient_id=patient_id,
            form_field=form_field,
            suggested_value=encrypted_value,
            confidence_score=suggestion["confidence_score"],
            population_method=suggestion["population_method"],
            source_reference=suggestion.get("source_reference"),
            processing_time_ms=suggestion.get("processing_time_ms", 100)
        )

        self.db.add(record)
        await self.db.commit()
        await self.db.refresh(record)

        return record.id

    async def accept_suggestion(
        self,
        record_id: int,
        final_value: str
    ) -> bool:
        """Accept an auto-population suggestion."""
        record = await self.db.get(AutoPopulationRecord, record_id)
        if not record or record.user_id != self.current_user["id"]:
            return False

        # Encrypt final value
        encrypted_final = self.encryption_service.encrypt(final_value)

        record.was_accepted = True
        record.final_value = encrypted_final

        await self.db.commit()
        return True

    async def reject_suggestion(
        self,
        record_id: int,
        reason: Optional[str] = None
    ) -> bool:
        """Reject an auto-population suggestion."""
        record = await self.db.get(AutoPopulationRecord, record_id)
        if not record or record.user_id != self.current_user["id"]:
            return False

        record.was_accepted = False
        if reason:
            record.source_reference = f"rejected: {reason}"

        await self.db.commit()
        return True

    async def refresh_patient_cache(self, patient_id: str) -> bool:
        """Refresh cached patient data."""
        # Mock cache refresh - in real implementation, this would
        # fetch fresh data from EHR systems
        mock_data = {
            "medical_conditions": ["Diabetes mellitus type 2", "Hypertension"],
            "medications": ["Metformin 500mg", "Lisinopril 10mg"],
            "allergies": ["Penicillin"],
            "insurance_info": {"provider": "Blue Cross", "member_id": "123456"}
        }

        # Encrypt sensitive data
        encrypted_conditions = self.encryption_service.encrypt(
            json.dumps(mock_data["medical_conditions"])
        )
        encrypted_medications = self.encryption_service.encrypt(
            json.dumps(mock_data["medications"])
        )
        encrypted_allergies = self.encryption_service.encrypt(
            json.dumps(mock_data["allergies"])
        )
        encrypted_insurance = self.encryption_service.encrypt(
            json.dumps(mock_data["insurance_info"])
        )

        # Update or create cache
        cache_query = select(PatientHistoryCache).where(
            PatientHistoryCache.patient_id == patient_id
        )
        result = await self.db.execute(cache_query)
        cache = result.scalar_one_or_none()

        if cache:
            cache.medical_conditions = encrypted_conditions
            cache.medications = encrypted_medications
            cache.allergies = encrypted_allergies
            cache.insurance_info = encrypted_insurance
            cache.updated_at = datetime.utcnow()
        else:
            cache = PatientHistoryCache(
                patient_id=patient_id,
                medical_conditions=encrypted_conditions,
                medications=encrypted_medications,
                allergies=encrypted_allergies,
                insurance_info=encrypted_insurance
            )
            self.db.add(cache)

        await self.db.commit()
        return True

    async def get_analytics(
        self,
        user_id: str,
        days: int = 30
    ) -> Dict[str, Any]:
        """Get auto-population usage analytics."""
        start_date = datetime.utcnow() - timedelta(days=days)

        # Get usage statistics
        usage_query = select(
            func.count(AutoPopulationRecord.id).label("total_suggestions"),
            func.sum(
                func.case(
                    (AutoPopulationRecord.was_accepted == True, 1),  # noqa: E712
                    else_=0
                )
            ).label("accepted_suggestions"),
            func.avg(AutoPopulationRecord.confidence_score).label("avg_confidence"),
            func.avg(AutoPopulationRecord.processing_time_ms).label("avg_processing_time")
        ).where(
            and_(
                AutoPopulationRecord.user_id == user_id,
                AutoPopulationRecord.timestamp >= start_date
            )
        )

        result = await self.db.execute(usage_query)
        stats = result.first()

        total = stats.total_suggestions or 0
        accepted = stats.accepted_suggestions or 0
        acceptance_rate = (accepted / total * 100) if total > 0 else 0

        return {
            "total_suggestions": total,
            "accepted_suggestions": accepted,
            "acceptance_rate": round(acceptance_rate, 2),
            "average_confidence": round(stats.avg_confidence or 0, 3),
            "average_processing_time_ms": round(stats.avg_processing_time or 0, 2),
            "period_days": days
        }

    async def decrypt_record_data(
        self,
        record_dict: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Decrypt sensitive data in a record dictionary."""
        try:
            if record_dict.get("suggestedValue"):
                record_dict["suggestedValue"] = self.encryption_service.decrypt(
                    record_dict["suggestedValue"]
                )
            if record_dict.get("finalValue"):
                record_dict["finalValue"] = self.encryption_service.decrypt(
                    record_dict["finalValue"]
                )
        except Exception:
            # If decryption fails, leave encrypted
            pass
        return record_dict

    async def decrypt_cache_data(
        self,
        cache_dict: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Decrypt sensitive data in a cache dictionary."""
        try:
            for field in ["medicalConditions", "medications", "allergies", "insuranceInfo"]:
                if cache_dict.get(field):
                    decrypted = self.encryption_service.decrypt(cache_dict[field])
                    cache_dict[field] = json.loads(decrypted)
        except Exception:
            # If decryption fails, leave encrypted
            pass
        return cache_dict

    def get_current_timestamp(self) -> str:
        """Get current timestamp in ISO format."""
        return datetime.utcnow().isoformat()