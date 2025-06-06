import { useState, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';

export interface FileUploadState {
  file: File | null;
  previewUrl: string | null;
  uploadProgress: number;
  isUploading: boolean;
  isSuccess: boolean;
  error: string | null;
}

export interface UseFileUploadOptions {
  maxSizeMB?: number;
  acceptedFileTypes?: string[];
  onUploadComplete?: (file: File) => void;
  onUploadError?: (error: string) => void;
}

export const useFileUpload = (options: UseFileUploadOptions = {}) => {
  const {
    maxSizeMB = 10,
    acceptedFileTypes = ['.pdf', '.jpg', '.jpeg', '.png'],
    onUploadComplete,
    onUploadError
  } = options;

  const [state, setState] = useState<FileUploadState>({
    file: null,
    previewUrl: null,
    uploadProgress: 0,
    isUploading: false,
    isSuccess: false,
    error: null
  });

  const timeoutRef = useRef<NodeJS.Timeout>();

  // Validate file
  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File size must be less than ${maxSizeMB}MB`;
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedFileTypes.includes(fileExtension)) {
      return `File type not supported. Accepted types: ${acceptedFileTypes.join(', ')}`;
    }

    return null;
  }, [maxSizeMB, acceptedFileTypes]);

  // Simulate upload progress
  const simulateUpload = useCallback(async (file: File) => {
    setState(prev => ({ ...prev, isUploading: true, uploadProgress: 0, error: null }));

    try {
      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 20) {
        setState(prev => ({ ...prev, uploadProgress: progress }));
        await new Promise(resolve => setTimeout(resolve, 150));
      }

      // Mark as successful
      setState(prev => ({
        ...prev,
        isUploading: false,
        isSuccess: true,
        uploadProgress: 100
      }));

      toast.success(`${file.name} uploaded successfully`);
      onUploadComplete?.(file);

      // Reset success state after 2 seconds
      timeoutRef.current = setTimeout(() => {
        setState(prev => ({
          ...prev,
          isSuccess: false,
          uploadProgress: 0
        }));
      }, 2000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setState(prev => ({
        ...prev,
        isUploading: false,
        error: errorMessage,
        uploadProgress: 0
      }));
      toast.error(errorMessage);
      onUploadError?.(errorMessage);
    }
  }, [onUploadComplete, onUploadError]);

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setState(prev => ({ ...prev, error: validationError }));
      toast.error(validationError);
      return false;
    }

    // Clean up previous preview URL
    if (state.previewUrl) {
      URL.revokeObjectURL(state.previewUrl);
    }

    // Create preview URL for images
    let previewUrl: string | null = null;
    if (file.type.startsWith('image/')) {
      previewUrl = URL.createObjectURL(file);
    }

    // Update state
    setState(prev => ({
      ...prev,
      file,
      previewUrl,
      error: null,
      isSuccess: false
    }));

    // Start upload simulation
    await simulateUpload(file);
    return true;
  }, [validateFile, simulateUpload, state.previewUrl]);

  // Remove file
  const removeFile = useCallback(() => {
    if (state.previewUrl) {
      URL.revokeObjectURL(state.previewUrl);
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setState({
      file: null,
      previewUrl: null,
      uploadProgress: 0,
      isUploading: false,
      isSuccess: false,
      error: null
    });
  }, [state.previewUrl]);

  // Reset state
  const reset = useCallback(() => {
    removeFile();
  }, [removeFile]);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (state.previewUrl) {
      URL.revokeObjectURL(state.previewUrl);
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, [state.previewUrl]);

  return {
    ...state,
    handleFileSelect,
    removeFile,
    reset,
    cleanup,
    validateFile
  };
};