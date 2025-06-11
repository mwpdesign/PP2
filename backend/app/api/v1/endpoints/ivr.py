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
# Models imported for type checking only
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
    DoctorCommentUpdate,
    IVRResponseUpdate,
)
from app.schemas.token import TokenData
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


# Communication schemas
class CommunicationMessageCreate(BaseModel):
    message: str
    message_type: str = "text"  # text, file, system
    attachments: List[dict] = []


class CommunicationMessageResponse(BaseModel):
    id: str
    message: str
    author: str
    author_type: str  # doctor, ivr_specialist, system
    timestamp: str
    message_type: str
    attachments: List[dict] = []


class ActionResponse(BaseModel):
    success: bool
    message: str
    ivr_request_id: str
    new_status: str


@router.post(
    "/requests",
    response_model=IVRRequestResponse,
    status_code=status.HTTP_201_CREATED
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


# Simplified Communication Endpoints
@router.put("/requests/{request_id}/doctor-comment")
async def update_doctor_comment(
    request_id: UUID,
    comment_data: DoctorCommentUpdate,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update doctor comment for an IVR request."""
    try:
        ivr_service = IVRService(db)

        # Verify the IVR request exists
        ivr_request = await ivr_service.get_ivr_request(request_id)
        if not ivr_request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="IVR request not found"
            )

        # Update the doctor comment
        updated_request = await ivr_service.update_doctor_comment(
            request_id, comment_data.comment
        )

        return updated_request
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update doctor comment: {str(e)}"
        )


@router.put("/requests/{request_id}/ivr-response")
async def update_ivr_response(
    request_id: UUID,
    response_data: IVRResponseUpdate,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update IVR specialist response for an IVR request."""
    try:
        ivr_service = IVRService(db)

        # Verify the IVR request exists
        ivr_request = await ivr_service.get_ivr_request(request_id)
        if not ivr_request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="IVR request not found"
            )

        # Update the IVR response
        updated_request = await ivr_service.update_ivr_response(
            request_id, response_data.response
        )

        return updated_request
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update IVR response: {str(e)}"
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
            "approved_by": str(current_user.id),
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
            approval_metadata,
            user_id=current_user.id
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
            "rejected_by": str(current_user.id),
            "rejected_at": "2024-03-16T10:30:00Z",
            "can_resubmit": True
        }

        # Update status to REJECTED
        await ivr_service.update_ivr_request_status(
            request_id,
            "rejected",
            rejection_metadata,
            user_id=current_user.id
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


@router.post(
    "/requests/{request_id}/request-documents",
    response_model=ActionResponse
)
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
            "additional_instructions": (
                document_request.additional_instructions
            ),
            "requested_by": str(current_user.id),
            "requested_at": "2024-03-16T10:30:00Z",
            "follow_up_date": "2024-03-23T10:30:00Z"
        }

        # Update status to IN_REVIEW (using existing enum value)
        await ivr_service.update_ivr_request_status(
            request_id,
            "in_review",
            document_request_metadata,
            user_id=current_user.id
        )

        # Count requested documents
        total_docs = len(document_request.requested_documents)
        if document_request.other_document.strip():
            total_docs += 1

        # Create a system message for the document request
        doc_list = document_request.requested_documents.copy()
        if document_request.other_document.strip():
            doc_list.append(document_request.other_document)

        doc_request_message = (
            "📋 DOCUMENT REQUEST\n\n"
            "The following documents are needed:\n"
        )
        for i, doc in enumerate(doc_list, 1):
            doc_request_message += f"{i}. {doc}\n"

        if document_request.additional_instructions.strip():
            doc_request_message += (
                f"\nAdditional Instructions:\n"
                f"{document_request.additional_instructions}"
            )

        doc_request_message += (
            "\n\nPlease upload the requested documents to continue "
            "processing your IVR request."
        )

        # Add the document request as a system communication message
        await ivr_service.add_communication_message(
            ivr_request_id=request_id,
            author_id=current_user.id,
            message=doc_request_message,
            author_type="system",
            author_name="IVR System",
            message_type="system",
            attachments=[]
        )

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
    "/requests/{request_id}/messages",
    response_model=CommunicationMessageResponse
)
async def add_communication_message(
    request_id: UUID,
    message_data: CommunicationMessageCreate,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a communication message to an IVR request."""
    try:
        ivr_service = IVRService(db)

        # Get the IVR request to verify it exists
        ivr_request = await ivr_service.get_ivr_request(request_id)
        if not ivr_request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="IVR request not found"
            )

        # Determine author type and name based on user role
        author_type = ("doctor" if current_user.role == "Doctor"
                       else "ivr_specialist")

        # Construct author name from user data
        if (hasattr(current_user, 'first_name') and
                hasattr(current_user, 'last_name')):
            if current_user.first_name and current_user.last_name:
                author_name = (f"{current_user.first_name} "
                               f"{current_user.last_name}")
                if author_type == "doctor":
                    author_name = f"Dr. {author_name}"
            elif current_user.first_name:
                author_name = current_user.first_name
                if author_type == "doctor":
                    author_name = f"Dr. {author_name}"
            else:
                author_name = ("Dr. [Name]" if author_type == "doctor"
                               else "IVR Specialist")
        else:
            # Fallback for different user object structures
            fallback_name = ("Dr. [Name]" if author_type == "doctor"
                             else "IVR Specialist")
            author_name = getattr(current_user, "name", fallback_name)

        # Save message to database
        communication_message = await ivr_service.add_communication_message(
            ivr_request_id=request_id,
            author_id=current_user.id,
            message=message_data.message,
            author_type=author_type,
            author_name=author_name,
            message_type=message_data.message_type,
            attachments=message_data.attachments
        )

        # Return message response
        return CommunicationMessageResponse(
            id=str(communication_message.id),
            message=communication_message.message,
            author=communication_message.author_name,
            author_type=communication_message.author_type,
            timestamp=communication_message.created_at.isoformat() + "Z",
            message_type=communication_message.message_type,
            attachments=communication_message.attachments
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add communication message: {str(e)}"
        )


@router.get(
    "/requests/{request_id}/messages",
    response_model=List[CommunicationMessageResponse]
)
async def get_communication_messages(
    request_id: UUID,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all communication messages for an IVR request."""
    try:
        ivr_service = IVRService(db)

        # Get the IVR request to verify it exists
        ivr_request = await ivr_service.get_ivr_request(request_id)
        if not ivr_request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="IVR request not found"
            )

        # Get messages from database
        communication_messages = await ivr_service.get_communication_messages(
            request_id
        )

        # Convert to response format
        messages = []
        for msg in communication_messages:
            messages.append(CommunicationMessageResponse(
                id=str(msg.id),
                message=msg.message,
                author=msg.author_name,
                author_type=msg.author_type,
                timestamp=msg.created_at.isoformat() + "Z",
                message_type=msg.message_type,
                attachments=msg.attachments
            ))

        return messages

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get communication messages: {str(e)}"
        )


