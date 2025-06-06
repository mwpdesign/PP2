import React, { useState } from 'react';
import { Document } from '../../types/ivr';
import { DocumentIcon, CheckCircleIcon, XCircleIcon, TrashIcon } from '@heroicons/react/24/outline';
import UniversalFileUpload from '../shared/UniversalFileUpload';

interface SupportingDocumentsStepProps {
  documents: Document[];
  onDocumentsChange: (documents: Document[]) => void;
}

const SupportingDocumentsStep: React.FC<SupportingDocumentsStepProps> = ({
  documents,
  onDocumentsChange
}) => {
  const [customDocumentName, setCustomDocumentName] = useState('');
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileUpload = async (file: File | null) => {
    if (!file) {
      setUploadingFile(null);
      return;
    }

    setUploadingFile(file);
    setUploadProgress(0);

    // Simulate upload progress
    const uploadInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(uploadInterval);

          // Create the document after upload completes
          const mockUpload: Document = {
            id: `DOC-${Math.random().toString(36).substr(2, 9)}`,
            name: customDocumentName || file.name,
            type: 'supporting',
            url: URL.createObjectURL(file),
            uploadedAt: new Date().toISOString(),
            status: 'pending'
          };

          onDocumentsChange([...documents, mockUpload]);
          setCustomDocumentName('');
          setUploadingFile(null);
          setUploadProgress(0);

          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleRemoveDocument = (docId: string) => {
    const newDocs = documents.filter(doc => doc.id !== docId);
    onDocumentsChange(newDocs);
  };

  const renderDocumentStatus = (status: string | undefined) => {
    if (!status) return <span className="text-sm text-gray-500">Pending</span>;
    if (status === 'verified') {
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    } else if (status === 'rejected') {
      return <XCircleIcon className="h-5 w-5 text-red-500" />;
    }
    return <span className="text-sm text-gray-500">Pending</span>;
  };

  return (
    <div className="space-y-8 bg-white rounded-lg border border-gray-200 p-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Supporting Documents</h3>
        <p className="text-sm text-gray-500 mb-6">
          Upload any additional documents that support this IVR request. All documents will be automatically saved to the patient's profile.
        </p>

        {/* Custom Document Upload */}
        <div className="space-y-4">
          <div>
            <label htmlFor="documentName" className="block text-sm font-medium text-gray-700">
              Document Name (Optional)
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="documentName"
                value={customDocumentName}
                onChange={(e) => setCustomDocumentName(e.target.value)}
                className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-[#2C3E50] focus:ring-[#2C3E50] sm:text-sm"
                placeholder="Enter a custom name for your document"
              />
            </div>
          </div>

          <UniversalFileUpload
            label="Upload Supporting Document"
            description="Upload medical records, lab results, or other supporting documentation"
            value={uploadingFile}
            onChange={handleFileUpload}
            onUploadProgress={setUploadProgress}
            status={uploadingFile ? (uploadProgress < 100 ? 'uploading' : 'success') : 'pending'}
            acceptedFileTypes={['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx']}
            maxSizeMB={10}
            showCamera={true}
            className="mt-4"
          />
        </div>

        {/* Document List */}
        {documents.length > 0 && (
          <div className="mt-8">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Uploaded Documents</h4>
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <DocumentIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                      <p className="text-xs text-gray-500">
                        Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {renderDocumentStatus(doc.status)}
                    <button
                      type="button"
                      onClick={() => handleRemoveDocument(doc.id)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportingDocumentsStep;