import React, { useCallback, useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  DocumentIcon,
  CameraIcon,
  XMarkIcon,
  CheckCircleIcon,
  ArrowUpTrayIcon,
  ExclamationTriangleIcon,
  FolderOpenIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

export interface UniversalFileUploadProps {
  label: string;
  description?: string;
  required?: boolean;
  value?: File | null;
  onChange: (file: File | null) => void;
  onUploadProgress?: (progress: number) => void;
  status?: 'pending' | 'uploading' | 'success' | 'error';
  acceptedFileTypes?: string[];
  maxSizeMB?: number;
  showCamera?: boolean;
  multiple?: boolean;
  className?: string;
  disabled?: boolean;
}

const UniversalFileUpload: React.FC<UniversalFileUploadProps> = ({
  label,
  description,
  required = false,
  value,
  onChange,
  onUploadProgress,
  status = 'pending',
  acceptedFileTypes = ['.pdf', '.jpg', '.jpeg', '.png'],
  maxSizeMB = 10,
  showCamera = true,
  multiple = false,
  className = '',
  disabled = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('environment');
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Handle file validation
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

  // Simulate upload progress for immediate feedback
  const simulateUpload = useCallback(async (file: File) => {
    setUploadProgress(0);

    // Simulate upload progress
    for (let progress = 0; progress <= 100; progress += 20) {
      setUploadProgress(progress);
      onUploadProgress?.(progress);
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    // Show success state
    setShowSuccess(true);
    toast.success(`${file.name} uploaded successfully`);

    // Reset success state after 2 seconds
    setTimeout(() => {
      setShowSuccess(false);
      setUploadProgress(0);
    }, 2000);
  }, [onUploadProgress]);

  // Handle file drop
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];

      // Validate file
      const validationError = validateFile(file);
      if (validationError) {
        toast.error(validationError);
        return;
      }

      // Create preview URL for images
      if (file.type.startsWith('image/')) {
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }

      // Immediate feedback
      onChange(file);
      await simulateUpload(file);
    }
  }, [validateFile, onChange, simulateUpload, previewUrl]);

  // Drag handlers with immediate visual feedback
  const handleDragEnter = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  // Create accept object for react-dropzone
  const acceptObject = acceptedFileTypes.reduce((acc, type) => {
    if (type === '.pdf') {
      return { ...acc, 'application/pdf': ['.pdf'] };
    } else if (['.jpg', '.jpeg', '.png', '.tiff'].includes(type)) {
      return { ...acc, 'image/*': ['.jpg', '.jpeg', '.png', '.tiff'] };
    } else if (['.doc', '.docx'].includes(type)) {
      return { ...acc, 'application/msword': ['.doc', '.docx'] };
    }
    return acc;
  }, {});

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: acceptObject,
    maxFiles: multiple ? undefined : 1,
    multiple,
    disabled,
    onDragEnter: handleDragEnter,
    onDragLeave: handleDragLeave,
    onDragOver: handleDragOver
  });

  // Camera functionality
  const startCamera = async () => {
    try {
      const constraints = {
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        mediaStreamRef.current = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      toast.error('Unable to access camera. Please check permissions.');
      console.error('Camera access error:', err);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const switchCamera = () => {
    setCameraFacing(prev => prev === 'user' ? 'environment' : 'user');
    if (isCameraActive) {
      stopCamera();
      setTimeout(startCamera, 100);
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0);

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const timestamp = new Date().toISOString().split('T')[0];
      const file = new File([blob], `photo-${timestamp}-${Date.now()}.jpg`, { type: 'image/jpeg' });

      const previewUrl = URL.createObjectURL(file);
      setPreviewUrl(previewUrl);
      onChange(file);
      stopCamera();

      await simulateUpload(file);
    }, 'image/jpeg', 0.9);
  };

  // File browser click handler
  const handleBrowseClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemove = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setShowSuccess(false);
    setUploadProgress(0);
    onChange(null);
  };

  // Status indicator
  const getStatusIcon = () => {
    if (showSuccess || status === 'success') {
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    }
    if (status === 'error') {
      return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
    }
    if (status === 'uploading' || uploadProgress > 0) {
      return (
        <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      );
    }
    return null;
  };

  return (
    <div className={`relative bg-white rounded-lg border-2 transition-all duration-200 ${
      isDragging
        ? 'border-blue-500 bg-blue-50 shadow-lg'
        : value
          ? 'border-green-200 bg-green-50'
          : 'border-gray-200 hover:border-gray-300'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>

      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-semibold text-gray-900">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            {getStatusIcon()}
          </div>
          {value && !disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Remove
            </button>
          )}
        </div>

        {description && (
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        )}
      </div>

      {/* Camera View */}
      {isCameraActive ? (
        <div className="relative bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-64 object-cover"
          />
          <div className="absolute top-2 right-2">
            <button
              type="button"
              onClick={switchCamera}
              className="px-3 py-1.5 bg-black/50 text-white rounded-full text-sm hover:bg-black/70"
            >
              Switch Camera
            </button>
          </div>
          <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-3">
            <button
              type="button"
              onClick={capturePhoto}
              className="px-6 py-2 bg-white rounded-full shadow-lg text-sm font-medium text-gray-900 hover:bg-gray-100 flex items-center space-x-2"
            >
              <PhotoIcon className="h-4 w-4" />
              <span>Capture Photo</span>
            </button>
            <button
              type="button"
              onClick={stopCamera}
              className="px-6 py-2 bg-red-600 rounded-full shadow-lg text-sm font-medium text-white hover:bg-red-700"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : value ? (
        /* File Preview */
        <div className="p-4">
          <div className="flex items-center space-x-4">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Document preview"
                className="h-20 w-20 object-cover rounded-lg border border-gray-200"
              />
            ) : (
              <div className="h-20 w-20 bg-gray-100 rounded-lg flex items-center justify-center">
                <DocumentIcon className="h-8 w-8 text-gray-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {value.name}
              </p>
              <p className="text-sm text-gray-500">
                {(value.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <p className="text-xs text-green-600 font-medium">
                ✓ Upload successful
              </p>
            </div>
          </div>

          {/* Upload Progress */}
          {(status === 'uploading' || uploadProgress > 0) && uploadProgress < 100 && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Upload Area */
        <div className="p-6">
          {/* Drag and Drop Zone */}
          <div
            {...getRootProps()}
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer
              ${isDragging
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }
              ${disabled ? 'cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} ref={fileInputRef} />

            <div className="space-y-4">
              {/* Drop Zone Icon */}
              <div className="flex justify-center">
                <ArrowUpTrayIcon className={`h-12 w-12 ${
                  isDragging ? 'text-blue-500' : 'text-gray-400'
                }`} />
              </div>

              {/* Main Message */}
              <div>
                <p className={`text-lg font-medium ${
                  isDragging ? 'text-blue-600' : 'text-gray-900'
                }`}>
                  {isDragging ? 'Drop your file here' : 'Drag and drop your file here'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {acceptedFileTypes.join(', ')} up to {maxSizeMB}MB
                </p>
              </div>
            </div>
          </div>

          {/* Upload Methods */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Browse Files Button */}
            <button
              type="button"
              onClick={handleBrowseClick}
              disabled={disabled}
              className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FolderOpenIcon className="h-5 w-5 mr-2" />
              Browse Files
            </button>

            {/* Camera Button */}
            {showCamera && (
              <button
                type="button"
                onClick={startCamera}
                disabled={disabled}
                className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <CameraIcon className="h-5 w-5 mr-2" />
                Take Photo
              </button>
            )}
          </div>

          {/* Help Text */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Choose any method above to upload your document
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UniversalFileUpload;