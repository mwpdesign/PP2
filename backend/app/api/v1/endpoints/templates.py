"""
API endpoints for IVR form templates management.
"""
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_permissions
from app.models.templates import (
    WoundCareTemplate, TemplateUsageLog, DEFAULT_WOUND_CARE_TEMPLATES
)
from app.schemas.templates import (
    TemplateCreate,
    TemplateUpdate,
    TemplateResponse,
    TemplateUsageResponse,
    TemplateListResponse
)

router = APIRouter(prefix="/templates", tags=["templates"])


@router.get("/", response_model=TemplateListResponse)
async def list_templates(
    category: Optional[str] = None,
    is_active: Optional[bool] = True,
    page: int = 1,
    size: int = 20,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """List available IVR form templates."""
    try:
        query = db.query(WoundCareTemplate)

        if category:
            query = query.filter(WoundCareTemplate.category == category)
        if is_active is not None:
            query = query.filter(WoundCareTemplate.is_active == is_active)

        # Pagination
        offset = (page - 1) * size
        total = query.count()
        templates = query.offset(offset).limit(size).all()

        return TemplateListResponse(
            templates=[TemplateResponse.from_orm(t) for t in templates],
            total=total,
            page=page,
            size=size,
            pages=(total + size - 1) // size
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{template_id}", response_model=TemplateResponse)
async def get_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Get specific template details."""
    try:
        template = db.query(WoundCareTemplate).filter(
            WoundCareTemplate.id == template_id
        ).first()

        if not template:
            raise HTTPException(
                status_code=404,
                detail="Template not found"
            )

        return TemplateResponse.from_orm(template)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/", response_model=TemplateResponse, status_code=status.HTTP_201_CREATED)
@require_permissions(["template:create"])
async def create_template(
    template_data: TemplateCreate,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Create a new IVR form template."""
    try:
        # Create new template
        template = WoundCareTemplate(
            name=template_data.name,
            description=template_data.description,
            category=template_data.category,
            template_data=template_data.template_data,
            created_by=current_user["user_id"],
            is_system_template=False,  # User-created templates
            is_active=True
        )

        db.add(template)
        db.commit()
        db.refresh(template)

        return TemplateResponse.from_orm(template)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{template_id}", response_model=TemplateResponse)
@require_permissions(["template:update"])
async def update_template(
    template_id: str,
    template_data: TemplateUpdate,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Update an existing template."""
    try:
        template = db.query(WoundCareTemplate).filter(
            WoundCareTemplate.id == template_id
        ).first()

        if not template:
            raise HTTPException(
                status_code=404,
                detail="Template not found"
            )

        # Check if user can modify this template
        if (template.is_system_template and
                not current_user.get("is_admin", False)):
            raise HTTPException(
                status_code=403,
                detail="Cannot modify system templates"
            )

        # Update fields
        for field, value in template_data.dict(exclude_unset=True).items():
            setattr(template, field, value)

        template.updated_by = current_user["user_id"]

        db.commit()
        db.refresh(template)

        return TemplateResponse.from_orm(template)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{template_id}")
@require_permissions(["template:delete"])
async def delete_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Delete a template (soft delete)."""
    try:
        template = db.query(WoundCareTemplate).filter(
            WoundCareTemplate.id == template_id
        ).first()

        if not template:
            raise HTTPException(
                status_code=404,
                detail="Template not found"
            )

        # Check if user can delete this template
        if (template.is_system_template and
                not current_user.get("is_admin", False)):
            raise HTTPException(
                status_code=403,
                detail="Cannot delete system templates"
            )

        # Soft delete
        template.is_active = False
        template.updated_by = current_user["user_id"]

        db.commit()

        return {"message": "Template deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{template_id}/use", response_model=TemplateUsageResponse)
async def use_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Record template usage and return template data."""
    try:
        template = db.query(WoundCareTemplate).filter(
            WoundCareTemplate.id == template_id,
            WoundCareTemplate.is_active.is_(True)
        ).first()

        if not template:
            raise HTTPException(
                status_code=404,
                detail="Template not found or inactive"
            )

        # Record usage
        usage = TemplateUsageLog(
            template_id=template.id,
            user_id=current_user["user_id"]
        )
        db.add(usage)

        # Update usage count
        template.usage_count = (template.usage_count or 0) + 1

        db.commit()
        db.refresh(usage)

        return TemplateUsageResponse(
            usage_id=usage.id,
            template_id=template.id,
            template_name=template.name,
            template_data=template.template_data,
            used_at=usage.used_at
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/categories/list")
async def list_template_categories(
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """List all available template categories."""
    try:
        categories = db.query(WoundCareTemplate.category).distinct().all()
        return {
            "categories": [cat[0] for cat in categories if cat[0]]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/initialize-defaults")
@require_permissions(["template:admin"])
async def initialize_default_templates(
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Initialize default wound care templates."""
    try:
        created_count = 0

        for template_data in DEFAULT_WOUND_CARE_TEMPLATES:
            # Check if template already exists
            existing = db.query(WoundCareTemplate).filter(
                WoundCareTemplate.name == template_data["name"],
                WoundCareTemplate.is_system_template.is_(True)
            ).first()

            if not existing:
                template = WoundCareTemplate(
                    **template_data,
                    created_by=current_user["user_id"],
                    is_system_template=True,
                    is_active=True
                )
                db.add(template)
                created_count += 1

        db.commit()

        return {
            "message": f"Initialized {created_count} default templates",
            "created_count": created_count
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))