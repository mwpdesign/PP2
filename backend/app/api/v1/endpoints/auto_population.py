"""
Auto-population API endpoints for Healthcare IVR Platform

Provides REST API endpoints for managing auto-population data sources,
generating form suggestions, and tracking usage analytics.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.auto_population import (
    AutoPopulationSource,
    AutoPopulationRecord,
    InsuranceDatabase,
    PatientHistoryCache,
)
from app.services.auto_population_service import AutoPopulationService

router = APIRouter()


@router.get("/sources", response_model=List[dict])
async def get_auto_population_sources(
    source_type: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(True),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get available auto-population sources."""
    try:
        query = select(AutoPopulationSource)

        if source_type:
            query = query.where(
                AutoPopulationSource.source_type == source_type
            )
        if is_active is not None:
            query = query.where(AutoPopulationSource.is_active == is_active)

        result = await db.execute(query)
        sources = result.scalars().all()

        return [source.to_dict() for source in sources]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get auto-population sources: {str(e)}"
        )


@router.post("/suggest")
async def get_auto_population_suggestions(
    patient_id: str,
    form_field: str,
    current_value: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get auto-population suggestions for a form field."""
    try:
        auto_pop_service = AutoPopulationService(db, current_user)
        suggestions = await auto_pop_service.get_suggestions(
            patient_id=patient_id,
            form_field=form_field,
            current_value=current_value
        )

        return {
            "suggestions": suggestions,
            "patientId": patient_id,
            "formField": form_field,
            "timestamp": auto_pop_service.get_current_timestamp()
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get suggestions: {str(e)}"
        )


@router.post("/accept-suggestion")
async def accept_auto_population_suggestion(
    record_id: int,
    final_value: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Accept an auto-population suggestion."""
    try:
        auto_pop_service = AutoPopulationService(db, current_user)
        success = await auto_pop_service.accept_suggestion(
            record_id=record_id,
            final_value=final_value
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to accept suggestion"
            )

        return {
            "success": True,
            "recordId": record_id,
            "message": "Suggestion accepted successfully"
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to accept suggestion: {str(e)}"
        )


@router.post("/reject-suggestion")
async def reject_auto_population_suggestion(
    record_id: int,
    reason: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Reject an auto-population suggestion."""
    try:
        auto_pop_service = AutoPopulationService(db, current_user)
        success = await auto_pop_service.reject_suggestion(
            record_id=record_id,
            reason=reason
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to reject suggestion"
            )

        return {
            "success": True,
            "recordId": record_id,
            "message": "Suggestion rejected successfully"
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reject suggestion: {str(e)}"
        )


@router.get("/history")
async def get_auto_population_history(
    patient_id: Optional[str] = Query(None),
    form_field: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get auto-population history for a user."""
    try:
        query = select(AutoPopulationRecord).where(
            AutoPopulationRecord.user_id == current_user["id"]
        )

        if patient_id:
            query = query.where(AutoPopulationRecord.patient_id == patient_id)
        if form_field:
            query = query.where(AutoPopulationRecord.form_field == form_field)

        query = query.order_by(desc(AutoPopulationRecord.timestamp))
        query = query.offset(offset).limit(limit)

        result = await db.execute(query)
        records = result.scalars().all()

        # Decrypt sensitive data before returning
        auto_pop_service = AutoPopulationService(db, current_user)
        decrypted_records = []
        for record in records:
            record_dict = record.to_dict()
            record_dict = await auto_pop_service.decrypt_record_data(record_dict)
            decrypted_records.append(record_dict)

        return {
            "records": decrypted_records,
            "total": len(decrypted_records),
            "limit": limit,
            "offset": offset
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get auto-population history: {str(e)}"
        )


@router.get("/insurance-providers")
async def get_insurance_providers(
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(True),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get available insurance providers for auto-population."""
    try:
        query = select(InsuranceDatabase)

        if search:
            query = query.where(
                InsuranceDatabase.provider_name.ilike(f"%{search}%")
            )
        if is_active is not None:
            query = query.where(
                InsuranceDatabase.is_active == is_active
            )

        result = await db.execute(query)
        providers = result.scalars().all()

        return [provider.to_dict() for provider in providers]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get insurance providers: {str(e)}"
        )


@router.get("/patient-cache/{patient_id}")
async def get_patient_cache(
    patient_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get cached patient data for auto-population."""
    try:
        query = select(PatientHistoryCache).where(
            PatientHistoryCache.patient_id == patient_id
        )
        result = await db.execute(query)
        cache = result.scalar_one_or_none()

        if not cache:
            return {
                "patientId": patient_id,
                "cached": False,
                "message": "No cached data found for patient"
            }

        # Decrypt sensitive data before returning
        auto_pop_service = AutoPopulationService(db, current_user)
        cache_dict = cache.to_dict()
        cache_dict = await auto_pop_service.decrypt_cache_data(cache_dict)

        return {
            "patientId": patient_id,
            "cached": True,
            "data": cache_dict
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get patient cache: {str(e)}"
        )


@router.post("/refresh-cache/{patient_id}")
async def refresh_patient_cache(
    patient_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Refresh cached patient data for auto-population."""
    try:
        auto_pop_service = AutoPopulationService(db, current_user)
        success = await auto_pop_service.refresh_patient_cache(patient_id)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to refresh patient cache"
            )

        return {
            "success": True,
            "patientId": patient_id,
            "message": "Patient cache refreshed successfully"
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to refresh patient cache: {str(e)}"
        )


@router.get("/analytics")
async def get_auto_population_analytics(
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get auto-population usage analytics."""
    try:
        auto_pop_service = AutoPopulationService(db, current_user)
        analytics = await auto_pop_service.get_analytics(
            user_id=current_user["id"],
            days=days
        )

        return {
            "analytics": analytics,
            "period": f"Last {days} days",
            "userId": current_user["id"]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get analytics: {str(e)}"
        )