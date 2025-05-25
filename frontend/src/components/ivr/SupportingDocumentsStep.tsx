import React, { useState } from 'react';
import { Document } from '../../types/ivr';
import { DocumentIcon, CheckCircleIcon, XCircleIcon, TrashIcon } from '@heroicons/react/24/outline';

interface SupportingDocumentsStepProps {
  documents: Document[];
  onDocumentsChange: (documents: Document[]) => void;
}

const SupportingDocumentsStep: React.FC<SupportingDocumentsStepProps> = ({
  documents,
  onDocumentsChange
}) => {
  const [customDocumentName, setCustomDocumentName] = useState('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // TODO: Implement actual file upload API call
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
              Document Name
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="documentName"
                value={customDocumentName}
                onChange={(e) => setCustomDocumentName(e.target.value)}
                className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-[#2C3E50] focus:ring-[#2C3E50] sm:text-sm"
                placeholder="Enter a name for your document"
              />
            </div>
          </div>

          <div className="relative border-2 border-dashed rounded-lg p-6 text-center hover:border-[#2C3E50] transition-colors">
            <input
              type="file"
              onChange={handleFileUpload}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="space-y-2">
              <DocumentIcon className="mx-auto h-8 w-8 text-gray-400" />
              <div className="text-sm text-gray-600">
                <label htmlFor="file-upload" className="relative cursor-pointer text-[#2C3E50] hover:text-[#375788] focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[#2C3E50]">
                  <span>Upload a file</span>
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">PDF, JPG, PNG, DOC up to 10MB</p>
            </div>
          </div>
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