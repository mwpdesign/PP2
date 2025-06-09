"""IVR endpoints for the API."""

from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import (
    get_current_user,
    require_permissions,
)
from app.models.ivr import IVRRequest, IVRDocument
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
from pydantic import BaseModel

router = APIRouter()


# New schemas for approval workflow
class ApprovalData(BaseModel):
    coverage_percentage: float
    deductible_amount: float
    copay_amount: float
    out_of_pocket_max: float
    coverage_notes: str


class RejectionData(BaseModel):
    reason: str
    explanation: str


class DocumentRequestData(BaseModel):
    requested_documents: List[str]
    other_document: str = ""
    additional_instructions: str


class ActionResponse(BaseModel):
    success: bool
    message: str
    ivr_request_id: str
    new_status: str


@router.post(
    "/requests", response_model=IVRRequestResponse, status_code=status.HTTP_201_CREATED
)
async def create_ivr_request(
    request: IVRRequestCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new IVR request with multi-size product selection."""
    try:
        ivr_service = IVRService(db)
        ivr_request = await ivr_service.create_ivr_request(request)

        # Convert to response format
        return IVRRequestResponse(
            id=ivr_request.id,
            patient_id=ivr_request.patient_id,
            provider_id=ivr_request.provider_id,
            facility_id=ivr_request.facility_id,
            service_type=ivr_request.service_type,
            priority=ivr_request.priority,
            status=ivr_request.status,
            request_metadata=ivr_request.request_metadata,
            notes=ivr_request.notes,
            products=[],  # Will be populated by the relationship
            created_at=ivr_request.created_at,
            updated_at=ivr_request.updated_at,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create IVR request: {str(e)}"
        )


@router.get("/requests/{request_id}", response_model=IVRRequestResponse)
async def get_ivr_request(
    request_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get an IVR request by ID with products and sizes."""
    try:
        ivr_service = IVRService(db)
        ivr_request = await ivr_service.get_ivr_request(request_id)

        if not ivr_request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="IVR request not found"
            )

        return ivr_request
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get IVR request: {str(e)}"
        )


@router.get("/requests", response_model=List[IVRRequestResponse])
async def list_ivr_requests(
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List IVR requests with products and sizes."""
    try:
        ivr_service = IVRService(db)
        ivr_requests = await ivr_service.list_ivr_requests(
            skip=skip,
            limit=limit
        )
        return ivr_requests
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list IVR requests: {str(e)}"
        )


@router.post("/requests/{request_id}/approve", response_model=ActionResponse)
async def approve_ivr_request(
    request_id: UUID,
    approval_data: ApprovalData,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Approve an IVR request with coverage details."""
    try:
        ivr_service = IVRService(db)

        # Get the IVR request
        ivr_request = await ivr_service.get_ivr_request(request_id)
        if not ivr_request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="IVR request not found"
            )

        # Update the request with approval data and status
        coverage_status = (
            "covered" if approval_data.coverage_percentage > 0
            else "not_covered"
        )

        approval_metadata = {
            "coverage_percentage": approval_data.coverage_percentage,
            "deductible_amount": approval_data.deductible_amount,
            "copay_amount": approval_data.copay_amount,
            "out_of_pocket_max": approval_data.out_of_pocket_max,
            "coverage_notes": approval_data.coverage_notes,
            "approved_by": current_user.id,
            "approved_at": "2024-03-16T10:30:00Z",
            "ivr_results": {
                "case_number": f"CASE-{request_id}",
                "verification_date": "2024-03-16",
                "coverage_status": coverage_status,
                "deductible": {
                    "annual": approval_data.deductible_amount,
                    "remaining": approval_data.deductible_amount * 0.5
                },
                "copay": approval_data.copay_amount,
                "coverage_details": approval_data.coverage_notes
            }
        }

                # Update status to APPROVED
        await ivr_service.update_ivr_request_status(
            request_id,
            "approved",
            approval_metadata
        )

        return ActionResponse(
            success=True,
            message=(
                "IVR request approved successfully. Coverage details have "
                "been documented and provider has been notified."
            ),
            ivr_request_id=str(request_id),
            new_status="approved"
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to approve IVR request: {str(e)}"
        )


