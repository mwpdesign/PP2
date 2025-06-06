"""
Voice transcription API endpoints for Healthcare IVR Platform

Provides REST API endpoints for managing voice transcription,
user settings, and usage analytics.
"""

from typing import Optional
from fastapi import (
    APIRouter, Depends, HTTPException, status, Query, UploadFile, File
)
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.voice_transcription import (
    VoiceTranscription,
    VoiceTranscriptionSettings,
)
from app.services.voice_transcription_service import VoiceTranscriptionService

router = APIRouter()


@router.post("/transcribe")
async def transcribe_audio(
    audio_file: UploadFile = File(...),
    form_field: str = Query(...),
    patient_id: Optional[str] = Query(None),
    ivr_request_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Transcribe audio file to text."""
    try:
        voice_service = VoiceTranscriptionService(db, current_user)
        result = await voice_service.transcribe_audio(
            audio_file=audio_file,
            form_field=form_field,
            patient_id=patient_id,
            ivr_request_id=ivr_request_id
        )

        return {
            "success": True,
            "transcriptionId": result["transcription_id"],
            "transcribedText": result["transcribed_text"],
            "confidenceScore": result["confidence_score"],
            "processingTimeMs": result["processing_time_ms"],
            "languageDetected": result["language_detected"],
            "requiresReview": result["requires_review"]
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to transcribe audio: {str(e)}"
        )


@router.post("/accept-transcription")
async def accept_transcription(
    transcription_id: str,
    final_text: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Accept a voice transcription result."""
    try:
        voice_service = VoiceTranscriptionService(db, current_user)
        success = await voice_service.accept_transcription(
            transcription_id=transcription_id,
            final_text=final_text
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to accept transcription"
            )

        return {
            "success": True,
            "transcriptionId": transcription_id,
            "message": "Transcription accepted successfully"
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to accept transcription: {str(e)}"
        )


@router.post("/reject-transcription")
async def reject_transcription(
    transcription_id: str,
    corrected_text: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Reject and correct a voice transcription result."""
    try:
        voice_service = VoiceTranscriptionService(db, current_user)
        success = await voice_service.reject_transcription(
            transcription_id=transcription_id,
            corrected_text=corrected_text
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to reject transcription"
            )

        return {
            "success": True,
            "transcriptionId": transcription_id,
            "message": "Transcription corrected successfully"
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reject transcription: {str(e)}"
        )


@router.get("/history")
async def get_transcription_history(
    patient_id: Optional[str] = Query(None),
    form_field: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get voice transcription history for a user."""
    try:
        query = select(VoiceTranscription).where(
            VoiceTranscription.user_id == current_user["id"]
        )

        if patient_id:
            query = query.where(VoiceTranscription.patient_id == patient_id)
        if form_field:
            query = query.where(VoiceTranscription.form_field == form_field)

        query = query.order_by(desc(VoiceTranscription.timestamp))
        query = query.offset(offset).limit(limit)

        result = await db.execute(query)
        transcriptions = result.scalars().all()

        # Decrypt sensitive data before returning
        voice_service = VoiceTranscriptionService(db, current_user)
        decrypted_transcriptions = []
        for transcription in transcriptions:
            trans_dict = transcription.to_dict()
            trans_dict = await voice_service.decrypt_transcription_data(
                trans_dict
            )
            decrypted_transcriptions.append(trans_dict)

        return {
            "transcriptions": decrypted_transcriptions,
            "total": len(decrypted_transcriptions),
            "limit": limit,
            "offset": offset
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get transcription history: {str(e)}"
        )


@router.get("/settings")
async def get_voice_settings(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get user voice transcription settings."""
    try:
        query = select(VoiceTranscriptionSettings).where(
            VoiceTranscriptionSettings.user_id == current_user["id"]
        )
        result = await db.execute(query)
        settings = result.scalar_one_or_none()

        if not settings:
            # Create default settings
            voice_service = VoiceTranscriptionService(db, current_user)
            settings = await voice_service.create_default_settings()

        return settings.to_dict()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get voice settings: {str(e)}"
        )


@router.put("/settings")
async def update_voice_settings(
    settings_data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Update user voice transcription settings."""
    try:
        voice_service = VoiceTranscriptionService(db, current_user)
        settings = await voice_service.update_settings(settings_data)

        return {
            "success": True,
            "settings": settings.to_dict(),
            "message": "Settings updated successfully"
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update voice settings: {str(e)}"
        )


@router.get("/analytics")
async def get_voice_analytics(
    period_type: str = Query("monthly", regex="^(daily|weekly|monthly)$"),
    periods: int = Query(6, ge=1, le=12),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get voice transcription usage analytics."""
    try:
        voice_service = VoiceTranscriptionService(db, current_user)
        analytics = await voice_service.get_analytics(
            user_id=current_user["id"],
            period_type=period_type,
            periods=periods
        )

        return {
            "analytics": analytics,
            "periodType": period_type,
            "periods": periods,
            "userId": current_user["id"]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get voice analytics: {str(e)}"
        )


@router.get("/supported-languages")
async def get_supported_languages():
    """Get list of supported languages for voice transcription."""
    return {
        "languages": [
            {"code": "en", "name": "English", "region": "US"},
            {"code": "en-GB", "name": "English", "region": "UK"},
            {"code": "es", "name": "Spanish", "region": "US"},
            {"code": "es-ES", "name": "Spanish", "region": "Spain"},
            {"code": "fr", "name": "French", "region": "France"},
            {"code": "de", "name": "German", "region": "Germany"},
            {"code": "it", "name": "Italian", "region": "Italy"},
            {"code": "pt", "name": "Portuguese", "region": "Brazil"},
            {"code": "zh", "name": "Chinese", "region": "Mandarin"},
            {"code": "ja", "name": "Japanese", "region": "Japan"},
        ],
        "default": "en"
    }


@router.get("/transcription-services")
async def get_transcription_services():
    """Get list of available transcription services."""
    return {
        "services": [
            {
                "id": "aws-transcribe",
                "name": "AWS Transcribe",
                "description": "Amazon Web Services transcription service",
                "accuracy": "High",
                "languages": ["en", "es", "fr", "de", "it", "pt"],
                "realtime": True
            },
            {
                "id": "google-speech",
                "name": "Google Speech-to-Text",
                "description": "Google Cloud speech recognition",
                "accuracy": "High",
                "languages": ["en", "es", "fr", "de", "it", "pt", "zh", "ja"],
                "realtime": True
            },
            {
                "id": "azure-speech",
                "name": "Azure Speech Services",
                "description": "Microsoft Azure speech recognition",
                "accuracy": "High",
                "languages": ["en", "es", "fr", "de", "it", "pt"],
                "realtime": True
            }
        ],
        "default": "aws-transcribe"
    }