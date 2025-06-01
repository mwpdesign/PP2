"""IVR endpoints for the API."""

from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import (
    get_current_user,
    require_permissions,
    verify_territory_access,
)
from app.models.ivr import IVRRequest, IVRSession, IVRDocument
from app.schemas.ivr import (
    IVRRequestCreate,
    IVRRequestResponse,
    IVRSessionCreate,
    IVRSessionResponse,
    IVRDocumentCreate,
    IVRDocumentResponse,
    IVRScriptCreate,
    IVRScriptUpdate,
    IVRScriptResponse,
    IVRCallCreate,
    IVRCallUpdate,
    IVRCallResponse,
)
from app.services.ivr_service import IVRService
from app.services.s3_service import S3Service

router = APIRouter()


@router.post(
    "/requests", response_model=IVRRequestResponse, status_code=status.HTTP_201_CREATED
)
async def create_ivr_request(
    request: IVRRequestCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new IVR request."""
    # Verify territory access
    await verify_territory_access(current_user, request["territory_id"])

    # Create IVR request
    ivr_request = IVRRequest(
        patient_id=request["patient_id"],
        provider_id=request["provider_id"],
        facility_id=request["facility_id"],
        territory_id=request["territory_id"],
        service_type=request["service_type"],
        priority=request["priority"],
        metadata=request["metadata"],
        notes=request["notes"],
    )
    db.add(ivr_request)
    await db.commit()
    await db.refresh(ivr_request)
    return ivr_request


@router.get("/requests/{request_id}", response_model=IVRRequestResponse)
async def get_ivr_request(
    request_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get an IVR request by ID."""
    ivr_request = await db.get(IVRRequest, str(request_id))
    if not ivr_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="IVR request not found"
        )

    # Verify territory access
    await verify_territory_access(current_user, ivr_request["territory_id"])
    return ivr_request


@router.get("/requests", response_model=List[IVRRequestResponse])
async def list_ivr_requests(
    territory_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
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
    "/sessions", response_model=IVRSessionResponse, status_code=status.HTTP_201_CREATED
)
async def create_ivr_session(
    session: IVRSessionCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new IVR session."""
    # Verify territory access
    await verify_territory_access(current_user, session["territory_id"])

    # Create IVR session
    ivr_session = IVRSession(
        patient_id=session["patient_id"],
        provider_id=session["provider_id"],
        territory_id=session["territory_id"],
        status=session["status"],
        insurance_data=session["insurance_data"],
        metadata=session["metadata"],
    )
    db.add(ivr_session)
    await db.commit()
    await db.refresh(ivr_session)
    return ivr_session


@router.get("/sessions/{session_id}", response_model=IVRSessionResponse)
async def get_ivr_session(
    session_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get an IVR session by ID."""
    ivr_session = await db.get(IVRSession, str(session_id))
    if not ivr_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="IVR session not found"
        )

    # Verify territory access
    await verify_territory_access(current_user, ivr_session["territory_id"])
    return ivr_session


