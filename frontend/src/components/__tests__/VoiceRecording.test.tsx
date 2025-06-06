import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VoiceRecordingComponent } from '../mobile/VoiceRecordingComponent';
import { useVoiceRecording } from '../../hooks/useVoiceRecording';
import { renderHook, act } from '@testing-library/react';

// Mock Web APIs
const mockMediaRecorder = {
  start: vi.fn(),
  stop: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  state: 'inactive'
};

const mockGetUserMedia = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();

  // Mock MediaRecorder
  global.MediaRecorder = vi.fn(() => mockMediaRecorder) as any;
  global.MediaRecorder.isTypeSupported = vi.fn(() => true);

  // Mock getUserMedia
  global.navigator.mediaDevices = {
    getUserMedia: mockGetUserMedia
  } as any;

  // Mock URL.createObjectURL
  global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  global.URL.revokeObjectURL = vi.fn();
});

describe('VoiceRecordingComponent', () => {
  const mockProps = {
    onRecordingComplete: vi.fn(),
    onTranscriptionComplete: vi.fn(),
    maxDuration: 300, // 5 minutes
    autoTranscribe: true
  };

  it('should render voice recording interface', () => {
    render(<VoiceRecordingComponent {...mockProps} />);

    expect(screen.getByRole('button', { name: /start recording/i })).toBeInTheDocument();
    expect(screen.getByText(/tap to start recording/i)).toBeInTheDocument();
  });

  it('should request microphone permissions', async () => {
    mockGetUserMedia.mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }]
    });

    render(<VoiceRecordingComponent {...mockProps} />);

    const startButton = screen.getByRole('button', { name: /start recording/i });
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true });
    });
  });

  it('should handle recording start and stop', async () => {
    mockGetUserMedia.mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }]
    });

    render(<VoiceRecordingComponent {...mockProps} />);

    const startButton = screen.getByRole('button', { name: /start recording/i });
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(mockMediaRecorder.start).toHaveBeenCalled();
      expect(screen.getByRole('button', { name: /stop recording/i })).toBeInTheDocument();
    });

    const stopButton = screen.getByRole('button', { name: /stop recording/i });
    fireEvent.click(stopButton);

    expect(mockMediaRecorder.stop).toHaveBeenCalled();
  });

  it('should display recording duration', async () => {
    render(<VoiceRecordingComponent {...mockProps} />);

    // Mock recording in progress
    const { rerender } = render(
      <VoiceRecordingComponent {...mockProps} />
    );

    // Simulate recording state
    await waitFor(() => {
      expect(screen.getByText(/00:00/)).toBeInTheDocument();
    });
  });

  it('should handle maximum duration limit', async () => {
    const shortDurationProps = { ...mockProps, maxDuration: 5 }; // 5 seconds

    render(<VoiceRecordingComponent {...shortDurationProps} />);

    // Start recording
    const startButton = screen.getByRole('button', { name: /start recording/i });
    fireEvent.click(startButton);

    // Simulate time passing
    await waitFor(() => {
      expect(mockMediaRecorder.stop).toHaveBeenCalled();
    }, { timeout: 6000 });
  });
});

describe('useVoiceRecording Hook', () => {
  it('should provide voice recording functionality', async () => {
    const { result } = renderHook(() => useVoiceRecording());

    expect(result.current.isRecording).toBe(false);
    expect(result.current.duration).toBe(0);
    expect(result.current.audioBlob).toBeNull();

    // Test start recording
    act(() => {
      result.current.startRecording();
    });

    expect(result.current.isRecording).toBe(true);
  });

  it('should handle recording errors gracefully', async () => {
    mockGetUserMedia.mockRejectedValue(new Error('Permission denied'));

    const { result } = renderHook(() => useVoiceRecording());

    act(() => {
      result.current.startRecording();
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Permission denied');
      expect(result.current.isRecording).toBe(false);
    });
  });

  it('should provide audio playback functionality', async () => {
    const { result } = renderHook(() => useVoiceRecording());

    const mockAudioBlob = new Blob(['audio data'], { type: 'audio/wav' });

    act(() => {
      result.current.setAudioBlob(mockAudioBlob);
    });

    expect(result.current.audioBlob).toBe(mockAudioBlob);
    expect(result.current.canPlayback).toBe(true);
  });
});

describe('Mobile-First Features', () => {
  it('should handle touch interactions', () => {
    render(<VoiceRecordingComponent {...mockProps} />);

    const recordButton = screen.getByRole('button', { name: /start recording/i });

    // Test touch events
    fireEvent.touchStart(recordButton);
    fireEvent.touchEnd(recordButton);

    expect(mockMediaRecorder.start).toHaveBeenCalled();
  });

  it('should provide haptic feedback on supported devices', () => {
    // Mock vibration API
    global.navigator.vibrate = vi.fn();

    render(<VoiceRecordingComponent {...mockProps} />);

    const recordButton = screen.getByRole('button', { name: /start recording/i });
    fireEvent.click(recordButton);

    expect(global.navigator.vibrate).toHaveBeenCalledWith(50);
  });

  it('should adapt to device orientation', () => {
    // Mock orientation change
    Object.defineProperty(screen, 'orientation', {
      writable: true,
      value: { angle: 90 }
    });

    render(<VoiceRecordingComponent {...mockProps} />);

    // Trigger orientation change
    fireEvent(window, new Event('orientationchange'));

    // Should maintain usability in landscape mode
    expect(screen.getByRole('button', { name: /start recording/i })).toBeInTheDocument();
  });

  it('should handle background/foreground transitions', () => {
    render(<VoiceRecordingComponent {...mockProps} />);

    // Start recording
    const startButton = screen.getByRole('button', { name: /start recording/i });
    fireEvent.click(startButton);

    // Simulate app going to background
    fireEvent(document, new Event('visibilitychange'));
    Object.defineProperty(document, 'hidden', { value: true, writable: true });

    // Should pause recording when app goes to background
    expect(mockMediaRecorder.pause).toHaveBeenCalled();
  });
});

