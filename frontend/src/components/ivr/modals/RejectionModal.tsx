import React, { useState } from 'react';
import {
  XMarkIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

interface RejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReject: (rejectionData: RejectionData) => void;
  ivrRequest: {
    id: string;
    ivrNumber: string;
    patientName: string;
  };
  isLoading?: boolean;
}

interface RejectionData {
  reason: string;
  explanation: string;
}

const REJECTION_REASONS = [
  { value: 'invalid_insurance', label: 'Invalid Insurance Information' },
  { value: 'product_not_covered', label: 'Product Not Covered' },
  { value: 'missing_documentation', label: 'Missing Documentation' },
  { value: 'patient_ineligible', label: 'Patient Ineligible' },
  { value: 'other', label: 'Other' }
];

const RejectionModal: React.FC<RejectionModalProps> = ({
  isOpen,
  onClose,
  onReject,
  ivrRequest,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<RejectionData>({
    reason: '',
    explanation: ''
  });

  const [errors, setErrors] = useState<Partial<RejectionData>>({});
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<RejectionData> = {};

    if (!formData.reason) {
      newErrors.reason = 'Please select a rejection reason';
    }

    if (!formData.explanation.trim()) {
      newErrors.explanation = 'Detailed explanation is required';
    } else if (formData.explanation.trim().length < 20) {
      newErrors.explanation = 'Explanation must be at least 20 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onReject(formData);
    }
  };

  const handleInputChange = (field: keyof RejectionData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleReasonSelect = (reason: string) => {
    handleInputChange('reason', reason);
    setIsDropdownOpen(false);
  };

  const getSelectedReasonLabel = () => {
    const selected = REJECTION_REASONS.find(r => r.value === formData.reason);
    return selected ? selected.label : 'Select rejection reason';
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
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircleIcon className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">Reject IVR Request</h3>
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
            <div className="space-y-4">
              {/* Rejection Reason Dropdown */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Rejection Reason *
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`relative w-full bg-white border rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 ${
                      errors.reason ? 'border-red-300' : 'border-slate-300'
                    }`}
                  >
                    <span className={`block truncate ${formData.reason ? 'text-slate-900' : 'text-slate-500'}`}>
                      {getSelectedReasonLabel()}
                    </span>
                    <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <ChevronDownIcon className="h-5 w-5 text-slate-400" />
                    </span>
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
                      {REJECTION_REASONS.map((reason) => (
                        <button
                          key={reason.value}
                          type="button"
                          onClick={() => handleReasonSelect(reason.value)}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-100 focus:bg-slate-100 focus:outline-none ${
                            formData.reason === reason.value ? 'bg-slate-100 text-slate-900' : 'text-slate-700'
                          }`}
                        >
                          {reason.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {errors.reason && (
                  <p className="mt-1 text-sm text-red-600">{errors.reason}</p>
                )}
              </div>

              {/* Detailed Explanation */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Detailed Explanation *
                </label>
                <textarea
                  rows={6}
                  value={formData.explanation}
                  onChange={(e) => handleInputChange('explanation', e.target.value)}
                  className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 ${
                    errors.explanation ? 'border-red-300' : 'border-slate-300'
                  }`}
                  placeholder="Please provide a detailed explanation for the rejection. Include specific reasons, missing information, or steps the provider can take to resubmit..."
                />
                <div className="mt-1 flex justify-between items-center">
                  {errors.explanation ? (
                    <p className="text-sm text-red-600">{errors.explanation}</p>
                  ) : (
                    <p className="text-sm text-slate-500">Minimum 20 characters required</p>
                  )}
                  <p className="text-sm text-slate-500">{formData.explanation.length} characters</p>
                </div>
              </div>
            </div>

            {/* Warning Box */}
            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Rejection will result in:</p>
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    <li>Status update to "REJECTED"</li>
                    <li>Immediate notification to requesting provider</li>
                    <li>Provider can resubmit with corrections</li>
                    <li>Detailed rejection reason will be documented</li>
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
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50 flex items-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Rejecting...
                  </>
                ) : (
                  <>
                    <XCircleIcon className="h-4 w-4 mr-2" />
                    Reject Request
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

export default RejectionModal;