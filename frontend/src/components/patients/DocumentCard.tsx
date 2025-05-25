import React from 'react';
import { format } from 'date-fns';
import {
  DocumentIcon,
  IdentificationIcon,
  DocumentTextIcon,
  ClipboardDocumentIcon,
  PhotoIcon,
  TrashIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { Document } from '../../types/ivr';

interface DocumentCardProps {
  document: Document;
  isEditing?: boolean;
  onDelete?: (documentId: string) => void;
  onDownload?: (documentId: string) => void;
}

const formatDate = (dateValue: string | null | undefined): string => {
  if (!dateValue) return 'N/A';
  
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return 'N/A';
    return format(date, 'MMM d, yyyy');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'N/A';
  }
};

const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  isEditing = false,
  onDelete,
  onDownload
}) => {
  const getDocumentIcon = (type: Document['type']) => {
    switch (type) {
      case 'id':
        return <IdentificationIcon className="h-8 w-8 text-[#2C3E50]" />;
      case 'insurance':
        return <DocumentTextIcon className="h-8 w-8 text-[#2C3E50]" />;
      case 'facesheet':
        return <ClipboardDocumentIcon className="h-8 w-8 text-[#2C3E50]" />;
      case 'medical':
        return <DocumentIcon className="h-8 w-8 text-[#2C3E50]" />;
      default:
        return <PhotoIcon className="h-8 w-8 text-[#2C3E50]" />;
    }
  };

  const formatFileSize = (file: File | undefined) => {
    if (!file) return 'N/A';
    const bytes = file.size;
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="relative group">
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden transition-shadow hover:shadow-md">
        {/* Document Preview */}
        <div className="aspect-[3/4] relative bg-gray-50 flex items-center justify-center">
          {document.url ? (
            <img
              src={document.url}
              alt={document.name}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              {getDocumentIcon(document.type)}
            </div>
          )}
          
          {/* Hover Actions */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex space-x-2">
              <button
                onClick={() => onDownload?.(document.id)}
                className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
                title="Download Document"
              >
                <ArrowDownTrayIcon className="h-5 w-5 text-[#2C3E50]" />
              </button>
              {isEditing && (
                <button
                  onClick={() => onDelete?.(document.id)}
                  className="p-2 bg-white rounded-full shadow-lg hover:bg-red-50 transition-colors"
                  title="Delete Document"
                >
                  <TrashIcon className="h-5 w-5 text-red-600" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Document Info */}
        <div className="p-3">
          <h4 className="text-sm font-medium text-gray-900 truncate" title={document.name}>
            {document.name}
          </h4>
          <div className="mt-1 text-xs text-gray-500 space-y-0.5">
            <p>{formatFileSize(document.file)}</p>
            <p>{formatDate(document.uploadedAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentCard; 