describe('Audio Quality and Compression', () => {
  it('should use optimal audio settings for mobile', () => {
    render(<VoiceRecordingComponent {...mockProps} />);

    const startButton = screen.getByRole('button', { name: /start recording/i });
    fireEvent.click(startButton);

    expect(mockGetUserMedia).toHaveBeenCalledWith({
      audio: {
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true
      }
    });
  });

  it('should compress audio for efficient storage', async () => {
    const { result } = renderHook(() => useVoiceRecording());

    const mockAudioBlob = new Blob(['large audio data'], { type: 'audio/wav' });

    act(() => {
      result.current.compressAudio(mockAudioBlob);
    });

    await waitFor(() => {
      expect(result.current.compressedBlob).toBeDefined();
      expect(result.current.compressionRatio).toBeGreaterThan(0);
    });
  });
});

describe('Transcription Integration', () => {
  it('should automatically transcribe recordings when enabled', async () => {
    const transcriptionProps = { ...mockProps, autoTranscribe: true };

    render(<VoiceRecordingComponent {...transcriptionProps} />);

    // Complete a recording
    const startButton = screen.getByRole('button', { name: /start recording/i });
    fireEvent.click(startButton);

    const stopButton = screen.getByRole('button', { name: /stop recording/i });
    fireEvent.click(stopButton);

    await waitFor(() => {
      expect(mockProps.onTranscriptionComplete).toHaveBeenCalled();
    });
  });

  it('should handle transcription errors gracefully', async () => {
    // Mock transcription service error
    vi.mock('../../services/TranscriptionService', () => ({
      transcribeAudio: vi.fn().mockRejectedValue(new Error('Transcription failed'))
    }));

    render(<VoiceRecordingComponent {...mockProps} />);

    // Complete a recording
    const startButton = screen.getByRole('button', { name: /start recording/i });
    fireEvent.click(startButton);

    const stopButton = screen.getByRole('button', { name: /stop recording/i });
    fireEvent.click(stopButton);

    await waitFor(() => {
      expect(screen.getByText(/transcription failed/i)).toBeInTheDocument();
    });
  });

  it('should provide confidence scores for transcriptions', async () => {
    const mockTranscription = {
      text: 'Patient has wound on left leg',
      confidence: 0.92,
      segments: [
        { text: 'Patient has wound', confidence: 0.95 },
        { text: 'on left leg', confidence: 0.89 }
      ]
    };

    const { result } = renderHook(() => useVoiceRecording());

    act(() => {
      result.current.setTranscription(mockTranscription);
    });

    expect(result.current.transcription.confidence).toBe(0.92);
    expect(result.current.transcription.segments).toHaveLength(2);
  });
});

describe('Accessibility Features', () => {
  it('should provide screen reader support', () => {
    render(<VoiceRecordingComponent {...mockProps} />);

    const recordButton = screen.getByRole('button', { name: /start recording/i });

    expect(recordButton).toHaveAttribute('aria-label');
    expect(recordButton).toHaveAttribute('aria-describedby');
  });

  it('should support keyboard navigation', () => {
    render(<VoiceRecordingComponent {...mockProps} />);

    const recordButton = screen.getByRole('button', { name: /start recording/i });

    // Test keyboard activation
    fireEvent.keyDown(recordButton, { key: 'Enter' });
    expect(mockMediaRecorder.start).toHaveBeenCalled();

    fireEvent.keyDown(recordButton, { key: ' ' });
    expect(mockMediaRecorder.stop).toHaveBeenCalled();
  });

  it('should provide visual feedback for recording state', () => {
    render(<VoiceRecordingComponent {...mockProps} />);

    const recordButton = screen.getByRole('button', { name: /start recording/i });
    fireEvent.click(recordButton);

    // Should show visual recording indicator
    expect(screen.getByTestId('recording-indicator')).toBeInTheDocument();
    expect(screen.getByTestId('recording-indicator')).toHaveClass('animate-pulse');
  });
});

describe('Performance Optimization', () => {
  it('should efficiently manage memory usage', async () => {
    const { result } = renderHook(() => useVoiceRecording());

    // Create multiple recordings
    for (let i = 0; i < 5; i++) {
      act(() => {
        result.current.startRecording();
        result.current.stopRecording();
      });
    }

    // Should clean up old recordings
    expect(result.current.recordingHistory).toHaveLength(3); // Keep only last 3
  });

  it('should handle concurrent recording attempts', async () => {
    const { result } = renderHook(() => useVoiceRecording());

    act(() => {
      result.current.startRecording();
      result.current.startRecording(); // Second attempt should be ignored
    });

    expect(mockMediaRecorder.start).toHaveBeenCalledTimes(1);
  });
});