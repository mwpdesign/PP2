"""IVR schemas for the application."""

from datetime import datetime
from typing import Optional, Dict, Any, List
from uuid import UUID
from pydantic import BaseModel, Field
from decimal import Decimal


class ProductSizeBase(BaseModel):
    """Base product size schema."""

    size: str = Field(..., description="Size code like '2X2', '2X3', etc.")
    dimensions: str = Field(..., description="Dimensions like '2x2 cm'")
    unit_price: Decimal = Field(..., ge=0, description="Unit price")
    quantity: int = Field(..., ge=1, description="Quantity ordered")
    total: Decimal = Field(..., ge=0, description="Total cost for this size")


class ProductSizeCreate(ProductSizeBase):
    """Create product size schema."""
    pass


class ProductSizeResponse(ProductSizeBase):
    """Response product size schema."""

    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        """Pydantic config."""
        from_attributes = True


class ProductSelectionBase(BaseModel):
    """Base product selection schema."""

    product_name: str = Field(..., description="Product name")
    q_code: str = Field(..., description="Q-code for the product")
    total_quantity: int = Field(
        ..., ge=0, description="Total quantity across all sizes"
    )
    total_cost: Decimal = Field(
        ..., ge=0, description="Total cost across all sizes"
    )


class ProductSelectionCreate(ProductSelectionBase):
    """Create product selection schema."""

    sizes: List[ProductSizeCreate] = Field(
        ..., description="List of size variants"
    )


class ProductSelectionResponse(ProductSelectionBase):
    """Response product selection schema."""

    id: UUID
    sizes: List[ProductSizeResponse] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    class Config:
        """Pydantic config."""
        from_attributes = True


class IVRRequestBase(BaseModel):
    """Base IVR request schema."""

    patient_id: UUID
    provider_id: UUID
    facility_id: UUID
    service_type: str
    priority: str
    request_metadata: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None


class IVRRequestCreate(IVRRequestBase):
    """Create IVR request schema."""

    selected_products: Optional[List[ProductSelectionCreate]] = Field(
        default_factory=list, description="Selected products with sizes"
    )


class IVRRequestResponse(IVRRequestBase):
    """Response IVR request schema."""

    id: UUID
    status: str
    products: List[ProductSelectionResponse] = Field(default_factory=list)

    # Simplified Communication Fields
    doctor_comment: Optional[str] = None
    ivr_response: Optional[str] = None
    comment_updated_at: Optional[datetime] = None

    created_at: datetime
    updated_at: datetime

    class Config:
        """Pydantic config."""
        from_attributes = True


class IVRSessionBase(BaseModel):
    """Base IVR session schema."""

    organization_id: UUID
    patient_id: Optional[UUID] = None
    provider_id: Optional[UUID] = None
    status: str
    session_type: str
    metadata: Dict = {}


class IVRSessionCreate(IVRSessionBase):
    """Create IVR session schema."""

    pass


class IVRSessionResponse(IVRSessionBase):
    """Response IVR session schema."""

    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        """Pydantic config."""

        from_attributes = True


class IVRSessionUpdate(BaseModel):
    """Update IVR session schema."""

    patient_id: Optional[UUID] = None
    provider_id: Optional[UUID] = None
    status: Optional[str] = None
    metadata: Optional[Dict] = None


class IVRDocumentBase(BaseModel):
    """Base IVR document schema."""

    ivr_request_id: UUID
    document_type: str
    document_key: str


class IVRDocumentCreate(IVRDocumentBase):
    """Create IVR document schema."""

    pass


class IVRDocumentResponse(IVRDocumentBase):
    """Response IVR document schema."""

    id: UUID
    created_at: datetime
    updated_at: datetime
    uploaded_by_id: UUID

    class Config:
        """Pydantic config."""

        from_attributes = True


class IVRScriptBase(BaseModel):
    """Base IVR script schema."""

    name: str
    content: str
    language: str
    organization_id: UUID
    script_metadata: Optional[Dict[str, Any]] = None


class IVRScriptCreate(IVRScriptBase):
    """Create IVR script schema."""

    pass


class IVRScriptUpdate(BaseModel):
    """Update IVR script schema."""

    name: Optional[str] = None
    content: Optional[str] = None
    language: Optional[str] = None
    script_metadata: Optional[Dict[str, Any]] = None
    audio_url: Optional[str] = None


class IVRScriptResponse(IVRScriptBase):
    """Response IVR script schema."""

    id: UUID
    audio_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    created_by: UUID
    updated_by: UUID

    class Config:
        """Pydantic config."""

        from_attributes = True


class IVRCallBase(BaseModel):
    """Base IVR call schema."""

    script_id: UUID
    phone_number: str
    organization_id: UUID
    call_metadata: Optional[Dict[str, Any]] = None


class IVRCallCreate(IVRCallBase):
    """Create IVR call schema."""

    pass


class IVRCallUpdate(BaseModel):
    """Update IVR call schema."""

    status: Optional[str] = None
    duration: Optional[int] = None
    recording_url: Optional[str] = None
    call_metadata: Optional[Dict[str, Any]] = None


class IVRCallResponse(IVRCallBase):
    """Response IVR call schema."""

    id: UUID
    status: str
    duration: Optional[int] = None
    recording_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    created_by: UUID
    updated_by: UUID

    class Config:
        """Pydantic config."""

        from_attributes = True


# Simplified Communication Schemas
class DoctorCommentUpdate(BaseModel):
    """Schema for updating doctor comment."""

    comment: str = Field(..., description="Doctor's comment or question")


class IVRResponseUpdate(BaseModel):
    """Schema for updating IVR specialist response."""

    response: str = Field(..., description="IVR specialist's response")
