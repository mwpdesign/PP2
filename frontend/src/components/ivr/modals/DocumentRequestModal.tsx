import React, { useState } from 'react';
import {
  XMarkIcon,
  DocumentArrowDownIcon,
  ClipboardDocumentListIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface DocumentRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestDocuments: (requestData: DocumentRequestData) => void;
  ivrRequest: {
    id: string;
    ivrNumber: string;
    patientName: string;
  };
  isLoading?: boolean;
}

interface DocumentRequestData {
  requestedDocuments: string[];
  otherDocument: string;
  additionalInstructions: string;
}

interface DocumentOption {
  id: string;
  label: string;
  description: string;
}

const DOCUMENT_OPTIONS: DocumentOption[] = [
  {
    id: 'insurance_card',
    label: 'Updated Insurance Card',
    description: 'Front and back of current insurance card'
  },
  {
    id: 'prior_auth',
    label: 'Prior Authorization Form',
    description: 'Completed prior authorization documentation'
  },
  {
    id: 'medical_notes',
    label: 'Medical Notes',
    description: 'Recent physician notes or treatment records'
  },
  {
    id: 'prescription',
    label: 'Prescription',
    description: 'Current prescription or treatment order'
  },
  {
    id: 'lab_results',
    label: 'Lab Results',
    description: 'Recent laboratory or diagnostic test results'
  },
  {
    id: 'treatment_plan',
    label: 'Treatment Plan',
    description: 'Detailed treatment or care plan documentation'
  }
];

const DocumentRequestModal: React.FC<DocumentRequestModalProps> = ({
  isOpen,
  onClose,
  onRequestDocuments,
  ivrRequest,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<DocumentRequestData>({
    requestedDocuments: [],
    otherDocument: '',
    additionalInstructions: ''
  });

  const [errors, setErrors] = useState<Partial<DocumentRequestData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<DocumentRequestData> = {};

    if (formData.requestedDocuments.length === 0 && !formData.otherDocument.trim()) {
      newErrors.requestedDocuments = 'Please select at least one document or specify other';
    }

    if (!formData.additionalInstructions.trim()) {
      newErrors.additionalInstructions = 'Additional instructions are required';
    } else if (formData.additionalInstructions.trim().length < 10) {
      newErrors.additionalInstructions = 'Instructions must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onRequestDocuments(formData);
    }
  };

  const handleDocumentToggle = (documentId: string) => {
    setFormData(prev => ({
      ...prev,
      requestedDocuments: prev.requestedDocuments.includes(documentId)
        ? prev.requestedDocuments.filter(id => id !== documentId)
        : [...prev.requestedDocuments, documentId]
    }));

    // Clear error when user makes selection
    if (errors.requestedDocuments) {
      setErrors(prev => ({ ...prev, requestedDocuments: undefined }));
    }
  };

  const handleInputChange = (field: keyof DocumentRequestData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-slate-500 bg-opacity-75 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg px-6 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 animate-slide-up">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <DocumentArrowDownIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">Request Documents</h3>
                  <p className="text-sm text-slate-600">{ivrRequest.ivrNumber} • {ivrRequest.patientName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              {/* Document Checklist */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Required Documents *
                </label>
                <div className="space-y-3">
                  {DOCUMENT_OPTIONS.map((document) => (
                    <div key={document.id} className="flex items-start space-x-3">
                      <div className="flex items-center h-5">
                        <input
                          id={document.id}
                          type="checkbox"
                          checked={formData.requestedDocuments.includes(document.id)}
                          onChange={() => handleDocumentToggle(document.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <label htmlFor={document.id} className="text-sm font-medium text-slate-700 cursor-pointer">
                          {document.label}
                        </label>
                        <p className="text-sm text-slate-500">{document.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {errors.requestedDocuments && (
                  <p className="mt-2 text-sm text-red-600">{errors.requestedDocuments}</p>
                )}
              </div>

              {/* Other Document */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Other Document (specify)
                </label>
                <input
                  type="text"
                  value={formData.otherDocument}
                  onChange={(e) => handleInputChange('otherDocument', e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                  placeholder="Specify any additional document needed..."
                />
              </div>

              {/* Additional Instructions */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Additional Instructions *
                </label>
                <textarea
                  rows={4}
                  value={formData.additionalInstructions}
                  onChange={(e) => handleInputChange('additionalInstructions', e.target.value)}
                  className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 ${
                    errors.additionalInstructions ? 'border-red-300' : 'border-slate-300'
                  }`}
                  placeholder="Provide specific instructions for document submission, deadlines, format requirements, or any other important details..."
                />
                <div className="mt-1 flex justify-between items-center">
                  {errors.additionalInstructions ? (
                    <p className="text-sm text-red-600">{errors.additionalInstructions}</p>
                  ) : (
                    <p className="text-sm text-slate-500">Minimum 10 characters required</p>
                  )}
                  <p className="text-sm text-slate-500">{formData.additionalInstructions.length} characters</p>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Document request will:</p>
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    <li>Update status to "DOCUMENTS_REQUESTED"</li>
                    <li>Send notification to requesting provider</li>
                    <li>Include detailed instructions for submission</li>
                    <li>Set automatic follow-up reminders</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 flex items-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Requesting...
                  </>
                ) : (
                  <>
                    <ClipboardDocumentListIcon className="h-4 w-4 mr-2" />
                    Request Documents
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DocumentRequestModal;