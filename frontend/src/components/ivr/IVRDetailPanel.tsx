import React from 'react';
import {
  UserIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  CalendarDaysIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChatBubbleLeftRightIcon,
  PaperClipIcon
} from '@heroicons/react/24/outline';
import { SharedIVRRequest } from '../../data/mockIVRData';

interface IVRDetailPanelProps {
  /** The selected IVR request to display */
  ivr: SharedIVRRequest;
  /** Optional callback when the panel is closed */
  onClose?: () => void;
  /** Optional className for styling */
  className?: string;
}

/**
 * IVRDetailPanel Component
 *
 * Displays detailed information about a selected IVR request in the 40% detail panel.
 * Features:
 * - Patient and doctor information
 * - Service and insurance details
 * - Status and priority information
 * - Timeline and progress tracking
 * - Action buttons for common tasks
 * - Responsive design optimized for detail panel
 */
const IVRDetailPanel: React.FC<IVRDetailPanelProps> = ({
  ivr,
  onClose,
  className = ''
}) => {
  // Format status text
  const formatStatusText = (status: string) => {
    const statusTextMap = {
      submitted: 'Pending Review',
      in_review: 'In Review',
      pending_approval: 'Pending Approval',
      documents_requested: 'Documents Requested',
      approved: 'Approved',
      rejected: 'Rejected',
      escalated: 'Escalated',
      cancelled: 'Cancelled'
    };
    return statusTextMap[status as keyof typeof statusTextMap] || status;
  };

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    const statusMap = {
      submitted: 'bg-blue-100 text-blue-800',
      in_review: 'bg-yellow-100 text-yellow-800',
      pending_approval: 'bg-orange-100 text-orange-800',
      documents_requested: 'bg-purple-100 text-purple-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      escalated: 'bg-pink-100 text-pink-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return statusMap[status as keyof typeof statusMap] || 'bg-gray-100 text-gray-800';
  };

  // Get priority badge styling
  const getPriorityBadge = (priority: string) => {
    const priorityMap = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return priorityMap[priority as keyof typeof priorityMap] || 'bg-gray-100 text-gray-800';
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    const iconMap = {
      submitted: ClockIcon,
      in_review: ClockIcon,
      pending_approval: ExclamationTriangleIcon,
      documents_requested: DocumentTextIcon,
      approved: CheckCircleIcon,
      rejected: XCircleIcon,
      escalated: ExclamationTriangleIcon,
      cancelled: XCircleIcon
    };
    return iconMap[status as keyof typeof iconMap] || ClockIcon;
  };

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return '1 week ago';
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const StatusIcon = getStatusIcon(ivr.status);

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{ivr.ivrNumber}</h2>
            <p className="text-sm text-gray-600">IVR Request Details</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close detail panel"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Status and Priority */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <StatusIcon className="w-5 h-5 text-gray-500" />
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(ivr.status)}`}>
                {formatStatusText(ivr.status)}
              </span>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityBadge(ivr.priority)}`}>
              {ivr.priority.charAt(0).toUpperCase() + ivr.priority.slice(1)} Priority
            </span>
            {ivr.hasUnreadMessages && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                Unread Messages
              </span>
            )}
          </div>

          {/* Patient Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <UserIcon className="w-4 h-4 mr-2 text-gray-500" />
              Patient Information
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Name:</span>
                <span className="text-sm font-medium text-gray-900">{ivr.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Patient ID:</span>
                <span className="text-sm font-medium text-gray-900">{ivr.patientId}</span>
              </div>
            </div>
          </div>

          {/* Doctor Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <BuildingOfficeIcon className="w-4 h-4 mr-2 text-gray-500" />
              Requesting Provider
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Doctor:</span>
                <span className="text-sm font-medium text-gray-900">{ivr.doctorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Doctor ID:</span>
                <span className="text-sm font-medium text-gray-900">{ivr.doctorId}</span>
              </div>
            </div>
          </div>

          {/* Service Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <DocumentTextIcon className="w-4 h-4 mr-2 text-gray-500" />
              Service Details
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Service Type:</span>
                <span className="text-sm font-medium text-gray-900">{ivr.serviceType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Insurance:</span>
                <span className="text-sm font-medium text-gray-900 flex items-center">
                  <ShieldCheckIcon className="w-4 h-4 mr-1 text-gray-500" />
                  {ivr.insurance}
                </span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <CalendarDaysIcon className="w-4 h-4 mr-2 text-gray-500" />
              Timeline
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Submitted:</span>
                <span className="text-sm font-medium text-gray-900">{formatRelativeTime(ivr.submittedDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Last Updated:</span>
                <span className="text-sm font-medium text-gray-900">{formatRelativeTime(ivr.lastUpdated)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Days Pending:</span>
                <span className="text-sm font-medium text-gray-900">{ivr.daysPending} days</span>
              </div>
              {ivr.estimatedCompletion && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Est. Completion:</span>
                  <span className="text-sm font-medium text-gray-900">{formatRelativeTime(ivr.estimatedCompletion)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Hierarchy Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Network Information</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Organization:</span>
                <span className="text-sm font-medium text-gray-900">{ivr.organizationId}</span>
              </div>
              {ivr.territoryId && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Territory:</span>
                  <span className="text-sm font-medium text-gray-900">{ivr.territoryId}</span>
                </div>
              )}
              {ivr.distributorId && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Distributor:</span>
                  <span className="text-sm font-medium text-gray-900">{ivr.distributorId}</span>
                </div>
              )}
              {ivr.salesRepId && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Sales Rep:</span>
                  <span className="text-sm font-medium text-gray-900">{ivr.salesRepId}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex flex-col space-y-2">
          <button className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <DocumentTextIcon className="w-4 h-4 mr-2" />
            View Full Details
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <ChatBubbleLeftRightIcon className="w-4 h-4 mr-1" />
              Message
            </button>
            <button className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <PaperClipIcon className="w-4 h-4 mr-1" />
              Documents
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IVRDetailPanel;