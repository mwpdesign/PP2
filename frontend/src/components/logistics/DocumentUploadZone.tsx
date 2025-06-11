import React, { useState } from 'react';
import { toast } from 'react-toastify';
import UniversalFileUpload from '../shared/UniversalFileUpload';
import {
  DocumentTextIcon,
  DocumentIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/solid';

interface ShippingDocument {
  id: string;
  type: 'shipping_label' | 'packing_slip' | 'invoice' | 'other';
  name: string;
  file: File;
  uploadedAt: string;
}

interface DocumentUploadZoneProps {
  documents: ShippingDocument[];
  onDocumentUpload: (documents: ShippingDocument[]) => void;
  onDocumentDelete: (documentId: string) => void;
}

const DocumentUploadZone: React.FC<DocumentUploadZoneProps> = ({
  documents,
  onDocumentUpload,
  onDocumentDelete
}) => {
  const [selectedType, setSelectedType] = useState<ShippingDocument['type']>('shipping_label');
  const [customName, setCustomName] = useState('');
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = async (file: File | null) => {
    if (!file) {
      setCurrentFile(null);
      return;
    }

    setCurrentFile(file);

    try {
      // Create new document with selected type and custom name
      const newDocument: ShippingDocument = {
        id: `doc_${Date.now()}`,
        type: selectedType,
        name: customName.trim() || file.name,
        file,
        uploadedAt: new Date().toISOString()
      };

      onDocumentUpload([newDocument]);
      setCustomName('');
      setCurrentFile(null);

      toast.success('Document uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
    }
  };

  const getDocumentIcon = (type: ShippingDocument['type']) => {
    switch (type) {
      case 'shipping_label':
        return <DocumentTextIcon className="h-5 w-5 text-emerald-600" />;
      case 'packing_slip':
        return <DocumentIcon className="h-5 w-5 text-blue-600" />;
      case 'invoice':
        return <DocumentIcon className="h-5 w-5 text-purple-600" />;
      default:
        return <DocumentIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getDocumentTypeLabel = (type: ShippingDocument['type']) => {
    switch (type) {
      case 'shipping_label':
        return 'Shipping Label';
      case 'packing_slip':
        return 'Packing Slip';
      case 'invoice':
        return 'Invoice';
      default:
        return 'Other';
    }
  };

  const getDocumentTypeBadgeColor = (type: ShippingDocument['type']) => {
    switch (type) {
      case 'shipping_label':
        return 'bg-emerald-100 text-emerald-800';
      case 'packing_slip':
        return 'bg-blue-100 text-blue-800';
      case 'invoice':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const hasShippingLabel = documents.some(doc => doc.type === 'shipping_label');

  return (
    <div className="space-y-4">
      {/* Upload Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Document Type
          </label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as ShippingDocument['type'])}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
          >
            <option value="shipping_label">Shipping Label (Required)</option>
            <option value="packing_slip">Packing Slip</option>
            <option value="invoice">Invoice</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Name (Optional)
          </label>
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Enter custom document name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
          />
        </div>
      </div>

            {/* Universal File Upload */}
      <UniversalFileUpload
        label={`Upload ${getDocumentTypeLabel(selectedType)}`}
        description={`Upload ${getDocumentTypeLabel(selectedType).toLowerCase()} document (PDF, PNG, JPG up to 10MB)`}
        value={currentFile}
        onChange={handleFileChange}
        onUploadProgress={setUploadProgress}
        status={uploadProgress > 0 && uploadProgress < 100 ? 'uploading' : 'pending'}
        acceptedFileTypes={['.pdf', '.png', '.jpg', '.jpeg']}
        maxSizeMB={10}
        showCamera={true}
        multiple={false}
      />

      {/* Validation Warning */}
      {!hasShippingLabel && (
        <div className="flex items-start space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
          <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Shipping Label Required</p>
            <p className="text-sm text-amber-700">
              At least one shipping label must be uploaded before the order can be marked as shipped.
            </p>
          </div>
        </div>
      )}

      {/* Uploaded Documents List */}
      {documents.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">Uploaded Documents</h4>
          <div className="space-y-2">
            {documents.map((document) => (
              <div
                key={document.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center space-x-3">
                  {getDocumentIcon(document.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {document.name}
                      </p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getDocumentTypeBadgeColor(document.type)}`}>
                        {getDocumentTypeLabel(document.type)}
                      </span>
                      {document.type === 'shipping_label' && (
                        <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Uploaded {new Date(document.uploadedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onDocumentDelete(document.id)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete document"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Summary */}
      {documents.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <DocumentIcon className="h-5 w-5 text-slate-600" />
            <span className="text-sm font-medium text-slate-900">
              {documents.length} document{documents.length !== 1 ? 's' : ''} uploaded
            </span>
          </div>
          {hasShippingLabel && (
            <div className="flex items-center space-x-1">
              <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
              <span className="text-xs text-emerald-700 font-medium">Ready to ship</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentUploadZone;