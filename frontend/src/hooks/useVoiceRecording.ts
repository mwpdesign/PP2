import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'react-toastify';
import voiceToTextService, {
  TranscriptionResult,
  VoiceToTextError,
  VoiceRecognitionConfig
} from '../services/voiceToTextService';

export interface VoiceRecordingState {
  isRecording: boolean;
  isPaused: boolean;
  isPlaying: boolean;
  currentTranscript: string;
  finalTranscript: string;
  confidence: number;
  duration: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  error: string | null;
  medicalTermsDetected: string[];
}

export interface VoiceRecordingOptions {
  maxDurationMs?: number;
  enableMedicalMode?: boolean;
  autoStop?: boolean;
  confidenceThreshold?: number;
  language?: string;
  onTranscriptionUpdate?: (transcript: string, isFinal: boolean) => void;
  onRecordingComplete?: (audioBlob: Blob, transcript: string) => void;
  onError?: (error: string) => void;
}

export interface UseVoiceRecordingReturn {
  state: VoiceRecordingState;
  startRecording: () => Promise<boolean>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  playAudio: () => void;
  pauseAudio: () => void;
  clearRecording: () => void;
  isSupported: boolean;
  testMicrophone: () => Promise<boolean>;
  updateConfig: (config: Partial<VoiceRecognitionConfig>) => void;
}

