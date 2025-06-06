"""Voice transcription models for Healthcare IVR Platform."""

from datetime import datetime
from typing import Dict, Any
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Float, Boolean
)

from app.core.database import Base


class VoiceTranscription(Base):
    """Model for voice transcription metadata and results."""

    __tablename__ = "voice_transcriptions"

    id = Column(String, primary_key=True, index=True)

    # Context
    user_id = Column(String, nullable=False, index=True)
    patient_id = Column(String, nullable=True, index=True)
    ivr_request_id = Column(String, nullable=True, index=True)
    form_field = Column(String(100), nullable=False, index=True)

    # Audio metadata
    audio_duration_seconds = Column(Float, nullable=False)
    audio_format = Column(String(20), nullable=False)  # wav, mp3, etc.
    audio_quality = Column(String(20), nullable=True)  # high, medium, low
    sample_rate = Column(Integer, nullable=True)  # Hz

    # Transcription data (encrypted for PHI)
    transcribed_text = Column(Text, nullable=False)  # Encrypted transcription
    confidence_score = Column(Float, nullable=False)  # 0.0 to 1.0
    language_detected = Column(String(10), nullable=True)  # en, es, etc.

    # Processing metadata
    transcription_service = Column(String(50), nullable=False)
    processing_time_ms = Column(Integer, nullable=True)
    was_successful = Column(Boolean, default=True, nullable=False)
    error_message = Column(Text, nullable=True)

    # User interaction
    was_accepted = Column(Boolean, nullable=True)
    final_text = Column(Text, nullable=True)  # Encrypted final text used
    edit_distance = Column(Integer, nullable=True)  # Changes made by user

    # Audit fields
    timestamp = Column(
        DateTime, default=datetime.utcnow, nullable=False, index=True
    )
    session_id = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)

    def to_dict(self) -> Dict[str, Any]:
        """Convert transcription to dictionary."""
        return {
            "id": self.id,
            "userId": self.user_id,
            "patientId": self.patient_id,
            "ivrRequestId": self.ivr_request_id,
            "formField": self.form_field,
            "audioDurationSeconds": self.audio_duration_seconds,
            "audioFormat": self.audio_format,
            "audioQuality": self.audio_quality,
            "sampleRate": self.sample_rate,
            # Note: This should be decrypted before returning
            "transcribedText": self.transcribed_text,
            "confidenceScore": self.confidence_score,
            "languageDetected": self.language_detected,
            "transcriptionService": self.transcription_service,
            "processingTimeMs": self.processing_time_ms,
            "wasSuccessful": self.was_successful,
            "errorMessage": self.error_message,
            "wasAccepted": self.was_accepted,
            # Note: This should be decrypted before returning
            "finalText": self.final_text,
            "editDistance": self.edit_distance,
            "timestamp": self.timestamp.isoformat(),
            "sessionId": self.session_id
        }


class VoiceTranscriptionSettings(Base):
    """Model for user voice transcription preferences."""

    __tablename__ = "voice_transcription_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=False, unique=True, index=True)

    # Transcription preferences
    is_enabled = Column(Boolean, default=True, nullable=False)
    preferred_language = Column(String(10), default="en", nullable=False)
    confidence_threshold = Column(Float, default=0.8, nullable=False)
    auto_accept_high_confidence = Column(
        Boolean, default=False, nullable=False
    )

    # Audio settings
    noise_reduction = Column(Boolean, default=True, nullable=False)
    auto_punctuation = Column(Boolean, default=True, nullable=False)
    speaker_adaptation = Column(Boolean, default=True, nullable=False)

    # Privacy settings
    store_audio = Column(Boolean, default=False, nullable=False)
    audio_retention_days = Column(Integer, default=30, nullable=False)

    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow,
        nullable=False
    )

    def to_dict(self) -> Dict[str, Any]:
        """Convert settings to dictionary."""
        return {
            "id": self.id,
            "userId": self.user_id,
            "isEnabled": self.is_enabled,
            "preferredLanguage": self.preferred_language,
            "confidenceThreshold": self.confidence_threshold,
            "autoAcceptHighConfidence": self.auto_accept_high_confidence,
            "noiseReduction": self.noise_reduction,
            "autoPunctuation": self.auto_punctuation,
            "speakerAdaptation": self.speaker_adaptation,
            "storeAudio": self.store_audio,
            "audioRetentionDays": self.audio_retention_days,
            "createdAt": self.created_at.isoformat(),
            "updatedAt": self.updated_at.isoformat()
        }


class VoiceTranscriptionAnalytics(Base):
    """Model for voice transcription usage analytics."""

    __tablename__ = "voice_transcription_analytics"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=False, index=True)

    # Usage metrics
    total_transcriptions = Column(Integer, default=0, nullable=False)
    successful_transcriptions = Column(Integer, default=0, nullable=False)
    total_audio_duration = Column(Float, default=0.0, nullable=False)
    average_confidence = Column(Float, nullable=True)

    # Performance metrics
    average_processing_time = Column(Float, nullable=True)  # milliseconds
    acceptance_rate = Column(Float, nullable=True)  # 0.0 to 1.0
    edit_frequency = Column(Float, nullable=True)  # edits per transcription

    # Time period
    period_start = Column(DateTime, nullable=False, index=True)
    period_end = Column(DateTime, nullable=False, index=True)
    period_type = Column(String(20), nullable=False)  # daily, weekly, monthly

    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow,
        nullable=False
    )

    def to_dict(self) -> Dict[str, Any]:
        """Convert analytics to dictionary."""
        return {
            "id": self.id,
            "userId": self.user_id,
            "totalTranscriptions": self.total_transcriptions,
            "successfulTranscriptions": self.successful_transcriptions,
            "totalAudioDuration": self.total_audio_duration,
            "averageConfidence": self.average_confidence,
            "averageProcessingTime": self.average_processing_time,
            "acceptanceRate": self.acceptance_rate,
            "editFrequency": self.edit_frequency,
            "periodStart": self.period_start.isoformat(),
            "periodEnd": self.period_end.isoformat(),
            "periodType": self.period_type,
            "createdAt": self.created_at.isoformat(),
            "updatedAt": self.updated_at.isoformat()
        }


# Default voice transcription settings
DEFAULT_VOICE_SETTINGS = {
    "isEnabled": True,
    "preferredLanguage": "en",
    "confidenceThreshold": 0.8,
    "autoAcceptHighConfidence": False,
    "noiseReduction": True,
    "autoPunctuation": True,
    "speakerAdaptation": True,
    "storeAudio": False,
    "audioRetentionDays": 30
}