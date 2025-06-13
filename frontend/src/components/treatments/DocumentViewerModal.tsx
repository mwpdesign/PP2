import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon, ArrowDownTrayIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { TreatmentDocument } from '../../types/treatments';

interface DocumentViewerModalProps {
  document: TreatmentDocument | null;
  isOpen: boolean;
  onClose: () => void;
}

const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  document,
  isOpen,
  onClose
}) => {
  if (!document) return null;

  const getDocumentTypeLabel = (type: TreatmentDocument['document_type']) => {
    const labels = {
      before_photo: 'Before Treatment Photo',
      after_photo: 'After Treatment Photo',
      graft_sticker: 'Graft Sticker Photo',
      usage_log: 'Usage Log Photo',
      other: 'Other Document'
    };
    return labels[type];
  };

  const isImage = document.file_name.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/);
  const isPDF = document.file_name.toLowerCase().endsWith('.pdf');

  const handleDownload = () => {
    // In a real implementation, this would download from the actual URL
    const link = document.createElement('a');
    link.href = document.file_url;
    link.download = document.file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
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
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                  <div>
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-slate-900"
                    >
                      {document.file_name}
                    </Dialog.Title>
                    <p className="mt-1 text-sm text-slate-500">
                      {getDocumentTypeLabel(document.document_type)} •
                      Uploaded {new Date(document.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="inline-flex items-center px-3 py-2 border border-slate-300 shadow-sm text-sm leading-4 font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                      Download
                    </button>
                    <button
                      type="button"
                      className="rounded-md text-slate-400 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      onClick={onClose}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  {isImage ? (
                    <div className="flex justify-center">
                      <img
                        src={document.file_url}
                        alt={document.file_name}
                        className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                      />
                    </div>
                  ) : isPDF ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <DocumentIcon className="h-16 w-16 text-red-500 mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 mb-2">PDF Document</h3>
                      <p className="text-sm text-slate-500 mb-4">
                        Click download to view this PDF document
                      </p>
                      <button
                        onClick={handleDownload}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                        Download PDF
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                      <DocumentIcon className="h-16 w-16 text-slate-400 mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 mb-2">Document Preview</h3>
                      <p className="text-sm text-slate-500 mb-4">
                        Preview not available for this file type
                      </p>
                      <button
                        onClick={handleDownload}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                        Download File
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
  );
};

export default DocumentViewerModal;