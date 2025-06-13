import React, { useState, useCallback } from 'react';
import {
  DocumentIcon,
  PhotoIcon,
  EyeIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { TreatmentDocument } from '../../types/treatments';
import UniversalFileUpload from '../shared/UniversalFileUpload';

interface UploadFile {
  id: string;
  file: File;
  preview?: string;
  documentType: TreatmentDocument['document_type'];
}

interface DocumentUploadProps {
  onFilesChange: (files: UploadFile[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  disabled?: boolean;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onFilesChange,
  maxFiles = 5,
  maxFileSize = 10,
  disabled = false
}) => {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [currentUploadFile, setCurrentUploadFile] = useState<File | null>(null);

  const documentTypes = [
    { value: 'before_photo', label: 'Before Treatment Photo' },
    { value: 'after_photo', label: 'After Treatment Photo' },
    { value: 'graft_sticker', label: 'Graft Sticker Photo' },
    { value: 'usage_log', label: 'Usage Log Photo' },
    { value: 'other', label: 'Other Document' }
  ] as const;

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File "${file.name}" is too large. Maximum size is ${maxFileSize}MB.`;
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return `File "${file.name}" is not a supported format. Please use JPG, PNG, or PDF.`;
    }

    return null;
  };

  const createFilePreview = (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        resolve(undefined);
      }
    });
  };

  const handleFileUpload = async (file: File | null) => {
    if (!file) return;

    // Check total file count
    if (uploadFiles.length >= maxFiles) {
      setErrors([`Maximum ${maxFiles} files allowed. Please remove some files first.`]);
      return;
    }

    const error = validateFile(file);
    if (error) {
      setErrors([error]);
      return;
    }

    setErrors([]);
    setCurrentUploadFile(file);

    // Simulate upload progress
    const fileId = `${Date.now()}`;
    setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

    for (let progress = 0; progress <= 100; progress += 20) {
      setUploadProgress(prev => ({ ...prev, [fileId]: progress }));
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const preview = await createFilePreview(file);
    const uploadFile: UploadFile = {
      id: fileId,
      file,
      preview,
      documentType: 'other' // Default type, user can change
    };

    const updatedFiles = [...uploadFiles, uploadFile];
    setUploadFiles(updatedFiles);
    onFilesChange(updatedFiles);

    // Clear upload state
    setCurrentUploadFile(null);
    setUploadProgress(prev => {
      const { [fileId]: removed, ...rest } = prev;
      return rest;
    });
  };



  const removeFile = (fileId: string) => {
    if (disabled) return;

    const updatedFiles = uploadFiles.filter(f => f.id !== fileId);
    setUploadFiles(updatedFiles);
    onFilesChange(updatedFiles);
    setErrors([]);
  };

  const updateDocumentType = (fileId: string, documentType: TreatmentDocument['document_type']) => {
    if (disabled) return;

    const updatedFiles = uploadFiles.map(f =>
      f.id === fileId ? { ...f, documentType } : f
    );
    setUploadFiles(updatedFiles);
    onFilesChange(updatedFiles);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <PhotoIcon className="h-8 w-8 text-blue-500" />;
    }
    return <DocumentIcon className="h-8 w-8 text-red-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Universal File Upload */}
      <UniversalFileUpload
        label="Upload Treatment Documents"
        description={`Upload photos, PDFs, or other documents (max ${maxFiles} files, ${maxFileSize}MB each)`}
        value={currentUploadFile}
        onChange={handleFileUpload}
        onUploadProgress={(progress) => {
          // Progress is handled internally in handleFileUpload
        }}
        status={currentUploadFile ? 'uploading' : 'pending'}
        acceptedFileTypes={['.pdf', '.jpg', '.jpeg', '.png']}
        maxSizeMB={maxFileSize}
        showCamera={true}
        multiple={false}
        disabled={disabled}
        className="mb-4"
      />

      {uploadFiles.length < maxFiles && (
        <p className="text-xs text-slate-500">
          {uploadFiles.length}/{maxFiles} files uploaded. You can add {maxFiles - uploadFiles.length} more.
        </p>
      )}

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-sm text-red-800">
            <ul className="space-y-1">
              {errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* File List */}
      {uploadFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-slate-900">
            Uploaded Files ({uploadFiles.length}/{maxFiles})
          </h4>

          <div className="space-y-3">
            {uploadFiles.map((uploadFile) => (
              <div
                key={uploadFile.id}
                className={`flex items-center space-x-4 p-4 bg-slate-50 rounded-lg border border-slate-200 ${
                  disabled ? 'opacity-50' : ''
                }`}
              >
                {/* File Preview/Icon */}
                <div className="flex-shrink-0">
                  {uploadFile.preview ? (
                    <img
                      src={uploadFile.preview}
                      alt={uploadFile.file.name}
                      className="h-16 w-16 object-cover rounded-lg border border-slate-200"
                    />
                  ) : (
                    <div className="h-16 w-16 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center">
                      {getFileIcon(uploadFile.file)}
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">
                    {uploadFile.file.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {formatFileSize(uploadFile.file.size)} • {uploadFile.file.type}
                  </div>

                  {/* Document Type Selector */}
                  <div className="mt-2">
                    <select
                      value={uploadFile.documentType}
                      onChange={(e) => updateDocumentType(uploadFile.id, e.target.value as TreatmentDocument['document_type'])}
                      disabled={disabled}
                      className={`text-xs border border-slate-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                        disabled ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {documentTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  {uploadFile.preview && (
                    <button
                      type="button"
                      onClick={() => window.open(uploadFile.preview, '_blank')}
                      disabled={disabled}
                      className={`p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-md transition-colors ${
                        disabled ? 'cursor-not-allowed opacity-50' : ''
                      }`}
                      title="Preview"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeFile(uploadFile.id)}
                    disabled={disabled}
                    className={`p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors ${
                      disabled ? 'cursor-not-allowed opacity-50' : ''
                    }`}
                    title="Remove"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;