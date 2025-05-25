"""IVR endpoints for handling IVR requests and sessions."""
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.security import get_current_user, verify_territory_access
from app.core.database import get_db
from app.api.ivr.models import IVRRequest, IVRSession, IVRDocument
from app.api.ivr.schemas import (
    IVRRequestCreate, IVRRequestResponse,
    IVRSessionCreate, IVRSessionResponse,
    IVRDocumentCreate, IVRDocumentResponse
)
from app.models.user import User

router = APIRouter()


@router.post(
    "/requests",
    response_model=IVRRequestResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_ivr_request(
    request: IVRRequestCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new IVR request."""
    # Verify territory access
    await verify_territory_access(current_user, request.territory_id)

    # Create IVR request
    ivr_request = IVRRequest(
        patient_id=request.patient_id,
        provider_id=request.provider_id,
        facility_id=request.facility_id,
        territory_id=request.territory_id,
        service_type=request.service_type,
        priority=request.priority,
        metadata=request.metadata,
        notes=request.notes
    )
    db.add(ivr_request)
    await db.commit()
    await db.refresh(ivr_request)
    return ivr_request


@router.get(
    "/requests/{request_id}",
    response_model=IVRRequestResponse
)
async def get_ivr_request(
    request_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get an IVR request by ID."""
    ivr_request = await db.get(IVRRequest, str(request_id))
    if not ivr_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="IVR request not found"
        )
    
    # Verify territory access
    await verify_territory_access(current_user, ivr_request.territory_id)
    return ivr_request


@router.get(
    "/requests",
    response_model=List[IVRRequestResponse]
)
async def list_ivr_requests(
    territory_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List IVR requests for a territory."""
    # Verify territory access
    await verify_territory_access(current_user, territory_id)

    # Get IVR requests
    result = await db.execute(
        select(IVRRequest).where(IVRRequest.territory_id == str(territory_id))
    )
    return result.scalars().all()


@router.post(
    "/sessions",
    response_model=IVRSessionResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_ivr_session(
    session: IVRSessionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new IVR session."""
    # Verify territory access
    await verify_territory_access(current_user, session.territory_id)

    # Create IVR session
    ivr_session = IVRSession(
        patient_id=session.patient_id,
        provider_id=session.provider_id,
        territory_id=session.territory_id,
        status=session.status,
        insurance_data=session.insurance_data,
        metadata=session.metadata
    )
    db.add(ivr_session)
    await db.commit()
    await db.refresh(ivr_session)
    return ivr_session


@router.get(
    "/sessions/{session_id}",
    response_model=IVRSessionResponse
)
async def get_ivr_session(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get an IVR session by ID."""
    ivr_session = await db.get(IVRSession, str(session_id))
    if not ivr_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="IVR session not found"
        )
    
    # Verify territory access
    await verify_territory_access(current_user, ivr_session.territory_id)
    return ivr_session


@router.get(
    "/sessions",
    response_model=List[IVRSessionResponse]
)
async def list_ivr_sessions(
    territory_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List IVR sessions for a territory."""
    # Verify territory access
    await verify_territory_access(current_user, territory_id)

    # Get IVR sessions
    result = await db.execute(
        select(IVRSession).where(IVRSession.territory_id == str(territory_id))
    )
    return result.scalars().all()


@router.post(
    "/documents",
    response_model=IVRDocumentResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_ivr_document(
    document: IVRDocumentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new IVR document."""
    # Get IVR request to verify territory access
    ivr_request = await db.get(IVRRequest, str(document.ivr_request_id))
    if not ivr_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="IVR request not found"
        )
    
    # Verify territory access
    await verify_territory_access(current_user, ivr_request.territory_id)

    # Create IVR document
    ivr_document = IVRDocument(
        ivr_request_id=document.ivr_request_id,
        document_type=document.document_type,
        document_key=document.document_key,
        uploaded_by_id=current_user.id
    )
    db.add(ivr_document)
    await db.commit()
    await db.refresh(ivr_document)
    return ivr_document 