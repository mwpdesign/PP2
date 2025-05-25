import React, { useCallback, useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { DocumentIcon, CameraIcon, XMarkIcon, CheckCircleIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

export interface DocumentUploadProps {
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
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  label,
  description,
  required = false,
  value,
  onChange,
  onUploadProgress,
  status = 'pending',
  acceptedFileTypes = ['.pdf', '.jpg', '.jpeg', '.png'],
  maxSizeMB = 10,
  showCamera = true
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error(`File size must be less than ${maxSizeMB}MB`);
        return;
      }
      
      // Create preview URL for images
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }
      
      onChange(file);
    }
  }, [maxSizeMB, onChange]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => ({
      ...acc,
      [type.startsWith('.') ? `image/${type.slice(1)}` : type]: []
    }), {}),
    maxFiles: 1,
    multiple: false,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    onDropAccepted: () => setIsDragging(false)
  });

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        mediaStreamRef.current = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      toast.error('Unable to access camera');
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

  const capturePhoto = async () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0);
    
    canvas.toBlob((blob) => {
      if (!blob) return;
      
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const previewUrl = URL.createObjectURL(file);
      setPreviewUrl(previewUrl);
      onChange(file);
      stopCamera();
    }, 'image/jpeg', 0.8);
  };

  const handleRemove = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    onChange(null);
  };

  return (
    <div className="relative bg-white rounded-lg border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-sm">
      <div className="p-3">
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-gray-900">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          {value && (
            <button
              type="button"
              onClick={handleRemove}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Remove
            </button>
          )}
        </div>

        {description && (
          <p className="text-xs text-gray-500 mb-2">{description}</p>
        )}
      </div>

      {isCameraActive ? (
        <div className="relative bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-48 object-cover"
          />
          <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-2">
            <button
              type="button"
              onClick={capturePhoto}
              className="px-3 py-1.5 bg-white rounded-full shadow-lg text-sm text-gray-900 hover:bg-gray-100"
            >
              Capture Photo
            </button>
            <button
              type="button"
              onClick={stopCamera}
              className="px-3 py-1.5 bg-red-600 rounded-full shadow-lg text-sm text-white hover:bg-red-700"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : value ? (
        <div className="p-3 bg-gray-50">
          <div className="flex items-center space-x-3">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Document preview"
                className="h-16 w-16 object-cover rounded"
              />
            ) : (
              <DocumentIcon className="h-6 w-6 text-gray-400" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {value.name}
              </p>
              <p className="text-xs text-gray-500">
                {(value.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            {status === 'success' && (
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
            )}
          </div>
          {status === 'uploading' && onUploadProgress && (
            <div className="mt-2">
              <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2C3E50] transition-all duration-300"
                  style={{ width: `${onUploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`
            p-4 transition-all cursor-pointer
            ${isDragging ? 'bg-[#2C3E50]/5' : 'hover:bg-gray-50'}
          `}
        >
          <input {...getInputProps()} ref={fileInputRef} />
          <div className="flex items-center justify-center space-x-2">
            <ArrowUpTrayIcon className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-[#2C3E50]">
              Drop file or click to upload
            </span>
            {showCamera && (
              <>
                <span className="text-gray-400">|</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    startCamera();
                  }}
                  className="inline-flex items-center text-sm text-[#2C3E50] hover:text-[#375788]"
                >
                  <CameraIcon className="h-4 w-4 mr-1" />
                  Take Photo
                </button>
              </>
            )}
          </div>
          <p className="mt-1 text-center text-xs text-gray-500">
            {acceptedFileTypes.join(', ')} up to {maxSizeMB}MB
          </p>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload; 