@router.post(
    "/sessions", response_model=IVRSessionResponse,
    status_code=status.HTTP_201_CREATED
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
    try:
        ivr_service = IVRService(db)
        ivr_document = await ivr_service.create_document(document)
        return ivr_document
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create IVR document: {str(e)}"
        )


@router.post("/scripts", response_model=IVRScriptResponse)
@require_permissions(["ivr:write"])
async def create_ivr_script(
    *,
    db: AsyncSession = Depends(get_db),
    script_in: IVRScriptCreate,
    current_user: dict = Depends(get_current_user),
) -> IVRScriptResponse:
    """Create a new IVR script."""
    try:
        ivr_service = IVRService(db)
        script = await ivr_service.create_script(script_in)
        return script
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create IVR script: {str(e)}"
        )


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
    try:
        ivr_service = IVRService(db)
        scripts = await ivr_service.get_scripts(
            skip=skip, limit=limit
        )
        return scripts
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get IVR scripts: {str(e)}"
        )


@router.get("/scripts/{script_id}", response_model=IVRScriptResponse)
@require_permissions(["ivr:read"])
async def get_ivr_script(
    *,
    db: AsyncSession = Depends(get_db),
    script_id: UUID,
    current_user: dict = Depends(get_current_user),
) -> IVRScriptResponse:
    """Get an IVR script by ID."""
    try:
        ivr_service = IVRService(db)
        script = await ivr_service.get_script(script_id)

        if not script:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="IVR script not found"
            )

        return script
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get IVR script: {str(e)}"
        )


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
    try:
        ivr_service = IVRService(db)
        script = await ivr_service.update_script(script_id, script_in)

        if not script:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="IVR script not found"
            )

        return script
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update IVR script: {str(e)}"
        )


@router.delete("/scripts/{script_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_permissions(["ivr:write"])
async def delete_ivr_script(
    *,
    db: AsyncSession = Depends(get_db),
    script_id: UUID,
    current_user: dict = Depends(get_current_user),
):
    """Delete an IVR script."""
    try:
        ivr_service = IVRService(db)
        success = await ivr_service.delete_script(script_id)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="IVR script not found"
            )

        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete IVR script: {str(e)}"
        )


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
    try:
        # Upload file to S3
        file_key = f"ivr-scripts/{script_id}/audio.wav"
        audio_url = await s3_service.upload_file(
            audio_file.file, file_key, audio_file.content_type
        )

        # Update script with audio URL
        ivr_service = IVRService(db)
        script_update = IVRScriptUpdate(audio_url=audio_url)
        script = await ivr_service.update_script(script_id, script_update)

        if not script:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="IVR script not found"
            )

        return script
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload script audio: {str(e)}"
        )


@router.post("/calls", response_model=IVRCallResponse)
@require_permissions(["ivr:write"])
async def create_ivr_call(
    *,
    db: AsyncSession = Depends(get_db),
    call_in: IVRCallCreate,
    current_user: dict = Depends(get_current_user),
) -> IVRCallResponse:
    """Create a new IVR call."""
    try:
        ivr_service = IVRService(db)
        call = await ivr_service.create_call(call_in)
        return call
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create IVR call: {str(e)}"
        )


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
    try:
        ivr_service = IVRService(db)
        calls = await ivr_service.get_calls(skip=skip, limit=limit)
        return calls
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get IVR calls: {str(e)}"
        )


@router.get("/calls/{call_id}", response_model=IVRCallResponse)
@require_permissions(["ivr:read"])
async def get_ivr_call(
    *,
    db: AsyncSession = Depends(get_db),
    call_id: UUID,
    current_user: dict = Depends(get_current_user),
) -> IVRCallResponse:
    """Get an IVR call by ID."""
    try:
        ivr_service = IVRService(db)
        call = await ivr_service.get_call(call_id)

        if not call:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="IVR call not found"
            )

        return call
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get IVR call: {str(e)}"
        )


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
    try:
        ivr_service = IVRService(db)
        call = await ivr_service.update_call(call_id, call_in)

        if not call:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="IVR call not found"
            )

        return call
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update IVR call: {str(e)}"
        )
