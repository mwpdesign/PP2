import React, { useState, useCallback, useEffect } from 'react';
import {
  MicrophoneIcon,
  StopIcon,
  PlayIcon,
  PauseIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SpeakerWaveIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { useVoiceRecording } from '../../hooks/useVoiceRecording';

export interface VoiceRecordingProps {
  onTranscriptionComplete: (text: string) => void;
  onAudioSave?: (audioBlob: Blob) => void;
  placeholder?: string;
  maxDurationMs?: number;
  className?: string;
  disabled?: boolean;
  medicalTerminologyMode?: boolean;
  autoApplyTranscription?: boolean;
  showConfidenceScore?: boolean;
  showMedicalTerms?: boolean;
  confidenceThreshold?: number;
}

const VoiceRecording: React.FC<VoiceRecordingProps> = ({
  onTranscriptionComplete,
  onAudioSave,
  placeholder = "Tap to start voice recording for medical notes...",
  maxDurationMs = 300000, // 5 minutes
  className = '',
  disabled = false,
  medicalTerminologyMode = true,
  autoApplyTranscription = false,
  showConfidenceScore = true,
  showMedicalTerms = true,
  confidenceThreshold = 0.7
}) => {
  const [showTranscript, setShowTranscript] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  // Use the voice recording hook
  const {
    state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    playAudio,
    pauseAudio,
    clearRecording,
    isSupported,
    testMicrophone
  } = useVoiceRecording({
    maxDurationMs,
    enableMedicalMode: medicalTerminologyMode,
    autoStop: true,
    confidenceThreshold,
    onTranscriptionUpdate: (transcript, isFinal) => {
      if (isFinal && autoApplyTranscription) {
        onTranscriptionComplete(transcript);
      }
    },
    onRecordingComplete: (audioBlob, transcript) => {
      onAudioSave?.(audioBlob);
      if (!autoApplyTranscription) {
        onTranscriptionComplete(transcript);
      }
      toast.success('Recording completed successfully');
    },
    onError: (error) => {
      toast.error(error);
    }
  });

  // Handle manual transcription application
  const handleApplyTranscription = useCallback(() => {
    const fullTranscript = (state.finalTranscript + ' ' + state.currentTranscript).trim();
    if (fullTranscript) {
      onTranscriptionComplete(fullTranscript);
      toast.success('Transcription applied to form');
    } else {
      toast.warning('No transcription available to apply');
    }
  }, [state.finalTranscript, state.currentTranscript, onTranscriptionComplete]);

  // Test microphone on mount
  useEffect(() => {
    if (isSupported) {
      testMicrophone().then(available => {
        if (!available) {
          toast.warning('Microphone not available. Please check permissions.');
        }
      });
    }
  }, [isSupported, testMicrophone]);

  // Format duration for display
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get confidence color
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get recording status color
  const getRecordingStatusColor = (): string => {
    if (state.error) return 'border-red-300 bg-red-50';
    if (state.isRecording && !state.isPaused) return 'border-red-300 bg-red-50';
    if (state.isPaused) return 'border-yellow-300 bg-yellow-50';
    if (state.audioBlob) return 'border-green-300 bg-green-50';
    return 'border-gray-300 bg-white';
  };

  if (!isSupported) {
    return (
      <div className={`p-4 border border-red-300 bg-red-50 rounded-lg ${className}`}>
        <div className="flex items-center space-x-2 text-red-700">
          <ExclamationTriangleIcon className="w-5 h-5" />
          <span className="text-sm font-medium">Voice recording not supported</span>
        </div>
        <p className="text-sm text-red-600 mt-1">
          Your browser doesn't support voice recording. Please use a modern browser like Chrome, Firefox, or Safari.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Recording Interface */}
      <div className={`border rounded-lg p-4 transition-all duration-200 ${getRecordingStatusColor()}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <MicrophoneIcon className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">Voice Recording</span>
            {state.isRecording && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-red-600 font-medium">REC</span>
              </div>
            )}
          </div>

          {/* Minimize/Expand Toggle */}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            disabled={disabled}
          >
            <ArrowPathIcon className={`w-4 h-4 transition-transform ${isMinimized ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {!isMinimized && (
          <>
            {/* Recording Controls */}
            <div className="flex items-center justify-center space-x-3 mb-4">
              {!state.isRecording ? (
                <button
                  onClick={startRecording}
                  disabled={disabled}
                  className="flex items-center justify-center w-12 h-12 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white rounded-full transition-colors touch-manipulation"
                  style={{ minHeight: '44px', minWidth: '44px' }}
                >
                  <MicrophoneIcon className="w-6 h-6" />
                </button>
              ) : (
                <>
                  {!state.isPaused ? (
                    <button
                      onClick={pauseRecording}
                      disabled={disabled}
                      className="flex items-center justify-center w-10 h-10 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 text-white rounded-full transition-colors touch-manipulation"
                      style={{ minHeight: '44px', minWidth: '44px' }}
                    >
                      <PauseIcon className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      onClick={resumeRecording}
                      disabled={disabled}
                      className="flex items-center justify-center w-10 h-10 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded-full transition-colors touch-manipulation"
                      style={{ minHeight: '44px', minWidth: '44px' }}
                    >
                      <PlayIcon className="w-5 h-5" />
                    </button>
                  )}

                  <button
                    onClick={stopRecording}
                    disabled={disabled}
                    className="flex items-center justify-center w-10 h-10 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 text-white rounded-full transition-colors touch-manipulation"
                    style={{ minHeight: '44px', minWidth: '44px' }}
                  >
                    <StopIcon className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Audio Playback Controls */}
              {state.audioBlob && !state.isRecording && (
                <>
                  <div className="w-px h-8 bg-gray-300"></div>

                  {!state.isPlaying ? (
                    <button
                      onClick={playAudio}
                      disabled={disabled}
                      className="flex items-center justify-center w-10 h-10 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-full transition-colors touch-manipulation"
                      style={{ minHeight: '44px', minWidth: '44px' }}
                    >
                      <SpeakerWaveIcon className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      onClick={pauseAudio}
                      disabled={disabled}
                      className="flex items-center justify-center w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-full transition-colors touch-manipulation"
                      style={{ minHeight: '44px', minWidth: '44px' }}
                    >
                      <PauseIcon className="w-5 h-5" />
                    </button>
                  )}
                </>
              )}

              {/* Clear Recording */}
              {(state.audioBlob || state.finalTranscript || state.currentTranscript) && !state.isRecording && (
                <>
                  <div className="w-px h-8 bg-gray-300"></div>

                  <button
                    onClick={clearRecording}
                    disabled={disabled}
                    className="flex items-center justify-center w-10 h-10 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white rounded-full transition-colors touch-manipulation"
                    style={{ minHeight: '44px', minWidth: '44px' }}
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Status Information */}
            <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
              <div className="flex items-center space-x-4">
                <span>Duration: {formatDuration(state.duration)}</span>
                {showConfidenceScore && state.confidence > 0 && (
                  <span className={`font-medium ${getConfidenceColor(state.confidence)}`}>
                    Confidence: {Math.round(state.confidence * 100)}%
                  </span>
                )}
              </div>

              {state.error && (
                <div className="flex items-center space-x-1 text-red-600">
                  <ExclamationTriangleIcon className="w-4 h-4" />
                  <span className="text-xs">{state.error}</span>
                </div>
              )}
            </div>

            {/* Medical Terms Detected */}
            {showMedicalTerms && state.medicalTermsDetected.length > 0 && (
              <div className="mb-3">
                <div className="text-xs text-gray-500 mb-1">Medical terms detected:</div>
                <div className="flex flex-wrap gap-1">
                  {state.medicalTermsDetected.slice(0, 5).map((term, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                    >
                      {term}
                    </span>
                  ))}
                  {state.medicalTermsDetected.length > 5 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{state.medicalTermsDetected.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Placeholder when not recording */}
        {!state.isRecording && !state.finalTranscript && !state.currentTranscript && !isMinimized && (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm">{placeholder}</p>
          </div>
        )}
      </div>

      {/* Transcription Display */}
      {(state.finalTranscript || state.currentTranscript) && showTranscript && (
        <div className="border border-gray-300 rounded-lg p-4 bg-white">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-900">Transcription</h4>
            <div className="flex items-center space-x-2">
              {!autoApplyTranscription && (
                <button
                  onClick={handleApplyTranscription}
                  disabled={disabled || (!state.finalTranscript && !state.currentTranscript)}
                  className="px-3 py-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white text-xs rounded transition-colors touch-manipulation"
                  style={{ minHeight: '44px' }}
                >
                  Apply to Form
                </button>
              )}

              <button
                onClick={() => setShowTranscript(false)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                disabled={disabled}
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {/* Final transcript */}
            {state.finalTranscript && (
              <div className="text-sm text-gray-900 leading-relaxed">
                {state.finalTranscript}
              </div>
            )}

            {/* Current (interim) transcript */}
            {state.currentTranscript && (
              <div className="text-sm text-gray-500 italic leading-relaxed">
                {state.currentTranscript}
              </div>
            )}
          </div>

          {/* Transcription Stats */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
            <span>
              {(state.finalTranscript + ' ' + state.currentTranscript).trim().split(' ').filter(w => w).length} words
            </span>
            {state.confidence > 0 && (
              <span className={getConfidenceColor(state.confidence)}>
                {Math.round(state.confidence * 100)}% confidence
              </span>
            )}
          </div>
        </div>
      )}

      {/* Help Text */}
      {!state.isRecording && !isMinimized && (
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Speak clearly and at a normal pace for best results</p>
          <p>• Medical terminology is automatically enhanced</p>
          <p>• Recording is processed locally for HIPAA compliance</p>
          {maxDurationMs && (
            <p>• Maximum recording duration: {Math.floor(maxDurationMs / 60000)} minutes</p>
          )}
        </div>
      )}
    </div>
  );
};

export default VoiceRecording;