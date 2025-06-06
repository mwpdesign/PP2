"""Voice transcription service for Healthcare IVR Platform."""

import uuid
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.voice_transcription import (
    VoiceTranscription,
    VoiceTranscriptionSettings,
    DEFAULT_VOICE_SETTINGS,
)
from app.services.encryption_service import LocalEncryptionService


class VoiceTranscriptionService:
    """Service for managing voice transcription functionality."""

    def __init__(self, db: AsyncSession, current_user: dict):
        self.db = db
        self.current_user = current_user
        self.encryption_service = LocalEncryptionService()

    async def transcribe_audio(
        self,
        audio_file,
        form_field: str,
        patient_id: Optional[str] = None,
        ivr_request_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Transcribe audio file to text."""
        # Mock transcription - in real implementation, this would
        # call AWS Transcribe, Google Speech-to-Text, etc.
        mock_transcription = "Patient has diabetic foot ulcer on left toe"
        confidence_score = 0.92

        # Encrypt transcribed text
        encrypted_text = self.encryption_service.encrypt(mock_transcription)

        transcription = VoiceTranscription(
            id=str(uuid.uuid4()),
            user_id=self.current_user["id"],
            patient_id=patient_id,
            ivr_request_id=ivr_request_id,
            form_field=form_field,
            audio_duration_seconds=3.5,
            audio_format="wav",
            audio_quality="high",
            sample_rate=44100,
            transcribed_text=encrypted_text,
            confidence_score=confidence_score,
            language_detected="en",
            transcription_service="aws-transcribe",
            processing_time_ms=250,
            was_successful=True
        )

        self.db.add(transcription)
        await self.db.commit()
        await self.db.refresh(transcription)

        return {
            "transcription_id": transcription.id,
            "transcribed_text": mock_transcription,
            "confidence_score": confidence_score,
            "processing_time_ms": 250,
            "language_detected": "en",
            "requires_review": confidence_score < 0.8
        }

    async def accept_transcription(
        self,
        transcription_id: str,
        final_text: Optional[str] = None
    ) -> bool:
        """Accept a voice transcription result."""
        transcription = await self.db.get(VoiceTranscription, transcription_id)
        if not transcription or transcription.user_id != self.current_user["id"]:
            return False

        transcription.was_accepted = True
        if final_text:
            encrypted_final = self.encryption_service.encrypt(final_text)
            transcription.final_text = encrypted_final

        await self.db.commit()
        return True

    async def reject_transcription(
        self,
        transcription_id: str,
        corrected_text: str
    ) -> bool:
        """Reject and correct a voice transcription result."""
        transcription = await self.db.get(VoiceTranscription, transcription_id)
        if not transcription or transcription.user_id != self.current_user["id"]:
            return False

        transcription.was_accepted = False
        encrypted_corrected = self.encryption_service.encrypt(corrected_text)
        transcription.final_text = encrypted_corrected

        # Calculate edit distance (simplified)
        original = self.encryption_service.decrypt(
            transcription.transcribed_text
        )
        transcription.edit_distance = abs(len(corrected_text) - len(original))

        await self.db.commit()
        return True

    async def create_default_settings(self) -> VoiceTranscriptionSettings:
        """Create default voice transcription settings for user."""
        settings = VoiceTranscriptionSettings(
            user_id=self.current_user["id"],
            **DEFAULT_VOICE_SETTINGS
        )

        self.db.add(settings)
        await self.db.commit()
        await self.db.refresh(settings)

        return settings

    async def update_settings(
        self,
        settings_data: Dict[str, Any]
    ) -> VoiceTranscriptionSettings:
        """Update user voice transcription settings."""
        # Get existing settings or create new ones
        from sqlalchemy import select
        query = select(VoiceTranscriptionSettings).where(
            VoiceTranscriptionSettings.user_id == self.current_user["id"]
        )
        result = await self.db.execute(query)
        settings = result.scalar_one_or_none()

        if not settings:
            settings = await self.create_default_settings()

        # Update settings
        for key, value in settings_data.items():
            if hasattr(settings, key):
                setattr(settings, key, value)

        await self.db.commit()
        return settings

    async def get_analytics(
        self,
        user_id: str,
        period_type: str = "monthly",
        periods: int = 6
    ) -> Dict[str, Any]:
        """Get voice transcription usage analytics."""
        # Mock analytics - in real implementation, this would
        # query the database for actual usage statistics
        return {
            "total_transcriptions": 45,
            "successful_transcriptions": 42,
            "average_confidence": 0.89,
            "acceptance_rate": 0.93,
            "total_audio_duration": 180.5,
            "average_processing_time": 275,
            "period_type": period_type,
            "periods": periods
        }

    async def decrypt_transcription_data(
        self,
        trans_dict: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Decrypt sensitive data in a transcription dictionary."""
        try:
            if trans_dict.get("transcribedText"):
                trans_dict["transcribedText"] = self.encryption_service.decrypt(
                    trans_dict["transcribedText"]
                )
            if trans_dict.get("finalText"):
                trans_dict["finalText"] = self.encryption_service.decrypt(
                    trans_dict["finalText"]
                )
        except Exception:
            # If decryption fails, leave encrypted
            pass
        return trans_dict