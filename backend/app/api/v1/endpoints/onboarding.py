"""Onboarding API endpoints for the healthcare IVR platform."""

from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.services.onboarding_service import OnboardingService
from app.models.user import User

router = APIRouter()


@router.get("/progress")
async def get_onboarding_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get current user's onboarding progress."""
    try:
        service = OnboardingService(db)
        return service.get_user_onboarding_progress(str(current_user.id))
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get onboarding progress: {str(e)}"
        )


@router.post("/start")
async def start_onboarding(
    skip_welcome: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Start onboarding for the current user."""
    try:
        service = OnboardingService(db)
        return service.start_onboarding(str(current_user.id), skip_welcome)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start onboarding: {str(e)}"
        )


@router.post("/steps/{step_name}/complete")
async def complete_onboarding_step(
    step_name: str,
    data: Dict[str, Any] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Complete an onboarding step."""
    try:
        service = OnboardingService(db)
        return service.complete_step(str(current_user.id), step_name, data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to complete onboarding step: {str(e)}"
        )


@router.post("/skip")
async def skip_onboarding(
    reason: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, str]:
    """Skip onboarding for the current user."""
    try:
        service = OnboardingService(db)
        service.skip_onboarding(str(current_user.id), reason)
        return {"message": "Onboarding skipped successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to skip onboarding: {str(e)}"
        )


@router.get("/should-show")
async def should_show_onboarding(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, bool]:
    """Check if onboarding should be shown for the current user."""
    try:
        service = OnboardingService(db)
        should_show = service.should_show_onboarding(str(current_user.id))
        return {"should_show": should_show}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to check onboarding status: {str(e)}"
        )