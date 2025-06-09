import React, { useState } from 'react';
import {
  XMarkIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: (approvalData: ApprovalData) => void;
  ivrRequest: {
    id: string;
    ivrNumber: string;
    patientName: string;
  };
  isLoading?: boolean;
}

interface ApprovalData {
  coveragePercentage: number;
  deductibleAmount: number;
  copayAmount: number;
  outOfPocketMax: number;
  coverageNotes: string;
}

const ApprovalModal: React.FC<ApprovalModalProps> = ({
  isOpen,
  onClose,
  onApprove,
  ivrRequest,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<ApprovalData>({
    coveragePercentage: 80,
    deductibleAmount: 0,
    copayAmount: 0,
    outOfPocketMax: 0,
    coverageNotes: ''
  });

  const [errors, setErrors] = useState<Partial<ApprovalData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<ApprovalData> = {};

    if (formData.coveragePercentage < 0 || formData.coveragePercentage > 100) {
      newErrors.coveragePercentage = 'Coverage percentage must be between 0 and 100';
    }

    if (formData.deductibleAmount < 0) {
      newErrors.deductibleAmount = 'Deductible amount cannot be negative';
    }

    if (formData.copayAmount < 0) {
      newErrors.copayAmount = 'Copay amount cannot be negative';
    }

    if (formData.outOfPocketMax < 0) {
      newErrors.outOfPocketMax = 'Out of pocket maximum cannot be negative';
    }

    if (!formData.coverageNotes.trim()) {
      newErrors.coverageNotes = 'Coverage notes are required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onApprove(formData);
    }
  };

  const handleInputChange = (field: keyof ApprovalData, value: string | number) => {
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
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircleIcon className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">Approve IVR Request</h3>
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
              {/* Coverage Percentage */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Coverage Percentage *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.coveragePercentage}
                    onChange={(e) => handleInputChange('coveragePercentage', parseInt(e.target.value) || 0)}
                    className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 ${
                      errors.coveragePercentage ? 'border-red-300' : 'border-slate-300'
                    }`}
                    placeholder="80"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-slate-500 text-sm">%</span>
                  </div>
                </div>
                {errors.coveragePercentage && (
                  <p className="mt-1 text-sm text-red-600">{errors.coveragePercentage}</p>
                )}
              </div>

              {/* Financial Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Deductible Amount */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Deductible Amount
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CurrencyDollarIcon className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.deductibleAmount}
                      onChange={(e) => handleInputChange('deductibleAmount', parseFloat(e.target.value) || 0)}
                      className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 ${
                        errors.deductibleAmount ? 'border-red-300' : 'border-slate-300'
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                  {errors.deductibleAmount && (
                    <p className="mt-1 text-sm text-red-600">{errors.deductibleAmount}</p>
                  )}
                </div>

                {/* Copay Amount */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Copay Amount
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CurrencyDollarIcon className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.copayAmount}
                      onChange={(e) => handleInputChange('copayAmount', parseFloat(e.target.value) || 0)}
                      className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 ${
                        errors.copayAmount ? 'border-red-300' : 'border-slate-300'
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                  {errors.copayAmount && (
                    <p className="mt-1 text-sm text-red-600">{errors.copayAmount}</p>
                  )}
                </div>

                {/* Out of Pocket Max */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Out of Pocket Max
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CurrencyDollarIcon className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.outOfPocketMax}
                      onChange={(e) => handleInputChange('outOfPocketMax', parseFloat(e.target.value) || 0)}
                      className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 ${
                        errors.outOfPocketMax ? 'border-red-300' : 'border-slate-300'
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                  {errors.outOfPocketMax && (
                    <p className="mt-1 text-sm text-red-600">{errors.outOfPocketMax}</p>
                  )}
                </div>
              </div>

              {/* Coverage Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Coverage Notes *
                </label>
                <textarea
                  rows={4}
                  value={formData.coverageNotes}
                  onChange={(e) => handleInputChange('coverageNotes', e.target.value)}
                  className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 ${
                    errors.coverageNotes ? 'border-red-300' : 'border-slate-300'
                  }`}
                  placeholder="Enter detailed coverage information, limitations, and any special instructions..."
                />
                {errors.coverageNotes && (
                  <p className="mt-1 text-sm text-red-600">{errors.coverageNotes}</p>
                )}
              </div>
            </div>

            {/* Info Box */}
            <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <DocumentTextIcon className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-emerald-800">
                  <p className="font-medium">Approval will generate:</p>
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    <li>IVR Results document with coverage details</li>
                    <li>Automatic status update to "APPROVED"</li>
                    <li>Notification to requesting provider</li>
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
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors disabled:opacity-50 flex items-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Approve Request
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

export default ApprovalModal;