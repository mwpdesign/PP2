"""
Treatment tracking API routes.

This module provides REST API endpoints for managing treatment records,
including creating treatments, retrieving treatment history, and
managing patient inventory.
"""

import logging
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.token import TokenData
from app.schemas.treatments import (
    TreatmentCreateRequest,
    TreatmentResponse,
    TreatmentListResponse,
    InventorySummaryResponse,
    TreatmentErrorResponse,
)
from app.api.treatments.service import TreatmentService
from app.api.treatments.models import TreatmentRecord
from app.core.exceptions import (
    NotFoundException,
    ValidationError,
    AuthorizationError,
)

# Set up logger
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()


def _build_treatment_response(treatment: TreatmentRecord) -> TreatmentResponse:
    """
    Build TreatmentResponse from TreatmentRecord model.

    Args:
        treatment: TreatmentRecord instance

    Returns:
        TreatmentResponse: Formatted response
    """
    # Get related data if available
    patient_name = None
    if hasattr(treatment, 'patient') and treatment.patient:
        patient_name = f"{treatment.patient.first_name} {treatment.patient.last_name}"

    order_number = None
    if hasattr(treatment, 'order') and treatment.order:
        order_number = treatment.order.order_number

    recorded_by_name = None
    if hasattr(treatment, 'recorded_by_user') and treatment.recorded_by_user:
        recorded_by_name = treatment.recorded_by_user.full_name

    return TreatmentResponse(
        id=treatment.id,
        patient_id=treatment.patient_id,
        order_id=treatment.order_id,
        recorded_by=treatment.recorded_by,
        product_id=treatment.product_id,
        product_name=treatment.product_name,
        quantity_used=treatment.quantity_used,
        date_applied=treatment.date_applied,
        diagnosis=treatment.diagnosis,
        procedure_performed=treatment.procedure_performed,
        wound_location=treatment.wound_location,
        doctor_notes=treatment.doctor_notes,
        created_at=treatment.created_at,
        updated_at=treatment.updated_at,
        age_in_days=treatment.age_in_days,
        is_recent=treatment.is_recent,
        patient_name=patient_name,
        order_number=order_number,
        recorded_by_name=recorded_by_name,
    )


@router.post(
    "",
    response_model=TreatmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new treatment record",
    description="Create a new treatment record for a patient using products from an order",
    responses={
        201: {"description": "Treatment record created successfully"},
        400: {"model": TreatmentErrorResponse, "description": "Validation error"},
        401: {"description": "Authentication required"},
        403: {"description": "Insufficient permissions"},
        404: {"model": TreatmentErrorResponse, "description": "Patient or order not found"},
        422: {"model": TreatmentErrorResponse, "description": "Invalid input data"},
    },
)
async def create_treatment(
    treatment_data: TreatmentCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
) -> TreatmentResponse:
    """Create a new treatment record."""
    logger.info(f"Creating treatment record for patient {treatment_data.patient_id}")

    try:
        # Initialize service
        service = TreatmentService(db)

        # Convert request to dict
        treatment_dict = treatment_data.dict()

        # Create treatment record
        treatment = service.create_treatment_record(
            user_id=current_user.id,
            patient_id=treatment_data.patient_id,
            order_id=treatment_data.order_id,
            treatment_data=treatment_dict,
        )

        # Commit transaction
        await db.commit()
        await db.refresh(treatment)

        logger.info(f"Treatment record created successfully: {treatment.id}")

        # Return response
        return _build_treatment_response(treatment)

    except ValidationError as e:
        await db.rollback()
        logger.error(f"Validation error creating treatment: {e.detail}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.detail,
        )
    except AuthorizationError as e:
        await db.rollback()
        logger.error(f"Authorization error creating treatment: {e.detail}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=e.detail,
        )
    except NotFoundException as e:
        await db.rollback()
        logger.error(f"Not found error creating treatment: {e.detail}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.detail,
        )
    except Exception as e:
        await db.rollback()
        logger.error(f"Unexpected error creating treatment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create treatment record",
        )