@router.post("/requests/{request_id}/reject", response_model=ActionResponse)
async def reject_ivr_request(
    request_id: UUID,
    rejection_data: RejectionData,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Reject an IVR request with reason and explanation."""
    try:
        ivr_service = IVRService(db)

        # Get the IVR request
        ivr_request = await ivr_service.get_ivr_request(request_id)
        if not ivr_request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="IVR request not found"
            )

        # Update the request with rejection data and status
        rejection_metadata = {
            "rejection_reason": rejection_data.reason,
            "rejection_explanation": rejection_data.explanation,
            "rejected_by": current_user.id,
            "rejected_at": "2024-03-16T10:30:00Z",  # In real implementation, use datetime.utcnow()
            "can_resubmit": True
        }

                # Update status to REJECTED
        await ivr_service.update_ivr_request_status(
            request_id,
            "rejected",
            rejection_metadata
        )

        return ActionResponse(
            success=True,
            message=(
                "IVR request rejected. Provider has been notified with "
                "detailed explanation and can resubmit with corrections."
            ),
            ivr_request_id=str(request_id),
            new_status="rejected"
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reject IVR request: {str(e)}"
        )


@router.post("/requests/{request_id}/request-documents", response_model=ActionResponse)
async def request_documents(
    request_id: UUID,
    document_request: DocumentRequestData,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Request additional documents for an IVR request."""
    try:
        ivr_service = IVRService(db)

        # Get the IVR request
        ivr_request = await ivr_service.get_ivr_request(request_id)
        if not ivr_request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="IVR request not found"
            )

        # Prepare document request metadata
        document_request_metadata = {
            "requested_documents": document_request.requested_documents,
            "other_document": document_request.other_document,
            "additional_instructions": document_request.additional_instructions,
            "requested_by": current_user.id,
            "requested_at": "2024-03-16T10:30:00Z",  # In real implementation, use datetime.utcnow()
            "follow_up_date": "2024-03-23T10:30:00Z"  # 7 days from now
        }

                        # Update status to IN_REVIEW (using existing enum value)
        await ivr_service.update_ivr_request_status(
            request_id,
            "in_review",
            document_request_metadata
        )

        # Count requested documents
        total_docs = len(document_request.requested_documents)
        if document_request.other_document.strip():
            total_docs += 1

        return ActionResponse(
            success=True,
            message=(
                f"Document request sent successfully. Provider has been "
                f"notified to submit {total_docs} additional document(s) "
                f"with detailed instructions."
            ),
            ivr_request_id=str(request_id),
            new_status="in_review"
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to request documents: {str(e)}"
        )


@router.post(
    "/sessions", response_model=IVRSessionResponse, status_code=status.HTTP_201_CREATED
)
async def create_ivr_session(
    session: IVRSessionCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new IVR session."""
    try:
        ivr_service = IVRService(db)
        ivr_session = await ivr_service.create_session(session)
        return ivr_session
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create IVR session: {str(e)}"
        )


@router.get("/sessions/{session_id}", response_model=IVRSessionResponse)
async def get_ivr_session(
    session_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get an IVR session by ID."""
    try:
        ivr_service = IVRService(db)
        ivr_session = await ivr_service.get_session(session_id)

        if not ivr_session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="IVR session not found"
            )

        return ivr_session
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get IVR session: {str(e)}"
        )


@router.get("/sessions", response_model=List[IVRSessionResponse])
async def list_ivr_sessions(
    organization_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List IVR sessions for an organization."""
    try:
        ivr_service = IVRService(db)
        ivr_sessions = await ivr_service.list_sessions(organization_id)
        return ivr_sessions
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list IVR sessions: {str(e)}"
        )


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
    # Get IVR request to verify it exists
    ivr_request = await db.get(IVRRequest, str(document.ivr_request_id))
    if not ivr_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="IVR request not found"
        )

    # Create IVR document
    ivr_document = IVRDocument(
        ivr_request_id=document.ivr_request_id,
        document_type=document.document_type,
        document_key=document.document_key,
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

    call = await ivr_service.create_call(
        call_in,
        created_by_id=current_user["id"]
    )
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
