from typing import Dict
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.api.orders.insurance_service import InsuranceVerificationService
from app.services.order_status_service import OrderStatusService
from app.api.orders.order_schemas import (
    InsuranceVerificationRequest,
    InsuranceVerificationResponse,
    VerificationStatusResponse,
    OrderStatusUpdateRequest,
    OrderStatusResponse,
    OrderStatusHistoryResponse,
    BulkStatusUpdateRequest,
    BulkStatusUpdateResponse,
)

router = APIRouter()


@router.post(
    "/orders/{order_id}/verify-insurance",
    response_model=InsuranceVerificationResponse,
    tags=["orders"],
)
async def verify_insurance_coverage(
    order_id: int,
    verification_data: InsuranceVerificationRequest,
    db: Session = Depends(get_db),
    current_user: Dict = Depends(get_current_user),
):
    """
    Verify insurance coverage for an order
    """
    service = InsuranceVerificationService(db)
    result = await service.verify_insurance_coverage(
        order_id=order_id,
        patient_id=verification_data.patient_id,
        insurance_data=verification_data.insurance_data,
        user_id=current_user["id"],
    )
    return result


@router.get(
    "/orders/{order_id}/verification-status",
    response_model=VerificationStatusResponse,
    tags=["orders"],
)
async def get_verification_status(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: Dict = Depends(get_current_user),
):
    """
    Get the current insurance verification status for an order
    """
    service = InsuranceVerificationService(db)
    result = await service.get_verification_status(
        order_id=order_id, user_id=current_user["id"]
    )
    return result


@router.put(
    "/orders/{order_id}/status",
    response_model=OrderStatusResponse,
    tags=["orders"]
)
async def update_order_status(
    order_id: int,
    status_update: OrderStatusUpdateRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Dict = Depends(get_current_user),
):
    """
    Update the status of an order
    """
    # Prepare request metadata for HIPAA audit
    request_metadata = {
        "ip_address": request.client.host,
        "user_agent": request.headers.get("user-agent"),
        "request_id": request.headers.get("x-request-id"),
        "correlation_id": request.headers.get("x-correlation-id"),
        "session_id": request.headers.get("x-session-id"),
        "access_reason": "order_status_update",
        "access_location": request.headers.get("x-location"),
    }

    service = OrderStatusService(db)
    result = await service.update_status(
        order_id=order_id,
        new_status=status_update.status,
        user_id=current_user["id"],
        notes=status_update.notes,
        request_metadata=request_metadata,
    )
    return result


@router.get(
    "/orders/{order_id}/status-history",
    response_model=OrderStatusHistoryResponse,
    tags=["orders"],
)
async def get_order_status_history(
    order_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Dict = Depends(get_current_user),
):
    """
    Get the complete status history for an order
    """
    # Prepare request metadata for HIPAA audit
    request_metadata = {
        "ip_address": request.client.host,
        "user_agent": request.headers.get("user-agent"),
        "request_id": request.headers.get("x-request-id"),
        "correlation_id": request.headers.get("x-correlation-id"),
        "session_id": request.headers.get("x-session-id"),
        "access_reason": "view_status_history",
        "access_location": request.headers.get("x-location"),
    }

    service = OrderStatusService(db)
    result = await service.get_status_history(
        order_id=order_id,
        user_id=current_user["id"],
        request_metadata=request_metadata,
    )
    return {"history": result}


@router.post(
    "/orders/bulk-status-update",
    response_model=BulkStatusUpdateResponse,
    tags=["orders"],
)
async def bulk_update_order_status(
    update_data: BulkStatusUpdateRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Dict = Depends(get_current_user),
):
    """
    Update status for multiple orders at once
    """
    # Prepare request metadata for HIPAA audit
    request_metadata = {
        "ip_address": request.client.host,
        "user_agent": request.headers.get("user-agent"),
        "request_id": request.headers.get("x-request-id"),
        "correlation_id": request.headers.get("x-correlation-id"),
        "session_id": request.headers.get("x-session-id"),
        "access_reason": "bulk_status_update",
        "access_location": request.headers.get("x-location"),
    }

    service = OrderStatusService(db)
    result = await service.bulk_update_status(
        order_ids=update_data.order_ids,
        new_status=update_data.status,
        user_id=current_user["id"],
        notes=update_data.notes,
        request_metadata=request_metadata,
    )
    return result