@router.get("/sessions", response_model=List[IVRSessionResponse])
async def list_ivr_sessions(
    territory_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
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
    status_code=status.HTTP_201_CREATED,
)
async def create_ivr_document(
    document: IVRDocumentCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new IVR document."""
    # Get IVR request to verify territory access
    ivr_request = await db.get(IVRRequest, str(document["ivr_request_id"]))
    if not ivr_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="IVR request not found"
        )

    # Verify territory access
    await verify_territory_access(current_user, ivr_request["territory_id"])

    # Create IVR document
    ivr_document = IVRDocument(
        ivr_request_id=document["ivr_request_id"],
        document_type=document["document_type"],
        document_key=document["document_key"],
        uploaded_by_id=current_user["id"],
    )
    db.add(ivr_document)
    await db.commit()
    await db.refresh(ivr_document)
    return ivr_document


@router.post("/scripts", response_model=IVRScriptResponse)
@require_permissions(["ivr:write"])
async def create_ivr_script(
    *,
    db: AsyncSession = Depends(get_db),
    script_in: IVRScriptCreate,
    current_user: dict = Depends(get_current_user),
) -> IVRScriptResponse:
    """Create a new IVR script."""
    ivr_service = IVRService(db)

    script = await ivr_service.create_script(
        script_in, created_by_id=current_user["id"]
    )
    return script


@router.get("/scripts", response_model=List[IVRScriptResponse])
@require_permissions(["ivr:read"])
async def get_ivr_scripts(
    *,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
) -> List[IVRScriptResponse]:
    """Get IVR scripts."""
    ivr_service = IVRService(db)

    scripts = await ivr_service.get_scripts(
        organization_id=current_user["organization_id"], skip=skip, limit=limit
    )
    return scripts


@router.get("/scripts/{script_id}", response_model=IVRScriptResponse)
@require_permissions(["ivr:read"])
async def get_ivr_script(
    *,
    db: AsyncSession = Depends(get_db),
    script_id: UUID,
    current_user: dict = Depends(get_current_user),
) -> IVRScriptResponse:
    """Get an IVR script by ID."""
    ivr_service = IVRService(db)

    script = await ivr_service.get_script(script_id)
    if not script:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="IVR script not found"
        )

    # Check organization access
    if script["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions"
        )

    return script


@router.put("/scripts/{script_id}", response_model=IVRScriptResponse)
@require_permissions(["ivr:write"])
async def update_ivr_script(
    *,
    db: AsyncSession = Depends(get_db),
    script_id: UUID,
    script_in: IVRScriptUpdate,
    current_user: dict = Depends(get_current_user),
) -> IVRScriptResponse:
    """Update an IVR script."""
    ivr_service = IVRService(db)

    # Get existing script
    script = await ivr_service.get_script(script_id)
    if not script:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="IVR script not found"
        )

    # Check organization access
    if script["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions"
        )

    script = await ivr_service.update_script(
        script_id, script_in, updated_by_id=current_user["id"]
    )
    return script


@router.delete("/scripts/{script_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_permissions(["ivr:write"])
async def delete_ivr_script(
    *,
    db: AsyncSession = Depends(get_db),
    script_id: UUID,
    current_user: dict = Depends(get_current_user),
):
    """Delete an IVR script."""
    ivr_service = IVRService(db)

    # Get existing script
    script = await ivr_service.get_script(script_id)
    if not script:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="IVR script not found"
        )

    # Check organization access
    if script["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions"
        )

    await ivr_service.delete_script(script_id)


@router.post("/scripts/{script_id}/audio", response_model=IVRScriptResponse)
@require_permissions(["ivr:write"])
async def upload_script_audio(
    *,
    db: AsyncSession = Depends(get_db),
    script_id: UUID,
    audio_file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    s3_service: S3Service = Depends(),
) -> IVRScriptResponse:
    """Upload audio file for an IVR script."""
    ivr_service = IVRService(db)

    # Get existing script
    script = await ivr_service.get_script(script_id)
    if not script:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="IVR script not found"
        )

    # Check organization access
    if script["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions"
        )

    # Upload audio file
    audio_url = await s3_service.upload_file(
        file=audio_file, folder="ivr-audio", uploaded_by_id=current_user["id"]
    )

    # Update script with audio URL
    script = await ivr_service.update_script(
        script_id,
        IVRScriptUpdate(audio_url=audio_url),
        updated_by_id=current_user["id"],
    )
    return script


@router.post("/calls", response_model=IVRCallResponse)
@require_permissions(["ivr:write"])
async def create_ivr_call(
    *,
    db: AsyncSession = Depends(get_db),
    call_in: IVRCallCreate,
    current_user: dict = Depends(get_current_user),
) -> IVRCallResponse:
    """Create a new IVR call."""
    ivr_service = IVRService(db)

    call = await ivr_service.create_call(call_in, created_by_id=current_user["id"])
    return call


@router.get("/calls", response_model=List[IVRCallResponse])
@require_permissions(["ivr:read"])
async def get_ivr_calls(
    *,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
) -> List[IVRCallResponse]:
    """Get IVR calls."""
    ivr_service = IVRService(db)

    calls = await ivr_service.get_calls(
        organization_id=current_user["organization_id"], skip=skip, limit=limit
    )
    return calls


@router.get("/calls/{call_id}", response_model=IVRCallResponse)
@require_permissions(["ivr:read"])
async def get_ivr_call(
    *,
    db: AsyncSession = Depends(get_db),
    call_id: UUID,
    current_user: dict = Depends(get_current_user),
) -> IVRCallResponse:
    """Get an IVR call by ID."""
    ivr_service = IVRService(db)

    call = await ivr_service.get_call(call_id)
    if not call:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="IVR call not found"
        )

    # Check organization access
    if call["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions"
        )

    return call


@router.put("/calls/{call_id}", response_model=IVRCallResponse)
@require_permissions(["ivr:write"])
async def update_ivr_call(
    *,
    db: AsyncSession = Depends(get_db),
    call_id: UUID,
    call_in: IVRCallUpdate,
    current_user: dict = Depends(get_current_user),
) -> IVRCallResponse:
    """Update an IVR call."""
    ivr_service = IVRService(db)

    # Get existing call
    call = await ivr_service.get_call(call_id)
    if not call:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="IVR call not found"
        )

    # Check organization access
    if call["organization_id"] != current_user["organization_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions"
        )

    call = await ivr_service.update_call(
        call_id, call_in, updated_by_id=current_user["id"]
    )
    return call
