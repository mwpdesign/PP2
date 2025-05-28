"""IVR schemas for the application."""
from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel


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
    pass


class IVRRequestResponse(IVRRequestBase):
    """Response IVR request schema."""
    id: UUID
    status: str
    created_at: datetime
    updated_at: datetime
    created_by: UUID
    updated_by: UUID

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