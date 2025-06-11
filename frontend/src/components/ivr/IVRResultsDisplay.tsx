import React from 'react';
import { DocumentTextIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

interface IVRResults {
  caseNumber: string;
  verificationDate: string;
  coverageStatus: "Covered" | "Not Covered" | "Partial";
  coveragePercentage: number;
  deductibleAmount: number;
  copayAmount: number;
  outOfPocketMax: number;
  priorAuthStatus: "Approved" | "Denied" | "Pending";
  coverageDetails: string;
  coverageNotes: string;
}

interface IVRResultsDisplayProps {
  results: IVRResults;
  className?: string;
  showOrderButton?: boolean;
  onOrderClick?: () => void;
}

const IVRResultsDisplay: React.FC<IVRResultsDisplayProps> = ({
  results,
  className = "",
  showOrderButton = false,
  onOrderClick
}) => {
  const getCoverageStatusBadge = (status: string) => {
    const statusConfig = {
      "Covered": { bg: 'bg-green-100', text: 'text-green-800', label: 'Covered' },
      "Not Covered": { bg: 'bg-red-100', text: 'text-red-800', label: 'Not Covered' },
      "Partial": { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Partial Coverage' }
    };
    return statusConfig[status as keyof typeof statusConfig] || statusConfig["Covered"];
  };

  const getPriorAuthBadge = (status: string) => {
    const statusConfig = {
      "Approved": { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
      "Denied": { bg: 'bg-red-100', text: 'text-red-800', label: 'Denied' },
      "Pending": { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' }
    };
    return statusConfig[status as keyof typeof statusConfig] || statusConfig["Pending"];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const coverageStatusBadge = getCoverageStatusBadge(results.coverageStatus);
  const priorAuthBadge = getPriorAuthBadge(results.priorAuthStatus);

  return (
    <div className={`bg-emerald-50 border border-emerald-200 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <DocumentTextIcon className="h-6 w-6 text-emerald-600" />
          <h3 className="text-lg font-semibold text-gray-900">IVR Results</h3>
        </div>
        {showOrderButton && (
          <button
            onClick={onOrderClick}
            className="inline-flex items-center px-4 py-2 bg-slate-600 text-white text-sm font-medium rounded-lg hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-colors"
          >
                          <ClipboardDocumentListIcon className="h-4 w-4 mr-2" />
              Order Medical Products
          </button>
        )}
      </div>

      {/* Content Grid */}
      <div className="space-y-4">
        {/* Case Number and Verification Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Case Number
            </label>
            <p className="text-gray-900 font-mono text-sm bg-white px-3 py-2 rounded border">
              {results.caseNumber}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Verification Date
            </label>
            <p className="text-gray-900 bg-white px-3 py-2 rounded border">
              {formatDate(results.verificationDate)}
            </p>
          </div>
        </div>

        {/* Coverage Status and Percentage */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Coverage Status
            </label>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${coverageStatusBadge.bg} ${coverageStatusBadge.text}`}>
              {coverageStatusBadge.label}
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Coverage Percentage
            </label>
            <p className="text-gray-900 bg-white px-3 py-2 rounded border font-semibold text-lg">
              {results.coveragePercentage}%
            </p>
          </div>
        </div>

        {/* Financial Details - Updated to show actual approval data */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deductible Amount
            </label>
            <p className="text-gray-900 bg-white px-3 py-2 rounded border font-semibold">
              {formatCurrency(results.deductibleAmount)}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Copay Amount
            </label>
            <p className="text-gray-900 bg-white px-3 py-2 rounded border font-semibold">
              {formatCurrency(results.copayAmount)}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Out of Pocket Max
            </label>
            <p className="text-gray-900 bg-white px-3 py-2 rounded border font-semibold">
              {formatCurrency(results.outOfPocketMax)}
            </p>
          </div>
        </div>

        {/* Prior Authorization Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prior Authorization Status
          </label>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${priorAuthBadge.bg} ${priorAuthBadge.text}`}>
            {priorAuthBadge.label}
          </span>
        </div>

        {/* Coverage Details */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Coverage Details
          </label>
          <div className="bg-white p-4 rounded border">
            <p className="text-gray-900 text-sm leading-relaxed">
              {results.coverageDetails}
            </p>
          </div>
        </div>

        {/* Coverage Notes (from approval) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Approval Notes
          </label>
          <div className="bg-white p-4 rounded border">
            <p className="text-gray-900 text-sm leading-relaxed">
              {results.coverageNotes}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IVRResultsDisplay;