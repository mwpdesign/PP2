"""
Treatment tracking schemas for API requests and responses.
"""

from datetime import date, datetime
from typing import List, Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field, validator


class TreatmentCreateRequest(BaseModel):
    """Schema for creating a new treatment record."""

    patient_id: UUID = Field(..., description="ID of the patient receiving treatment")
    order_id: UUID = Field(..., description="ID of the order containing the products used")
    product_id: str = Field(..., description="Product identifier (Q-code or SKU)")
    product_name: str = Field(..., description="Name of the product used")
    quantity_used: int = Field(..., gt=0, description="Quantity of product used (must be positive)")
    date_applied: date = Field(..., description="Date when treatment was applied")
    diagnosis: Optional[str] = Field(None, description="Patient diagnosis")
    procedure_performed: Optional[str] = Field(None, description="Procedure performed")
    wound_location: Optional[str] = Field(None, description="Location of wound/treatment area")
    doctor_notes: Optional[str] = Field(None, description="Doctor's notes about the treatment")

    @validator('date_applied')
    def validate_date_applied(cls, v):
        """Ensure date_applied is not in the future."""
        if v > date.today():
            raise ValueError('Treatment date cannot be in the future')
        return v

    @validator('product_id', 'product_name')
    def validate_required_strings(cls, v):
        """Ensure required string fields are not empty."""
        if not v or not v.strip():
            raise ValueError('Field cannot be empty')
        return v.strip()

    class Config:
        json_encoders = {
            datetime: lambda dt: dt.isoformat(),
            date: lambda d: d.isoformat(),
            UUID: str
        }
        schema_extra = {
            "example": {
                "patient_id": "123e4567-e89b-12d3-a456-426614174000",
                "order_id": "123e4567-e89b-12d3-a456-426614174001",
                "product_id": "Q4100",
                "product_name": "Skin Graft 2x2 inch",
                "quantity_used": 1,
                "date_applied": "2024-06-12",
                "diagnosis": "Chronic wound",
                "procedure_performed": "Skin graft application",
                "wound_location": "Left leg",
                "doctor_notes": "Patient responded well to treatment"
            }
        }


class TreatmentResponse(BaseModel):
    """Schema for treatment record response."""

    id: UUID = Field(..., description="Unique treatment record ID")
    patient_id: UUID = Field(..., description="ID of the patient")
    order_id: UUID = Field(..., description="ID of the order")
    recorded_by: UUID = Field(..., description="ID of the user who recorded the treatment")
    product_id: str = Field(..., description="Product identifier")
    product_name: str = Field(..., description="Name of the product used")
    quantity_used: int = Field(..., description="Quantity of product used")
    date_applied: date = Field(..., description="Date when treatment was applied")
    diagnosis: Optional[str] = Field(None, description="Patient diagnosis")
    procedure_performed: Optional[str] = Field(None, description="Procedure performed")
    wound_location: Optional[str] = Field(None, description="Location of wound/treatment area")
    doctor_notes: Optional[str] = Field(None, description="Doctor's notes")
    created_at: datetime = Field(..., description="When the record was created")
    updated_at: datetime = Field(..., description="When the record was last updated")
    age_in_days: int = Field(..., description="Days since treatment was applied")
    is_recent: bool = Field(..., description="Whether treatment was applied within last 7 days")

    # Related data (optional, loaded when requested)
    patient_name: Optional[str] = Field(None, description="Patient's full name")
    order_number: Optional[str] = Field(None, description="Order number")
    recorded_by_name: Optional[str] = Field(None, description="Name of user who recorded treatment")

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat(),
            date: lambda d: d.isoformat(),
            UUID: str
        }
        schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174002",
                "patient_id": "123e4567-e89b-12d3-a456-426614174000",
                "order_id": "123e4567-e89b-12d3-a456-426614174001",
                "recorded_by": "123e4567-e89b-12d3-a456-426614174003",
                "product_id": "Q4100",
                "product_name": "Skin Graft 2x2 inch",
                "quantity_used": 1,
                "date_applied": "2024-06-12",
                "diagnosis": "Chronic wound",
                "procedure_performed": "Skin graft application",
                "wound_location": "Left leg",
                "doctor_notes": "Patient responded well to treatment",
                "created_at": "2024-06-12T10:30:00Z",
                "updated_at": "2024-06-12T10:30:00Z",
                "age_in_days": 0,
                "is_recent": True,
                "patient_name": "John Smith",
                "order_number": "ORD-2024-001",
                "recorded_by_name": "Dr. Jane Doe"
            }
        }


