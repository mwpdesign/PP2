import React from 'react';
import { DocumentIcon, FolderIcon } from '@heroicons/react/24/outline';
import AdditionalDocumentsSection from './AdditionalDocumentsSection';

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

interface DocumentGroup {
  title: string;
  documents: Document[];
  uploadedAt: string;
}

interface DocumentsViewProps {
  ivrStatus: string;
  originalDocuments: Document[];
  additionalDocuments: Document[];
  onDocumentsChange: (documents: Document[]) => void;
  reviewNotes?: string;
}

const DocumentsView: React.FC<DocumentsViewProps> = ({
  ivrStatus,
  originalDocuments,
  additionalDocuments,
  onDocumentsChange,
  reviewNotes
}) => {
  console.log('🔍 DEBUG: DocumentsView rendering', {
    ivrStatus,
    originalCount: originalDocuments.length,
    additionalCount: additionalDocuments.length,
    hasReviewNotes: !!reviewNotes
  });

  const renderDocumentGroup = (group: DocumentGroup) => (
    <div key={group.title} className="space-y-2">
      <div className="flex items-center space-x-2">
        <FolderIcon className="h-5 w-5 text-gray-400" />
        <h4 className="text-sm font-medium text-gray-900">{group.title}</h4>
        <span className="text-xs text-gray-500">
          (uploaded {new Date(group.uploadedAt).toLocaleDateString()})
        </span>
      </div>
      
      <div className="pl-6 space-y-2">
        {group.documents.map(doc => (
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
    </div>
  );

  // Group original documents by type
  const originalDocumentGroups = originalDocuments.reduce((acc, doc) => {
    const existingGroup = acc.find(g => g.title === doc.type);
    if (existingGroup) {
      existingGroup.documents.push(doc);
    } else {
      acc.push({
        title: doc.type,
        documents: [doc],
        uploadedAt: doc.uploadedAt
      });
    }
    return acc;
  }, [] as DocumentGroup[]);

  return (
    <div className="space-y-8">
      {/* Debug Information */}
      <div className="p-4 bg-green-50 text-green-700 text-sm">
        DEBUG: Documents View Loaded
        <br />
        Original Documents: {originalDocuments.length}
        <br />
        Additional Documents: {additionalDocuments.length}
      </div>

      {/* Original IVR Documents */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Original IVR Documents</h3>
        <div className="space-y-6">
          {originalDocumentGroups.map(renderDocumentGroup)}
        </div>
      </div>

      {/* Additional Documents Section */}
      <div className="border-t border-gray-200 pt-8">
        <AdditionalDocumentsSection
          ivrStatus={ivrStatus}
          documents={additionalDocuments}
          onDocumentsChange={onDocumentsChange}
          reviewNotes={reviewNotes}
        />
      </div>
    </div>
  );
};

export default DocumentsView; 