export const useVoiceRecording = (
  options: VoiceRecordingOptions = {}
): UseVoiceRecordingReturn => {
  const {
    maxDurationMs = 300000, // 5 minutes
    enableMedicalMode = true,
    autoStop = true,
    confidenceThreshold = 0.7,
    language = 'en-US',
    onTranscriptionUpdate,
    onRecordingComplete,
    onError
  } = options;

  // State management
  const [state, setState] = useState<VoiceRecordingState>({
    isRecording: false,
    isPaused: false,
    isPlaying: false,
    currentTranscript: '',
    finalTranscript: '',
    confidence: 0,
    duration: 0,
    audioBlob: null,
    audioUrl: null,
    error: null,
    medicalTermsDetected: []
  });

  // Refs for managing recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const startTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const maxDurationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if voice recording is supported
  const isSupported = voiceToTextService.isSupported() &&
    typeof MediaRecorder !== 'undefined' &&
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia;

  // Initialize voice recognition configuration
  useEffect(() => {
    voiceToTextService.updateConfig({
      language,
      medicalTerminologyMode: enableMedicalMode,
      confidenceThreshold,
      continuous: true,
      interimResults: true,
      maxAlternatives: 3
    });
  }, [language, enableMedicalMode, confidenceThreshold]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    // Stop voice recognition
    if (voiceToTextService.getIsListening()) {
      voiceToTextService.stopListening();
    }

    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Clear intervals and timeouts
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    if (maxDurationTimeoutRef.current) {
      clearTimeout(maxDurationTimeoutRef.current);
      maxDurationTimeoutRef.current = null;
    }

    // Cleanup audio URL
    if (state.audioUrl) {
      URL.revokeObjectURL(state.audioUrl);
    }
  }, [state.audioUrl]);

  // Start duration tracking
  const startDurationTracking = useCallback(() => {
    startTimeRef.current = Date.now();

    durationIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      setState(prev => ({ ...prev, duration: elapsed }));
    }, 100);

    // Auto-stop after max duration
    if (autoStop && maxDurationMs > 0) {
      maxDurationTimeoutRef.current = setTimeout(() => {
        stopRecording();
        toast.warning(`Recording stopped automatically after ${maxDurationMs / 1000} seconds`);
      }, maxDurationMs);
    }
  }, [autoStop, maxDurationMs]);

  // Stop duration tracking
  const stopDurationTracking = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    if (maxDurationTimeoutRef.current) {
      clearTimeout(maxDurationTimeoutRef.current);
      maxDurationTimeoutRef.current = null;
    }
  }, []);

  // Handle transcription results
  const handleTranscriptionResult = useCallback((result: TranscriptionResult) => {
    setState(prev => ({
      ...prev,
      currentTranscript: result.isFinal ? '' : result.text,
      finalTranscript: result.isFinal ? prev.finalTranscript + result.text + ' ' : prev.finalTranscript,
      confidence: result.confidence,
      medicalTermsDetected: result.medicalTermsDetected || [],
      error: null
    }));

    // Notify parent component
    onTranscriptionUpdate?.(
      result.isFinal ? result.text : result.text,
      result.isFinal
    );
  }, [onTranscriptionUpdate]);

  // Handle transcription errors
  const handleTranscriptionError = useCallback((error: VoiceToTextError) => {
    const errorMessage = error.message;

    setState(prev => ({ ...prev, error: errorMessage }));
    onError?.(errorMessage);

    if (!error.recoverable) {
      stopRecording();
    }

    toast.error(errorMessage);
  }, [onError]);

  // Handle transcription end
  const handleTranscriptionEnd = useCallback(() => {
    // Voice recognition ended, but we might want to restart it if still recording
    if (state.isRecording && !state.isPaused) {
      // Restart voice recognition
      setTimeout(() => {
        if (state.isRecording && !state.isPaused) {
          voiceToTextService.startListening(
            handleTranscriptionResult,
            handleTranscriptionError,
            handleTranscriptionEnd
          );
        }
      }, 100);
    }
  }, [state.isRecording, state.isPaused, handleTranscriptionResult, handleTranscriptionError]);

  // Start recording
  const startRecording = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      const error = 'Voice recording not supported in this browser';
      setState(prev => ({ ...prev, error }));
      onError?.(error);
      toast.error(error);
      return false;
    }

    if (state.isRecording) {
      return false;
    }

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });

      streamRef.current = stream;

      // Initialize MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Set up MediaRecorder event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType
        });
        const audioUrl = URL.createObjectURL(audioBlob);

        setState(prev => ({
          ...prev,
          audioBlob,
          audioUrl: prev.audioUrl ? URL.revokeObjectURL(prev.audioUrl) || audioUrl : audioUrl,
          isRecording: false,
          isPaused: false
        }));

        // Notify parent component
        onRecordingComplete?.(audioBlob, state.finalTranscript.trim());
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms

      // Start voice recognition
      const voiceStarted = voiceToTextService.startListening(
        handleTranscriptionResult,
        handleTranscriptionError,
        handleTranscriptionEnd
      );

      if (!voiceStarted) {
        throw new Error('Failed to start voice recognition');
      }

      // Update state
      setState(prev => ({
        ...prev,
        isRecording: true,
        isPaused: false,
        error: null,
        currentTranscript: '',
        finalTranscript: '',
        confidence: 0,
        duration: 0,
        medicalTermsDetected: []
      }));

      // Start duration tracking
      startDurationTracking();

      toast.success('Recording started');
      return true;

    } catch (error) {
      console.error('Failed to start recording:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start recording';
      setState(prev => ({ ...prev, error: errorMessage }));
      onError?.(errorMessage);
      toast.error(errorMessage);

      // Cleanup on error
      cleanup();
      return false;
    }
  }, [
    isSupported,
    state.isRecording,
    state.finalTranscript,
    onError,
    onRecordingComplete,
    handleTranscriptionResult,
    handleTranscriptionError,
    handleTranscriptionEnd,
    startDurationTracking,
    cleanup
  ]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (!state.isRecording) {
      return;
    }

    // Stop voice recognition
    voiceToTextService.stopListening();

    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Stop duration tracking
    stopDurationTracking();

    toast.success('Recording stopped');
  }, [state.isRecording, stopDurationTracking]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (!state.isRecording || state.isPaused) {
      return;
    }

    // Pause voice recognition
    voiceToTextService.stopListening();

    // Pause media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
    }

    // Stop duration tracking
    stopDurationTracking();

    setState(prev => ({ ...prev, isPaused: true }));
    toast.info('Recording paused');
  }, [state.isRecording, state.isPaused, stopDurationTracking]);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (!state.isRecording || !state.isPaused) {
      return;
    }

    // Resume voice recognition
    voiceToTextService.startListening(
      handleTranscriptionResult,
      handleTranscriptionError,
      handleTranscriptionEnd
    );

    // Resume media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
    }

    // Resume duration tracking
    startDurationTracking();

    setState(prev => ({ ...prev, isPaused: false }));
    toast.info('Recording resumed');
  }, [
    state.isRecording,
    state.isPaused,
    handleTranscriptionResult,
    handleTranscriptionError,
    handleTranscriptionEnd,
    startDurationTracking
  ]);

  // Play audio
  const playAudio = useCallback(() => {
    if (!state.audioUrl || state.isPlaying) {
      return;
    }

    if (!audioElementRef.current) {
      audioElementRef.current = new Audio();
    }

    const audio = audioElementRef.current;
    audio.src = state.audioUrl;

    audio.onplay = () => {
      setState(prev => ({ ...prev, isPlaying: true }));
    };

    audio.onpause = () => {
      setState(prev => ({ ...prev, isPlaying: false }));
    };

    audio.onended = () => {
      setState(prev => ({ ...prev, isPlaying: false }));
    };

    audio.onerror = () => {
      setState(prev => ({ ...prev, isPlaying: false, error: 'Failed to play audio' }));
      toast.error('Failed to play audio');
    };

    audio.play().catch(error => {
      console.error('Failed to play audio:', error);
      setState(prev => ({ ...prev, error: 'Failed to play audio' }));
      toast.error('Failed to play audio');
    });
  }, [state.audioUrl, state.isPlaying]);

  // Pause audio
  const pauseAudio = useCallback(() => {
    if (audioElementRef.current && state.isPlaying) {
      audioElementRef.current.pause();
    }
  }, [state.isPlaying]);

  // Clear recording
  const clearRecording = useCallback(() => {
    // Stop any ongoing recording
    if (state.isRecording) {
      stopRecording();
    }

    // Stop any playing audio
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }

    // Cleanup audio URL
    if (state.audioUrl) {
      URL.revokeObjectURL(state.audioUrl);
    }

    // Reset state
    setState({
      isRecording: false,
      isPaused: false,
      isPlaying: false,
      currentTranscript: '',
      finalTranscript: '',
      confidence: 0,
      duration: 0,
      audioBlob: null,
      audioUrl: null,
      error: null,
      medicalTermsDetected: []
    });

    // Clear audio chunks
    audioChunksRef.current = [];

    toast.info('Recording cleared');
  }, [state.isRecording, state.audioUrl, stopRecording]);

  // Test microphone
  const testMicrophone = useCallback(async (): Promise<boolean> => {
    return await voiceToTextService.testMicrophone();
  }, []);

  // Update configuration
  const updateConfig = useCallback((config: Partial<VoiceRecognitionConfig>) => {
    voiceToTextService.updateConfig(config);
  }, []);

  return {
    state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    playAudio,
    pauseAudio,
    clearRecording,
    isSupported,
    testMicrophone,
    updateConfig
  };
};