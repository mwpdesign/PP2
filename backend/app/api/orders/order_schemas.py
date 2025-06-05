from typing import Dict, Optional, List
from datetime import datetime
from pydantic import BaseModel, Field


class InsuranceVerificationRequest(BaseModel):
    patient_id: int = Field(..., description="ID of the patient")
    insurance_data: Dict = Field(
        ..., description="Insurance information to verify")


class InsuranceVerificationResponse(BaseModel):
    verified: bool = Field(..., description="Whether insurance is verified")
    coverage_percent: float = Field(..., description="Coverage percentage")
    patient_responsibility: float = Field(
        ..., description="Patient's responsibility percentage"
    )
    authorization_code: str = Field(
        ...,
        description="Insurance authorization code"
    )
    verification_timestamp: datetime = Field(
        ..., description="When verification was performed"
    )
    verified_by: int = Field(..., description="ID of user who verified")


class VerificationStatusResponse(BaseModel):
    status: str = Field(..., description="Current verification status")
    last_verified_at: Optional[datetime] = Field(
        None, description="When last verification was performed"
    )
    verified_by: Optional[int] = Field(
        None, description="ID of user who performed verification"
    )
    verification_data: Optional[Dict] = Field(
        None, description="Detailed verification information"
    )
    message: Optional[str] = Field(
        None,
        description="Additional status message"
    )


class OrderStatusUpdateRequest(BaseModel):
    status: str = Field(..., description="New status for the order")
    notes: Optional[str] = Field(
        None, description="Optional notes about the status change"
    )


class OrderStatusResponse(BaseModel):
    order_id: int = Field(..., description="ID of the order")
    status: str = Field(..., description="Current order status")
    timestamp: str = Field(..., description="When status was updated")
    updated_by: int = Field(..., description="ID of user who updated status")
    description: str = Field(..., description="Status description")


class StatusHistoryEntry(BaseModel):
    timestamp: str = Field(..., description="When status changed")
    previous_status: str = Field(..., description="Previous order status")
    new_status: str = Field(..., description="New order status")
    changed_by: int = Field(..., description="ID of user who changed status")
    notes: Optional[str] = Field(
        None,
        description="Notes about the status change"
    )
    description: str = Field(..., description="Status description")


class OrderStatusHistoryResponse(BaseModel):
    history: List[StatusHistoryEntry] = Field(
        ...,
        description="List of status changes"
    )


class BulkStatusUpdateRequest(BaseModel):
    order_ids: List[int] = Field(
        ...,
        description="List of order IDs to update"
    )
    status: str = Field(..., description="New status for all orders")
    notes: Optional[str] = Field(
        None, description="Optional notes about the status change"
    )


class BulkStatusUpdateResponse(BaseModel):
    successful: List[OrderStatusResponse] = Field(
        ..., description="Successfully updated orders"
    )
    failed: List[Dict] = Field(..., description="Orders that failed to update")
