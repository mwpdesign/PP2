import React from 'react';
import {
  DocumentIcon,
  XMarkIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { formatFileSize, getFileTypeCategory, isImageFile, isPDFFile } from '../../utils/fileValidation';

export interface FilePreviewProps {
  file: File;
  previewUrl?: string | null;
  status?: 'pending' | 'uploading' | 'success' | 'error';
  uploadProgress?: number;
  onRemove?: () => void;
  onView?: () => void;
  onDownload?: () => void;
  showActions?: boolean;
  compact?: boolean;
  className?: string;
}

const FilePreview: React.FC<FilePreviewProps> = ({
  file,
  previewUrl,
  status = 'pending',
  uploadProgress = 0,
  onRemove,
  onView,
  onDownload,
  showActions = true,
  compact = false,
  className = ''
}) => {
  const fileCategory = getFileTypeCategory(file);
  const isImage = isImageFile(file);
  const isPDF = isPDFFile(file);

  // Get status icon
  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'uploading':
        return (
          <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        );
      default:
        return null;
    }
  };

  // Get status text
  const getStatusText = () => {
    switch (status) {
      case 'success':
        return 'Upload successful';
      case 'error':
        return 'Upload failed';
      case 'uploading':
        return `Uploading... ${uploadProgress}%`;
      default:
        return 'Ready to upload';
    }
  };

  // Get status color
  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'uploading':
        return 'text-blue-600';
      default:
        return 'text-gray-500';
    }
  };

  if (compact) {
    return (
      <div className={`flex items-center space-x-3 p-3 bg-gray-50 rounded-lg ${className}`}>
        {/* Thumbnail */}
        <div className="flex-shrink-0">
          {previewUrl && isImage ? (
            <img
              src={previewUrl}
              alt={file.name}
              className="h-12 w-12 object-cover rounded border border-gray-200"
            />
          ) : (
            <div className="h-12 w-12 bg-gray-100 rounded flex items-center justify-center">
              <DocumentIcon className="h-6 w-6 text-gray-400" />
            </div>
          )}
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {file.name}
          </p>
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <span>{formatFileSize(file.size)}</span>
            <span>•</span>
            <span>{fileCategory}</span>
            {getStatusIcon() && (
              <>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  {getStatusIcon()}
                  <span className={getStatusColor()}>{getStatusText()}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center space-x-1">
            {onView && (
              <button
                type="button"
                onClick={onView}
                className="p-1 text-gray-400 hover:text-gray-600"
                title="View file"
              >
                <EyeIcon className="h-4 w-4" />
              </button>
            )}
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="p-1 text-gray-400 hover:text-red-600"
                title="Remove file"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {/* Preview Area */}
      <div className="relative">
        {previewUrl && isImage ? (
          <div className="relative">
            <img
              src={previewUrl}
              alt={file.name}
              className="w-full h-48 object-cover"
            />
            {onView && (
              <button
                type="button"
                onClick={onView}
                className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center"
              >
                <EyeIcon className="h-8 w-8 text-white opacity-0 hover:opacity-100 transition-opacity" />
              </button>
            )}
          </div>
        ) : (
          <div className="h-48 bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <DocumentIcon className="h-16 w-16 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">{fileCategory}</p>
              {isPDF && (
                <p className="text-xs text-gray-400 mt-1">PDF Document</p>
              )}
            </div>
          </div>
        )}

        {/* Status Overlay */}
        {status === 'uploading' && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="h-8 w-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm">Uploading... {uploadProgress}%</p>
            </div>
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {file.name}
            </h3>
            <div className="mt-1 flex items-center space-x-2 text-xs text-gray-500">
              <span>{formatFileSize(file.size)}</span>
              <span>•</span>
              <span>{fileCategory}</span>
            </div>

            {/* Status */}
            <div className="mt-2 flex items-center space-x-2">
              {getStatusIcon()}
              <span className={`text-xs font-medium ${getStatusColor()}`}>
                {getStatusText()}
              </span>
            </div>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex items-center space-x-2 ml-4">
              {onView && (
                <button
                  type="button"
                  onClick={onView}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                  title="View file"
                >
                  <EyeIcon className="h-4 w-4" />
                </button>
              )}
              {onDownload && (
                <button
                  type="button"
                  onClick={onDownload}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                  title="Download file"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                </button>
              )}
              {onRemove && (
                <button
                  type="button"
                  onClick={onRemove}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                  title="Remove file"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Upload Progress Bar */}
        {status === 'uploading' && (
          <div className="mt-3">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilePreview;