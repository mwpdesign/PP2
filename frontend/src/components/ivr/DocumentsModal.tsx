import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
  XMarkIcon,
  DocumentTextIcon,
  PhotoIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  FolderIcon,
  CalendarDaysIcon,
  UserIcon,
  DocumentArrowDownIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import { SharedIVRRequest } from '../../data/mockIVRData';
import DocumentUploadModal from './DocumentUploadModal';

interface DocumentsModalProps {
  ivr: SharedIVRRequest;
  onClose: () => void;
}

interface Document {
  id: string;
  name: string;
  type: 'insurance_card' | 'medical_records' | 'authorization_form' | 'lab_results' | 'wound_photos' | 'other';
  fileType: 'pdf' | 'image' | 'doc';
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  url: string;
  thumbnail?: string;
}

const DocumentsModal: React.FC<DocumentsModalProps> = ({ ivr, onClose }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const categories = [
    { id: 'all', name: 'All Documents', count: 0 },
    { id: 'insurance_card', name: 'Insurance Cards', count: 0 },
    { id: 'medical_records', name: 'Medical Records', count: 0 },
    { id: 'authorization_form', name: 'Authorization Forms', count: 0 },
    { id: 'lab_results', name: 'Lab Results', count: 0 },
    { id: 'wound_photos', name: 'Wound Photos', count: 0 },
    { id: 'other', name: 'Other', count: 0 },
  ];

  // Mock documents data
  useEffect(() => {
    const loadDocuments = async () => {
      setIsLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const mockDocuments: Document[] = [
        {
          id: '1',
          name: 'Insurance_Card_Front.jpg',
          type: 'insurance_card',
          fileType: 'image',
          size: '2.3 MB',
          uploadedBy: 'Dr. Sarah Johnson',
          uploadedAt: '2024-01-15T10:30:00Z',
          url: '/mock/insurance-card-front.jpg',
          thumbnail: '/mock/insurance-card-front-thumb.jpg'
        },
        {
          id: '2',
          name: 'Insurance_Card_Back.jpg',
          type: 'insurance_card',
          fileType: 'image',
          size: '2.1 MB',
          uploadedBy: 'Dr. Sarah Johnson',
          uploadedAt: '2024-01-15T10:31:00Z',
          url: '/mock/insurance-card-back.jpg',
          thumbnail: '/mock/insurance-card-back-thumb.jpg'
        },
        {
          id: '3',
          name: 'Patient_Medical_History.pdf',
          type: 'medical_records',
          fileType: 'pdf',
          size: '4.7 MB',
          uploadedBy: 'Dr. Sarah Johnson',
          uploadedAt: '2024-01-15T11:00:00Z',
          url: '/mock/medical-history.pdf'
        },
        {
          id: '4',
          name: 'Lab_Results_2024_01_14.pdf',
          type: 'lab_results',
          fileType: 'pdf',
          size: '1.8 MB',
          uploadedBy: 'Dr. Sarah Johnson',
          uploadedAt: '2024-01-16T09:15:00Z',
          url: '/mock/lab-results.pdf'
        },
        {
          id: '5',
          name: 'Wound_Photo_1.jpg',
          type: 'wound_photos',
          fileType: 'image',
          size: '3.2 MB',
          uploadedBy: 'Dr. Sarah Johnson',
          uploadedAt: '2024-01-16T09:20:00Z',
          url: '/mock/wound-photo-1.jpg',
          thumbnail: '/mock/wound-photo-1-thumb.jpg'
        },
        {
          id: '6',
          name: 'Wound_Photo_2.jpg',
          type: 'wound_photos',
          fileType: 'image',
          size: '3.5 MB',
          uploadedBy: 'Dr. Sarah Johnson',
          uploadedAt: '2024-01-16T09:21:00Z',
          url: '/mock/wound-photo-2.jpg',
          thumbnail: '/mock/wound-photo-2-thumb.jpg'
        },
        {
          id: '7',
          name: 'Prior_Authorization_Form.pdf',
          type: 'authorization_form',
          fileType: 'pdf',
          size: '892 KB',
          uploadedBy: 'IVR Specialist',
          uploadedAt: '2024-01-16T16:30:00Z',
          url: '/mock/authorization-form.pdf'
        }
      ];

      setDocuments(mockDocuments);
      setIsLoading(false);
    };

    loadDocuments();
  }, [ivr.id]);

  const filteredDocuments = selectedCategory === 'all'
    ? documents
    : documents.filter(doc => doc.type === selectedCategory);

  const getCategoryCount = (categoryId: string) => {
    if (categoryId === 'all') return documents.length;
    return documents.filter(doc => doc.type === categoryId).length;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return DocumentTextIcon;
      case 'image':
        return PhotoIcon;
      default:
        return DocumentTextIcon;
    }
  };

  const handlePreview = (document: Document) => {
    setPreviewDocument(document);
  };

  const handleDownload = (document: Document) => {
    // Simulate download
    console.log('Downloading:', document.name);
    // In real implementation, this would trigger a download
  };

  const handleBulkDownload = () => {
    // Simulate bulk download
    console.log('Downloading all documents for:', ivr.ivrNumber);
    // In real implementation, this would create a zip file and download
  };

  const handleUploadComplete = (uploadedFiles: any[]) => {
    // Add uploaded files to the documents list
    const newDocuments = uploadedFiles.map(file => ({
      ...file,
      id: `uploaded-${Date.now()}-${Math.random()}`
    }));

    setDocuments(prev => [...prev, ...newDocuments]);
    setShowUploadModal(false);

    console.log('Documents uploaded successfully:', uploadedFiles);
  };

  return (
    <>
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
                <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div>
                      <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">
                        Documents & Attachments
                      </Dialog.Title>
                      <p className="text-sm text-gray-600">
                        {ivr.ivrNumber} - {ivr.patientName}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setShowUploadModal(true)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <CloudArrowUpIcon className="w-4 h-4 mr-2" />
                        Upload Document
                      </button>
                      <button
                        onClick={handleBulkDownload}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
                        Download All
                      </button>
                      <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <XMarkIcon className="w-6 h-6" />
                      </button>
                    </div>
                  </div>

                  <div className="flex h-96">
                    {/* Sidebar - Categories */}
                    <div className="w-64 border-r border-gray-200 bg-gray-50 p-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Categories</h4>
                      <nav className="space-y-1">
                        {categories.map((category) => {
                          const count = getCategoryCount(category.id);
                          return (
                            <button
                              key={category.id}
                              onClick={() => setSelectedCategory(category.id)}
                              className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${
                                selectedCategory === category.id
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              <div className="flex items-center">
                                <FolderIcon className="w-4 h-4 mr-2" />
                                {category.name}
                              </div>
                              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                                {count}
                              </span>
                            </button>
                          );
                        })}
                      </nav>
                    </div>

                    {/* Main Content - Documents */}
                    <div className="flex-1 overflow-y-auto p-6">
                      {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                      ) : filteredDocuments.length === 0 ? (
                        <div className="text-center py-8">
                          <FolderIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">No documents found in this category</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {filteredDocuments.map((document) => {
                            const FileIcon = getFileIcon(document.fileType);
                            return (
                              <div
                                key={document.id}
                                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                              >
                                <div className="flex items-start space-x-3">
                                  <div className="flex-shrink-0">
                                    {document.thumbnail ? (
                                      <img
                                        src={document.thumbnail}
                                        alt={document.name}
                                        className="w-12 h-12 object-cover rounded border"
                                        onError={(e) => {
                                          // Fallback to icon if thumbnail fails to load
                                          const target = e.target as HTMLImageElement;
                                          target.style.display = 'none';
                                          target.nextElementSibling?.classList.remove('hidden');
                                        }}
                                      />
                                    ) : null}
                                    <FileIcon className={`w-12 h-12 text-gray-400 ${document.thumbnail ? 'hidden' : ''}`} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h5 className="text-sm font-medium text-gray-900 truncate">
                                      {document.name}
                                    </h5>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {document.size}
                                    </p>
                                    <div className="flex items-center text-xs text-gray-500 mt-2">
                                      <UserIcon className="w-3 h-3 mr-1" />
                                      {document.uploadedBy}
                                    </div>
                                    <div className="flex items-center text-xs text-gray-500 mt-1">
                                      <CalendarDaysIcon className="w-3 h-3 mr-1" />
                                      {formatTimestamp(document.uploadedAt)}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex space-x-2 mt-4">
                                  <button
                                    onClick={() => handlePreview(document)}
                                    className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                  >
                                    <EyeIcon className="w-3 h-3 mr-1" />
                                    Preview
                                  </button>
                                  <button
                                    onClick={() => handleDownload(document)}
                                    className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                  >
                                    <ArrowDownTrayIcon className="w-3 h-3 mr-1" />
                                    Download
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Document Preview Modal */}
      {previewDocument && (
        <Transition appear show={true} as={Fragment}>
          <Dialog as="div" className="relative z-60" onClose={() => setPreviewDocument(null)}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-75" />
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
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                      <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">
                        {previewDocument.name}
                      </Dialog.Title>
                      <button
                        onClick={() => setPreviewDocument(null)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <XMarkIcon className="w-6 h-6" />
                      </button>
                    </div>

                    <div className="p-6">
                      {previewDocument.fileType === 'image' ? (
                        <img
                          src={previewDocument.url}
                          alt={previewDocument.name}
                          className="max-w-full h-auto mx-auto"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+';
                          }}
                        />
                      ) : (
                        <div className="text-center py-12">
                          <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500 mb-4">PDF preview not available</p>
                          <button
                            onClick={() => handleDownload(previewDocument)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                            Download to View
                          </button>
                        </div>
                      )}
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      )}

      {/* Document Upload Modal */}
      {showUploadModal && (
        <DocumentUploadModal
          ivr={ivr}
          onClose={() => setShowUploadModal(false)}
          onUploadComplete={handleUploadComplete}
        />
      )}
    </>
  );
};

export default DocumentsModal;