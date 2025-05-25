import React, { useState, useRef, useEffect } from 'react';
import { CloudArrowUpIcon, CameraIcon, DocumentIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface DocumentUploadProps {
  label: string;
  required?: boolean;
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  acceptedFileTypes?: string;
  selectedFile?: File | null;
  previewUrl?: string;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  label,
  required = false,
  onFileSelect,
  onFileRemove,
  acceptedFileTypes = "image/*,.pdf",
  selectedFile,
  previewUrl
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [hasCameraSupport, setHasCameraSupport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check for camera support
    const checkCameraSupport = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasCamera = devices.some(device => device.kind === 'videoinput');
        setHasCameraSupport(hasCamera);
      } catch (error) {
        console.error('Error checking camera support:', error);
        setHasCameraSupport(false);
      }
    };

    checkCameraSupport();
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Here you would typically open a modal with camera preview
      // For now, we'll just use the file input
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div
        ref={dropZoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-4
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${selectedFile ? 'bg-gray-50' : 'hover:bg-gray-50'}
          transition-colors duration-150 ease-in-out
        `}
      >
        {selectedFile ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0">
              <DocumentIcon className="h-5 w-5 flex-shrink-0 text-gray-400" />
              <span className="text-sm text-gray-600 truncate">{selectedFile.name}</span>
              {previewUrl && selectedFile.type.startsWith('image/') && (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="h-8 w-8 object-cover rounded"
                />
              )}
            </div>
            <button
              type="button"
              onClick={onFileRemove}
              className="ml-2 flex-shrink-0 text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Choose file
            </button>
            {hasCameraSupport && (
              <>
                <span>or</span>
                <button
                  type="button"
                  onClick={handleCameraCapture}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  <CameraIcon className="h-5 w-5 inline-block mr-1" />
                  Take photo
                </button>
              </>
            )}
            <span className="text-xs text-gray-500">or drag and drop</span>
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFileTypes}
          onChange={handleFileSelect}
          className="hidden"
          capture={hasCameraSupport ? "environment" : undefined}
        />
      </div>
    </div>
  );
};

export default DocumentUpload; 