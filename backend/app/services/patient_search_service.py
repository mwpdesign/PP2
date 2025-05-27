"""
Patient search service with HIPAA-compliant search functionality.
Implements secure search with encryption and audit logging.
"""
from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple
from sqlalchemy import or_, and_, func
from sqlalchemy.orm import Session
from sqlalchemy.sql import select

from app.core.config import get_settings
from app.api.patients.models import (
    Patient, PatientAuditLog, MedicalCondition, Medication
)
from app.api.patients.schemas import (
    PatientSearchRequest, PatientSearchResponse,
    AdvancedSearchFilters, BulkSearchRequest,
    PatientResponse
)
from app.api.patients.encryption_service import PatientEncryptionService


class PatientSearchService:
    """Service for HIPAA-compliant patient search operations."""

    def __init__(
        self,
        db: Session,
        encryption_service: PatientEncryptionService,
        current_user: Dict[str, Any]
    ):
        """Initialize the service."""
        self.db = db
        self.encryption_service = encryption_service
        self.current_user = current_user
        self.settings = get_settings()

    async def _log_search(
        self,
        search_type: str,
        search_params: Dict[str, Any],
        results_count: int
    ) -> None:
        """Log search operation for HIPAA compliance."""
        log = PatientAuditLog(
            user_id=self.current_user["id"],
            action_type=f"patient_search_{search_type}",
            action_details={
                "search_params": search_params,
                "results_count": results_count,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        self.db.add(log)
        await self.db.commit()

    async def _build_base_query(
        self,
        search_request: PatientSearchRequest
    ) -> Any:
        """Build base query with territory and access control filters."""
        query = select(Patient)

        # Territory-based access control
        if self.current_user.get("primary_territory_id"):
            query = query.filter(
                Patient.territory_id == self.current_user["primary_territory_id"]
            )

        # Organization-based access control
        if self.current_user.get("organization_id"):
            query = query.filter(
                Patient.organization_id == self.current_user["organization_id"]
            )

        # Basic filters
        if search_request.status:
            query = query.filter(Patient.status == search_request.status)

        if search_request.insurance_verified is not None:
            query = query.filter(
                Patient.insurance_verified == search_request.insurance_verified
            )

        return query

    async def _apply_search_filters(
        self,
        query: Any,
        search_request: PatientSearchRequest
    ) -> Any:
        """Apply search filters to query."""
        filters = []

        # Text search filters
        if search_request.query:
            filters.append(
                Patient.search_vector.op('@@')(
                    func.plainto_tsquery('english', search_request.query)
                )
            )

        # Encrypted field filters
        if search_request.first_name:
            encrypted_first_name = self.encryption_service.encrypt(
                search_request.first_name
            )
            filters.append(
                Patient.first_name_encrypted == encrypted_first_name
            )

        if search_request.last_name:
            encrypted_last_name = self.encryption_service.encrypt(
                search_request.last_name
            )
            filters.append(
                Patient.last_name_encrypted == encrypted_last_name
            )

        if search_request.medical_record_number:
            encrypted_mrn = self.encryption_service.encrypt(
                search_request.medical_record_number
            )
            filters.append(
                Patient.medical_record_number_encrypted == encrypted_mrn
            )

        # Apply all filters
        if filters:
            query = query.filter(or_(*filters))

        return query

    async def _apply_advanced_filters(
        self,
        query: Any,
        advanced_filters: AdvancedSearchFilters
    ) -> Any:
        """Apply advanced search filters."""
        if advanced_filters.age_range:
            min_age, max_age = advanced_filters.age_range
            min_date = datetime.utcnow() - timedelta(days=max_age * 365)
            max_date = datetime.utcnow() - timedelta(days=min_age * 365)
            query = query.filter(
                and_(
                    Patient.date_of_birth_encrypted >= min_date,
                    Patient.date_of_birth_encrypted <= max_date
                )
            )

        if advanced_filters.diagnosis_codes:
            query = query.join(MedicalCondition).filter(
                MedicalCondition.icd_code.in_(
                    advanced_filters.diagnosis_codes
                )
            )

        if advanced_filters.medication_codes:
            query = query.join(Medication).filter(
                Medication.code.in_(advanced_filters.medication_codes)
            )

        if advanced_filters.visit_dates:
            start_date, end_date = advanced_filters.visit_dates
            query = query.filter(
                and_(
                    Patient.last_visit_date >= start_date,
                    Patient.last_visit_date <= end_date
                )
            )

        if advanced_filters.last_visit_within_days:
            cutoff_date = datetime.utcnow() - timedelta(
                days=advanced_filters.last_visit_within_days
            )
            query = query.filter(Patient.last_visit_date >= cutoff_date)

        return query

    async def _apply_sorting_pagination(
        self,
        query: Any,
        sort_by: str,
        sort_order: str,
        skip: int,
        limit: int
    ) -> Tuple[Any, int]:
        """Apply sorting and pagination to query."""
        # Get total count before pagination
        total_count = await self.db.scalar(
            select(func.count()).select_from(query.subquery())
        )

        # Apply sorting
        if sort_order == 'desc':
            query = query.order_by(getattr(Patient, sort_by).desc())
        else:
            query = query.order_by(getattr(Patient, sort_by).asc())

        # Apply pagination
        query = query.offset(skip).limit(limit)

        return query, total_count

    async def search_patients(
        self,
        search_request: PatientSearchRequest
    ) -> PatientSearchResponse:
        """
        Perform basic patient search with HIPAA compliance.
        """
        try:
            # Build base query
            query = await self._build_base_query(search_request)

            # Apply search filters
            query = await self._apply_search_filters(query, search_request)

            # Apply sorting and pagination
            query, total_count = await self._apply_sorting_pagination(
                query,
                search_request.sort_by,
                search_request.sort_order,
                search_request.skip,
                search_request.limit
            )

            # Execute query
            results = await self.db.execute(query)
            patients = results.scalars().all()

            # Log search operation
            await self._log_search(
                "basic",
                search_request.dict(),
                len(patients)
            )

            # Decrypt patient data
            decrypted_patients = [
                await self.encryption_service.decrypt_patient(patient)
                for patient in patients
            ]

            return PatientSearchResponse(
                items=decrypted_patients,
                total=total_count,
                skip=search_request.skip,
                limit=search_request.limit
            )

        except Exception as e:
            # Log error without exposing PHI
            await self._log_search(
                "basic_error",
                {"error": str(e)},
                0
            )
            raise

    async def advanced_search(
        self,
        search_request: PatientSearchRequest,
        advanced_filters: AdvancedSearchFilters
    ) -> PatientSearchResponse:
        """
        Perform advanced patient search with additional filters.
        """
        try:
            # Build base query
            query = await self._build_base_query(search_request)

            # Apply basic search filters
            query = await self._apply_search_filters(query, search_request)

            # Apply advanced filters
            query = await self._apply_advanced_filters(
                query,
                advanced_filters
            )

            # Apply sorting and pagination
            query, total_count = await self._apply_sorting_pagination(
                query,
                search_request.sort_by,
                search_request.sort_order,
                search_request.skip,
                search_request.limit
            )

            # Execute query
            results = await self.db.execute(query)
            patients = results.scalars().all()

            # Log search operation
            await self._log_search(
                "advanced",
                {
                    **search_request.dict(),
                    **advanced_filters.dict()
                },
                len(patients)
            )

            # Decrypt patient data
            decrypted_patients = [
                await self.encryption_service.decrypt_patient(patient)
                for patient in patients
            ]

            return PatientSearchResponse(
                items=decrypted_patients,
                total=total_count,
                skip=search_request.skip,
                limit=search_request.limit
            )

        except Exception as e:
            # Log error without exposing PHI
            await self._log_search(
                "advanced_error",
                {"error": str(e)},
                0
            )
            raise

    async def bulk_search(
        self,
        bulk_request: BulkSearchRequest
    ) -> Dict[str, List[PatientResponse]]:
        """
        Perform bulk search for multiple search terms.
        """
        try:
            results = {}

            for search_id, search_params in bulk_request.searches.items():
                # Create search request
                search_request = PatientSearchRequest(**search_params)

                # Perform search
                search_results = await self.search_patients(search_request)

                # Store results
                results[search_id] = search_results.items

            # Log bulk search operation
            await self._log_search(
                "bulk",
                bulk_request.dict(),
                sum(len(items) for items in results.values())
            )

            return results

        except Exception as e:
            # Log error without exposing PHI
            await self._log_search(
                "bulk_error",
                {"error": str(e)},
                0
            )
            raise