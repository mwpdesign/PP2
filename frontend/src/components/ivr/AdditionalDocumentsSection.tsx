import React, { useState } from 'react';
import { DocumentIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import UniversalFileUpload from '../shared/UniversalFileUpload';

interface Document {
  id: string;
  name: string;
  description: string;
  uploadedAt: string;
  type: string;
  url: string;
  status: 'pending' | 'in_review' | 'approved' | 'rejected';
  reviewNotes?: string;
}

interface AdditionalDocumentsSectionProps {
  ivrStatus: string;
  documents: Document[];
  onDocumentsChange: (documents: Document[]) => void;
  reviewNotes?: string;
}

const AdditionalDocumentsSection: React.FC<AdditionalDocumentsSectionProps> = ({
  ivrStatus,
  documents,
  onDocumentsChange,
  reviewNotes
}) => {
  console.log('🔍 DEBUG: AdditionalDocumentsSection rendering', {
    ivrStatus,
    documentsCount: documents.length,
    hasReviewNotes: !!reviewNotes
  });

  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [description, setDescription] = useState('');

  // Check if review notes mention additional documents
  const needsAdditionalDocs = reviewNotes?.toLowerCase().includes('additional') ||
    reviewNotes?.toLowerCase().includes('documentation') ||
    reviewNotes?.toLowerCase().includes('photos');

  const handleFileChange = async (file: File | null, documentType: string) => {
    if (!file) return;

    // Validate file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.tiff'];
    if (!fileExtension || !allowedTypes.includes(`.${fileExtension}`)) {
      toast.error('Invalid file type. Please upload PDF or medical images only.');
      return;
    }

    // Validate file size
    if (file.size > 25 * 1024 * 1024) { // 25MB
      toast.error('File size must be less than 25MB');
      return;
    }

    // Format timestamp for filename
    const timestamp = new Date().toISOString().split('T')[0];
    const formattedName = `${timestamp}_Additional_${file.name}`;

    // Simulate file upload with progress
    setUploadProgress(prev => ({ ...prev, [documentType]: 0 }));

    // TODO: Replace with actual file upload API call
    for (let progress = 0; progress <= 100; progress += 10) {
      setUploadProgress(prev => ({ ...prev, [documentType]: progress }));
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    const newDocument: Document = {
      id: `DOC-${Math.random().toString(36).substr(2, 9)}`,
      name: formattedName,
      description: description || 'Additional documentation',
      type: 'additional',
      url: URL.createObjectURL(file),
      uploadedAt: new Date().toISOString(),
      status: 'pending'
    };

    onDocumentsChange([...documents, newDocument]);
    setDescription('');

    // Clear progress after upload
    setUploadProgress(prev => {
      const { [documentType]: removed, ...rest } = prev;
      return rest;
    });

    // Update IVR status if needed
    if (ivrStatus === 'submitted') {
      // TODO: Call API to update IVR status to 'pending_additional_review'
      toast.info('IVR status updated to pending additional review');
    }
  };

  const renderDocumentList = () => {
    const groupedDocuments = documents.reduce((acc, doc) => {
      const date = new Date(doc.uploadedAt).toLocaleDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(doc);
      return acc;
    }, {} as Record<string, Document[]>);

    return Object.entries(groupedDocuments).map(([date, docs]) => (
      <div key={date} className="space-y-2">
        <h4 className="text-sm font-medium text-gray-500">{date}</h4>
        {docs.map(doc => (
          <div
            key={doc.id}
            className="flex items-start p-3 bg-white rounded-lg border border-gray-200"
          >
            <DocumentIcon className="h-5 w-5 text-gray-400 mt-1" />
            <div className="ml-3 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  doc.status === 'approved' ? 'bg-green-100 text-green-800' :
                  doc.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  doc.status === 'in_review' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {doc.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">{doc.description}</p>
            </div>
          </div>
        ))}
      </div>
    ));
  };

  return (
    <div className="space-y-6">
      {/* Debug Information */}
      <div className="p-4 bg-yellow-50 text-yellow-700 text-sm">
        DEBUG: Additional Documents Section Loaded
        <br />
        Status: {ivrStatus}
        <br />
        Documents Count: {documents.length}
      </div>

      {/* Review Notes Alert */}
      {needsAdditionalDocs && (
        <div className="rounded-md bg-amber-50 p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">
                Additional Documentation Requested
              </h3>
              <div className="mt-2 text-sm text-amber-700">
                <p>{reviewNotes}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Additional Documents</h3>
          {documents.length > 0 && (
            <span className="text-sm text-gray-500">
              {documents.length} document{documents.length !== 1 ? 's' : ''} uploaded
            </span>
          )}
        </div>

        <div className="space-y-4">
          <UniversalFileUpload
            label="Upload Additional Document"
            description="Upload additional documentation (PDF or medical images only)"
            value={null}
            onChange={(file) => handleFileChange(file, 'additional')}
            onUploadProgress={(progress) => setUploadProgress(prev => ({ ...prev, additional: progress }))}
            status={uploadProgress['additional'] ? 'uploading' : 'pending'}
            acceptedFileTypes={['.pdf', '.jpg', '.jpeg', '.png', '.tiff']}
            maxSizeMB={25}
            showCamera={true}
          />

          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              rows={2}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Provide a brief description of the uploaded document..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Document List */}
      {documents.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900">Uploaded Documents</h4>
          {renderDocumentList()}
        </div>
      )}
    </div>
  );
};

export default AdditionalDocumentsSection;