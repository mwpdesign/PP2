import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { CloudArrowUpIcon, CameraIcon, DocumentIcon } from '@heroicons/react/24/outline';

interface DocumentUploadProps {
  onUpload: (files: File[]) => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ onUpload }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onUpload(acceptedFiles);
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf']
    }
  });

  // Check if the device has camera capabilities
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  const showCameraOption = isMobile && hasGetUserMedia;

  return (
    <div
      {...getRootProps()}
      className={`
        aspect-[3/4] rounded-lg border-2 border-dashed transition-colors cursor-pointer
        flex flex-col items-center justify-center p-6 text-center
        ${isDragActive 
          ? 'border-[#2C3E50] bg-[#2C3E50]/5' 
          : 'border-gray-300 hover:border-[#2C3E50] hover:bg-gray-50'
        }
      `}
    >
      <input 
        {...getInputProps()} 
        capture={showCameraOption ? "environment" : undefined}
        className="hidden"
      />
      
      {isDragActive ? (
        <>
          <CloudArrowUpIcon className="h-12 w-12 mb-4 text-[#2C3E50]" />
          <p className="text-sm font-medium text-gray-900">Drop files here</p>
        </>
      ) : (
        <>
          <div className="flex items-center space-x-4 mb-4">
            <DocumentIcon className="h-12 w-12 text-gray-400" />
            {showCameraOption && (
              <div className="w-px h-8 bg-gray-200" />
            )}
            {showCameraOption && (
              <CameraIcon className="h-12 w-12 text-gray-400" />
            )}
          </div>
          <p className="text-sm font-medium text-gray-900">
            Upload Documents
          </p>
          <div className="mt-2 space-y-1">
            <p className="text-xs text-gray-500">
              Drag & drop files or click to browse
            </p>
            {showCameraOption && (
              <p className="text-xs text-gray-500">
                Take a photo with your camera
              </p>
            )}
            <p className="text-xs text-gray-400">
              Supported formats: PDF, JPEG, PNG
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default DocumentUpload; 