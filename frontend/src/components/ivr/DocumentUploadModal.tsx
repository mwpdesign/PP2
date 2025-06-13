import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
  XMarkIcon,
  CheckCircleIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { SharedIVRRequest } from '../../data/mockIVRData';
import UniversalFileUpload from '../shared/UniversalFileUpload';

interface DocumentUploadModalProps {
  ivr: SharedIVRRequest;
  onClose: () => void;
  onUploadComplete: (uploadedFiles: UploadedFile[]) => void;
}

interface UploadedDocument {
  id: string;
  file: File;
  type: DocumentType;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
  uploadedAt?: string;
}

interface UploadedFile {
  id: string;
  name: string;
  type: DocumentType;
  fileType: 'pdf' | 'image' | 'doc';
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  url: string;
  thumbnail?: string;
}

type DocumentType = 'insurance_card' | 'medical_records' | 'authorization_form' | 'lab_results' | 'wound_photos' | 'other';

const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({ ivr, onClose, onUploadComplete }) => {
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [currentDocumentType, setCurrentDocumentType] = useState<DocumentType>('other');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const documentTypes = [
    { id: 'insurance_card', name: 'Insurance Card', description: 'Front and back of insurance card' },
    { id: 'medical_records', name: 'Medical Records', description: 'Patient medical history and records' },
    { id: 'authorization_form', name: 'Authorization Form', description: 'Prior authorization forms' },
    { id: 'lab_results', name: 'Lab Results', description: 'Laboratory test results' },
    { id: 'wound_photos', name: 'Wound Photos', description: 'Clinical wound photography' },
    { id: 'other', name: 'Other', description: 'Other supporting documents' },
  ];

  const maxFiles = 10;

    const getFileType = (file: File): 'pdf' | 'image' | 'doc' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type === 'application/pdf') return 'pdf';
    return 'doc';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileChange = (file: File | null) => {
    setCurrentFile(file);
    if (file) {
      setIsUploading(true);
      // Simulate upload process
      simulateUpload(file);
    }
  };

  const simulateUpload = async (file: File) => {
    // Simulate upload progress
    for (let progress = 0; progress <= 100; progress += 20) {
      setUploadProgress(progress);
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    // Add to uploaded documents
    const newDocument: UploadedDocument = {
      id: `${Date.now()}-${Math.random()}`,
      file,
      type: currentDocumentType,
      status: 'completed',
      progress: 100,
      uploadedAt: new Date().toISOString()
    };

    setUploadedDocuments(prev => [...prev, newDocument]);
    setCurrentFile(null);
    setUploadProgress(0);
    setIsUploading(false);
  };

  const handleAddDocument = () => {
    if (uploadedDocuments.length >= maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }
    // Reset for next upload
    setCurrentFile(null);
    setCurrentDocumentType('other');
  };

  const removeDocument = (documentId: string) => {
    setUploadedDocuments(prev => prev.filter(doc => doc.id !== documentId));
  };

  const handleCompleteUpload = () => {
    // Convert uploaded documents to the expected format
    const uploadedFiles: UploadedFile[] = uploadedDocuments.map(doc => ({
      id: doc.id,
      name: doc.file.name,
      type: doc.type,
      fileType: getFileType(doc.file),
      size: formatFileSize(doc.file.size),
      uploadedBy: 'Regional Distributor',
      uploadedAt: doc.uploadedAt || new Date().toISOString(),
      url: `/mock/${doc.file.name}`,
      thumbnail: doc.file.type.startsWith('image/') ? URL.createObjectURL(doc.file) : undefined
    }));

    // Notify parent component
    onUploadComplete(uploadedFiles);
    onClose();
  };

  const canComplete = uploadedDocuments.length > 0;

  return (
    <Transition appear show={true} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div>
                    <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">
                      Upload Documents
                    </Dialog.Title>
                    <p className="text-sm text-gray-600">
                      {ivr.ivrNumber} - {ivr.patientName}
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Document Type Selection */}
                  <div>
                    <label htmlFor="documentType" className="block text-sm font-medium text-gray-700 mb-2">
                      Document Type
                    </label>
                    <select
                      id="documentType"
                      value={currentDocumentType}
                      onChange={(e) => setCurrentDocumentType(e.target.value as DocumentType)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      {documentTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name} - {type.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Universal File Upload */}
                  <UniversalFileUpload
                    label="Upload Document"
                    description="Upload supporting documents for this IVR request. Supports images, PDFs, and Word documents up to 25MB."
                    value={currentFile}
                    onChange={handleFileChange}
                    onUploadProgress={setUploadProgress}
                    status={isUploading ? 'uploading' : currentFile ? 'success' : 'pending'}
                    acceptedFileTypes={['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.doc', '.docx', '.tiff']}
                    maxSizeMB={25}
                    showCamera={true}
                    multiple={false}
                    disabled={uploadedDocuments.length >= maxFiles}
                  />

                  {/* Uploaded Documents List */}
                  {uploadedDocuments.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-4">
                        Uploaded Documents ({uploadedDocuments.length}/{maxFiles})
                      </h4>
                      <div className="space-y-3">
                        {uploadedDocuments.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                {doc.file.type.startsWith('image/') ? (
                                  <img
                                    src={URL.createObjectURL(doc.file)}
                                    alt={doc.file.name}
                                    className="w-10 h-10 object-cover rounded border"
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
                                    <span className="text-blue-600 text-xs font-medium">
                                      {doc.file.name.split('.').pop()?.toUpperCase()}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {doc.file.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {documentTypes.find(t => t.id === doc.type)?.name} • {formatFileSize(doc.file.size)}
                                </p>
                                <div className="flex items-center mt-1">
                                  <CheckCircleIcon className="w-3 h-3 text-green-500 mr-1" />
                                  <span className="text-xs text-green-600">Upload completed</span>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => removeDocument(doc.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upload Limit Warning */}
                  {uploadedDocuments.length >= maxFiles && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-sm text-amber-800">
                        Maximum of {maxFiles} documents reached. Remove a document to upload another.
                      </p>
                    </div>
                  )}

                  {/* Footer Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      {uploadedDocuments.length > 0 && (
                        <>
                          {uploadedDocuments.length} document{uploadedDocuments.length !== 1 ? 's' : ''} ready to upload
                        </>
                      )}
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Cancel
                      </button>
                      {canComplete && (
                        <button
                          onClick={handleCompleteUpload}
                          className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Complete Upload ({uploadedDocuments.length} files)
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default DocumentUploadModal;