import React, { useState, useRef, useCallback } from 'react';

interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: string;
  size?: number;
}

interface DocumentUploadProps {
  orderId: string;
  onDocumentUpload: (document: Document) => void;
  existingDocuments: Document[];
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ 
  orderId, 
  onDocumentUpload, 
  existingDocuments 
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const [customName, setCustomName] = useState('');
  const [documentType, setDocumentType] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const documentTypes = [
    'Skin Graph Bar Codes',
    'Shipping Label',
    'Packing Slip',
    'Invoice',
    'Certificate of Analysis',
    'Temperature Log',
    'Chain of Custody',
    'Product Insert',
    'Other'
  ];

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = async (files: File[]) => {
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert(`File ${file.name} is too large. Maximum size is 10MB.`);
        continue;
      }

      const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setUploadingFiles(prev => [...prev, fileId]);

      try {
        // Simulate file upload - in real app, this would upload to your server/cloud storage
        await simulateUpload(file);
        
        const newDocument: Document = {
          id: fileId,
          name: customName || file.name,
          type: documentType || getFileType(file.name),
          url: URL.createObjectURL(file), // In real app, this would be the uploaded file URL
          uploadedAt: new Date().toISOString(),
          size: file.size
        };

        onDocumentUpload(newDocument);
        setCustomName('');
        setDocumentType('');
      } catch (error) {
        console.error('Upload failed:', error);
        alert(`Failed to upload ${file.name}`);
      } finally {
        setUploadingFiles(prev => prev.filter(id => id !== fileId));
      }
    }
  };

  const simulateUpload = (file: File): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(resolve, 1000 + Math.random() * 2000); // 1-3 second delay
    });
  };

  const getFileType = (filename: string): string => {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'PDF Document';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return 'Image';
      case 'doc':
      case 'docx':
        return 'Word Document';
      case 'xls':
      case 'xlsx':
        return 'Excel Document';
      default:
        return 'Document';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (isoString: string): string => {
    return new Date(isoString).toLocaleString();
  };

  const handleRemoveDocument = (documentId: string) => {
    if (confirm('Are you sure you want to remove this document?')) {
      // In real app, you would make an API call to delete the document
      console.log('Removing document:', documentId);
    }
  };

  return (
    <div className="space-y-8">
      {/* Document Type and Name Input */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-3">
            Document Type
          </label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
          >
            <option value="">Auto-detect from file</option>
            {documentTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-3">
            Custom Document Name (Optional)
          </label>
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Enter custom name for uploaded files"
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
          />
        </div>
      </div>

      {/* Special Notice for Skin Graph Bar Codes */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-blue-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="text-base font-bold text-blue-800 mb-2">Skin Graph Bar Codes - Critical Requirement</h4>
            <p className="text-sm text-blue-700">
              Please upload clear, high-resolution images of all skin graph bar codes. These are critical for patient safety and tracking. 
              Ensure all barcodes are legible and properly labeled with the document type "Skin Graph Bar Codes".
            </p>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${
          isDragOver
            ? 'border-slate-500 bg-slate-50'
            : 'border-slate-300 hover:border-slate-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
        />
        
        <div className="space-y-6">
          <div className="mx-auto w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          
          <div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">Upload Documents</h3>
            <p className="text-slate-600 mb-6 text-base">
              Drag and drop files here, or click to select files
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-slate-600 text-slate-600 bg-white hover:bg-slate-50 font-semibold py-3 px-8 rounded-lg transition-all duration-200 ease-in-out hover:shadow-md"
            >
              Choose Files
            </button>
          </div>
          
          <p className="text-sm text-slate-500">
            Supported formats: PDF, DOC, DOCX, JPG, PNG, XLS, XLSX (Max 10MB per file)
          </p>
        </div>
      </div>

      {/* Uploading Progress */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-bold text-slate-800">Uploading...</h4>
          {uploadingFiles.map((fileId) => (
            <div key={fileId} className="flex items-center space-x-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-600"></div>
              <span className="text-base font-medium text-slate-700">Uploading file...</span>
            </div>
          ))}
        </div>
      )}

      {/* Existing Documents */}
      {existingDocuments.length > 0 && (
        <div className="space-y-6">
          <h4 className="text-lg font-bold text-slate-800">Uploaded Documents</h4>
          <div className="space-y-4">
            {existingDocuments.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-xl border border-slate-200 hover:shadow-md transition-all duration-200">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {doc.type.includes('Image') || doc.name.match(/\.(jpg|jpeg|png)$/i) ? (
                      <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    ) : (
                      <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <p className="text-base font-bold text-slate-800">{doc.name}</p>
                    <div className="flex items-center space-x-6 text-sm text-slate-500 mt-1">
                      <span className="font-medium">{doc.type}</span>
                      {doc.size && <span>{formatFileSize(doc.size)}</span>}
                      <span>{formatDate(doc.uploadedAt)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => window.open(doc.url, '_blank')}
                    className="border-2 border-slate-600 text-slate-600 bg-white hover:bg-slate-50 font-semibold py-2 px-4 rounded-lg transition-all duration-200 ease-in-out hover:shadow-md text-sm"
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => handleRemoveDocument(doc.id)}
                    className="border-2 border-red-300 text-red-600 bg-white hover:bg-red-50 font-semibold py-2 px-4 rounded-lg transition-all duration-200 ease-in-out hover:shadow-md text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions for Common Documents */}
      <div className="border-t border-slate-200 pt-8">
        <h4 className="text-lg font-bold text-slate-800 mb-4">Quick Actions</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['Skin Graph Bar Codes', 'Shipping Label', 'Packing Slip', 'Temperature Log'].map((type) => (
            <button
              key={type}
              onClick={() => {
                setDocumentType(type);
                fileInputRef.current?.click();
              }}
              className="text-sm px-4 py-3 border-2 border-slate-600 text-slate-600 bg-white hover:bg-slate-50 font-semibold rounded-lg transition-all duration-200 ease-in-out hover:shadow-md"
            >
              Upload {type}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload; 