@router.get(
    "/patient/{patient_id}",
    response_model=TreatmentListResponse,
    summary="Get treatments for a patient",
    description="Retrieve all treatment records for a specific patient with pagination",
    responses={
        200: {"description": "Treatments retrieved successfully"},
        401: {"description": "Authentication required"},
        404: {"model": TreatmentErrorResponse, "description": "Patient not found"},
    },
)
async def get_treatments_by_patient(
    patient_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
    limit: int = Query(50, ge=1, le=100, description="Number of treatments to return"),
    offset: int = Query(0, ge=0, description="Number of treatments to skip"),
) -> TreatmentListResponse:
    """Get all treatment records for a specific patient."""
    logger.info(f"Retrieving treatments for patient {patient_id}")

    try:
        # Initialize service
        service = TreatmentService(db)

        # Get treatments
        treatments = service.get_treatments_by_patient(
            patient_id=patient_id,
            limit=limit,
            offset=offset,
        )

        # Get total count (for pagination)
        total_treatments = service.get_treatments_by_patient(patient_id=patient_id)
        total = len(total_treatments)

        # Build response
        treatment_responses = [
            _build_treatment_response(treatment) for treatment in treatments
        ]

        logger.info(f"Retrieved {len(treatments)} treatments for patient {patient_id}")

        return TreatmentListResponse(
            total=total,
            treatments=treatment_responses,
            limit=limit,
            offset=offset,
        )

    except NotFoundException as e:
        logger.error(f"Patient not found: {e.detail}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.detail,
        )
    except Exception as e:
        logger.error(f"Error retrieving treatments for patient {patient_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve treatments",
        )


@router.get(
    "/order/{order_id}",
    response_model=TreatmentListResponse,
    summary="Get treatments for an order",
    description="Retrieve all treatment records for a specific order with pagination",
    responses={
        200: {"description": "Treatments retrieved successfully"},
        401: {"description": "Authentication required"},
        404: {"model": TreatmentErrorResponse, "description": "Order not found"},
    },
)
async def get_treatments_by_order(
    order_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
    limit: int = Query(50, ge=1, le=100, description="Number of treatments to return"),
    offset: int = Query(0, ge=0, description="Number of treatments to skip"),
) -> TreatmentListResponse:
    """Get all treatment records for a specific order."""
    logger.info(f"Retrieving treatments for order {order_id}")

    try:
        # Initialize service
        service = TreatmentService(db)

        # Get treatments
        treatments = service.get_treatments_by_order(
            order_id=order_id,
            limit=limit,
            offset=offset,
        )

        # Get total count (for pagination)
        total_treatments = service.get_treatments_by_order(order_id=order_id)
        total = len(total_treatments)

        # Build response
        treatment_responses = [
            _build_treatment_response(treatment) for treatment in treatments
        ]

        logger.info(f"Retrieved {len(treatments)} treatments for order {order_id}")

        return TreatmentListResponse(
            total=total,
            treatments=treatment_responses,
            limit=limit,
            offset=offset,
        )

    except NotFoundException as e:
        logger.error(f"Order not found: {e.detail}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.detail,
        )
    except Exception as e:
        logger.error(f"Error retrieving treatments for order {order_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve treatments",
        )


@router.get(
    "/{treatment_id}",
    response_model=TreatmentResponse,
    summary="Get a specific treatment",
    description="Retrieve a specific treatment record by ID with related data",
    responses={
        200: {"description": "Treatment retrieved successfully"},
        401: {"description": "Authentication required"},
        404: {"model": TreatmentErrorResponse, "description": "Treatment not found"},
    },
)
async def get_treatment_by_id(
    treatment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
) -> TreatmentResponse:
    """Get a specific treatment record by ID."""
    logger.info(f"Retrieving treatment {treatment_id}")

    try:
        # Initialize service
        service = TreatmentService(db)

        # Get treatment
        treatment = service.get_treatment_by_id(treatment_id)

        logger.info(f"Retrieved treatment {treatment_id}")

        # Build and return response
        return _build_treatment_response(treatment)

    except NotFoundException as e:
        logger.error(f"Treatment not found: {e.detail}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.detail,
        )
    except Exception as e:
        logger.error(f"Error retrieving treatment {treatment_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve treatment",
        )


@router.get(
    "/patients/{patient_id}/inventory",
    response_model=InventorySummaryResponse,
    summary="Get patient inventory summary",
    description="Get comprehensive inventory summary for a patient showing products on hand",
    responses={
        200: {"description": "Inventory summary retrieved successfully"},
        401: {"description": "Authentication required"},
        404: {"model": TreatmentErrorResponse, "description": "Patient not found"},
    },
)
async def get_patient_inventory_summary(
    patient_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
) -> InventorySummaryResponse:
    """Get inventory summary for a patient."""
    logger.info(f"Retrieving inventory summary for patient {patient_id}")

    try:
        # Initialize service
        service = TreatmentService(db)

        # Get inventory summary
        inventory_data = service.get_patient_inventory_summary(patient_id)

        logger.info(f"Retrieved inventory summary for patient {patient_id}")

        # Return the inventory data (already in correct format)
        return InventorySummaryResponse(**inventory_data)

    except NotFoundException as e:
        logger.error(f"Patient not found: {e.detail}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.detail,
        )
    except Exception as e:
        logger.error(f"Error retrieving inventory for patient {patient_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve inventory summary",
        )