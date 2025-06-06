"""
Pydantic schemas for IVR form templates.
"""
from typing import Dict, Any, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, validator


class TemplateBase(BaseModel):
    """Base template schema."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    category: str = Field(..., min_length=1, max_length=100)
    template_data: Dict[str, Any] = Field(
        ..., description="Template form data"
    )


class TemplateCreate(TemplateBase):
    """Schema for creating a new template."""

    @validator('template_data')
    def validate_template_data(cls, v):
        """Validate template data structure."""
        if not isinstance(v, dict):
            raise ValueError('Template data must be a dictionary')

        # Ensure required fields exist
        required_fields = ['fields', 'metadata']
        for field in required_fields:
            if field not in v:
                raise ValueError(f'Template data must contain {field}')

        return v


class TemplateUpdate(BaseModel):
    """Schema for updating a template."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    template_data: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

    @validator('template_data')
    def validate_template_data(cls, v):
        """Validate template data structure if provided."""
        if v is not None:
            if not isinstance(v, dict):
                raise ValueError('Template data must be a dictionary')

            # Ensure required fields exist
            required_fields = ['fields', 'metadata']
            for field in required_fields:
                if field not in v:
                    raise ValueError(f'Template data must contain {field}')

        return v


class TemplateResponse(TemplateBase):
    """Schema for template response."""
    id: str
    is_active: bool
    is_system_template: bool
    usage_count: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by: str
    updated_by: Optional[str] = None

    class Config:
        from_attributes = True


class TemplateListResponse(BaseModel):
    """Schema for paginated template list response."""
    templates: List[TemplateResponse]
    total: int
    page: int
    size: int
    pages: int


class TemplateUsageResponse(BaseModel):
    """Schema for template usage response."""
    template: TemplateResponse
    usage_id: str
    used_at: datetime


class TemplateUsageCreate(BaseModel):
    """Schema for creating template usage record."""
    template_id: str
    context: Optional[Dict[str, Any]] = None


class TemplateUsageStats(BaseModel):
    """Schema for template usage statistics."""
    template_id: str
    template_name: str
    total_uses: int
    unique_users: int
    last_used: Optional[datetime] = None
    avg_completion_time: Optional[float] = None


class QuickTemplateData(BaseModel):
    """Schema for quick template data used in forms."""
    template_id: str
    name: str
    category: str
    description: Optional[str] = None
    form_data: Dict[str, Any]
    estimated_time_saved: Optional[int] = Field(
        None,
        description="Estimated time saved in seconds"
    )


class TemplateSearchRequest(BaseModel):
    """Schema for template search requests."""
    query: Optional[str] = None
    category: Optional[str] = None
    is_active: Optional[bool] = True
    is_system_template: Optional[bool] = None
    created_by: Optional[str] = None
    page: int = Field(1, ge=1)
    size: int = Field(20, ge=1, le=100)
    sort_by: Optional[str] = Field(
        "created_at",
        pattern="^(name|created_at|updated_at|usage_count)$"
    )
    sort_order: Optional[str] = Field("desc", pattern="^(asc|desc)$")


class TemplateValidationResult(BaseModel):
    """Schema for template validation results."""
    is_valid: bool
    errors: List[str] = []
    warnings: List[str] = []
    field_count: int = 0
    estimated_completion_time: Optional[int] = None


class TemplateDuplicationRequest(BaseModel):
    """Schema for template duplication requests."""
    source_template_id: str
    new_name: str = Field(..., min_length=1, max_length=255)
    new_description: Optional[str] = Field(None, max_length=1000)
    new_category: Optional[str] = None
    modifications: Optional[Dict[str, Any]] = None


class TemplateExportRequest(BaseModel):
    """Schema for template export requests."""
    template_ids: List[str] = Field(..., min_items=1)
    format: str = Field("json", pattern="^(json|csv|xlsx)$")
    include_usage_stats: bool = False


class TemplateImportRequest(BaseModel):
    """Schema for template import requests."""
    templates: List[TemplateCreate]
    overwrite_existing: bool = False
    validate_only: bool = False


class TemplateImportResult(BaseModel):
    """Schema for template import results."""
    imported_count: int
    skipped_count: int
    error_count: int
    errors: List[str] = []
    imported_template_ids: List[str] = []