class TreatmentListResponse(BaseModel):
    """Schema for paginated treatment list response."""

    total: int = Field(..., description="Total number of treatments")
    treatments: List[TreatmentResponse] = Field(..., description="List of treatments")
    limit: int = Field(..., description="Number of items per page")
    offset: int = Field(..., description="Number of items skipped")

    class Config:
        json_encoders = {
            datetime: lambda dt: dt.isoformat(),
            date: lambda d: d.isoformat(),
            UUID: str
        }


class InventoryProductSummary(BaseModel):
    """Schema for individual product inventory summary."""

    product_id: str = Field(..., description="Product identifier")
    product_name: str = Field(..., description="Product name")
    ordered_quantity: int = Field(..., description="Total quantity ordered")
    used_quantity: int = Field(..., description="Total quantity used in treatments")
    remaining_quantity: int = Field(..., description="Remaining quantity available")
    orders: List[Dict[str, Any]] = Field(..., description="List of orders containing this product")
    treatments: List[Dict[str, Any]] = Field(..., description="List of treatments using this product")

    class Config:
        json_encoders = {
            datetime: lambda dt: dt.isoformat(),
            date: lambda d: d.isoformat(),
            UUID: str
        }
        schema_extra = {
            "example": {
                "product_id": "Q4100",
                "product_name": "Skin Graft 2x2 inch",
                "ordered_quantity": 10,
                "used_quantity": 3,
                "remaining_quantity": 7,
                "orders": [
                    {
                        "order_id": "123e4567-e89b-12d3-a456-426614174001",
                        "order_number": "ORD-2024-001",
                        "quantity": 10,
                        "received_at": "2024-06-10T14:00:00Z"
                    }
                ],
                "treatments": [
                    {
                        "treatment_id": "123e4567-e89b-12d3-a456-426614174002",
                        "quantity_used": 1,
                        "date_applied": "2024-06-12",
                        "recorded_by": "Dr. Jane Doe"
                    }
                ]
            }
        }


class InventorySummaryResponse(BaseModel):
    """Schema for patient inventory summary response."""

    patient_id: str = Field(..., description="Patient ID")
    patient_name: str = Field(..., description="Patient's full name")
    total_products: int = Field(..., description="Total number of different products")
    products_with_remaining_inventory: int = Field(..., description="Number of products with remaining inventory")
    products: List[InventoryProductSummary] = Field(..., description="List of product inventory summaries")
    generated_at: str = Field(..., description="When this summary was generated")

    class Config:
        json_encoders = {
            datetime: lambda dt: dt.isoformat(),
            date: lambda d: d.isoformat(),
            UUID: str
        }
        schema_extra = {
            "example": {
                "patient_id": "123e4567-e89b-12d3-a456-426614174000",
                "patient_name": "John Smith",
                "total_products": 3,
                "products_with_remaining_inventory": 2,
                "products": [
                    {
                        "product_id": "Q4100",
                        "product_name": "Skin Graft 2x2 inch",
                        "ordered_quantity": 10,
                        "used_quantity": 3,
                        "remaining_quantity": 7,
                        "orders": [],
                        "treatments": []
                    }
                ],
                "generated_at": "2024-06-12T15:30:00Z"
            }
        }


class TreatmentErrorResponse(BaseModel):
    """Schema for treatment API error responses."""

    detail: str = Field(..., description="Error message")
    error_code: Optional[str] = Field(None, description="Specific error code")
    field_errors: Optional[Dict[str, List[str]]] = Field(None, description="Field-specific validation errors")

    class Config:
        schema_extra = {
            "example": {
                "detail": "Validation error",
                "error_code": "INVALID_QUANTITY",
                "field_errors": {
                    "quantity_used": ["Quantity used must be greater than 0"]
                }
            }
        }