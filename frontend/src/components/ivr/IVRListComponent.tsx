import React, { useState, useMemo, useCallback } from 'react';
import {
  UserIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';
import { SharedIVRRequest } from '../../data/mockIVRData';

interface IVRListComponentProps {
  /** Array of IVR requests to display */
  ivrRequests: SharedIVRRequest[];
  /** Currently selected IVR request */
  selectedIVR?: SharedIVRRequest | null;
  /** Callback when an IVR is selected */
  onSelectIVR: (ivr: SharedIVRRequest) => void;
  /** Optional loading state */
  loading?: boolean;
  /** Optional error state */
  error?: string | null;
  /** Optional className for styling */
  className?: string;
  /** Whether to show search and filters */
  showFilters?: boolean;
  /** Compact mode for smaller spaces */
  compact?: boolean;
}

type StatusFilter = 'all' | 'submitted' | 'in_review' | 'pending_approval' | 'documents_requested' | 'approved' | 'rejected' | 'escalated' | 'cancelled';
type PriorityFilter = 'all' | 'high' | 'medium' | 'low';

/**
 * IVRListComponent
 *
 * A compact, selectable list of IVR requests optimized for the 60% width master panel.
 * Features:
 * - Compact table design with essential information
 * - Row selection with visual feedback
 * - Search and filtering capabilities
 * - Status and priority badges
 * - Responsive design
 * - Loading and error states
 * - Accessibility support
 */
const IVRListComponent: React.FC<IVRListComponentProps> = ({
  ivrRequests,
  selectedIVR,
  onSelectIVR,
  loading = false,
  error = null,
  className = '',
  showFilters = true,
  compact = false
}) => {
  // Debug logging for props
  console.log('🟢 [STEP 0] IVRListComponent - Props received');
  console.log('🟢 [STEP 0] ivrRequests count:', ivrRequests?.length || 0);
  console.log('🟢 [STEP 0] selectedIVR:', selectedIVR?.ivrNumber || 'null');
  console.log('🟢 [STEP 0] onSelectIVR callback:', typeof onSelectIVR, !!onSelectIVR);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Filter and search logic
  const filteredRequests = useMemo(() => {
    return ivrRequests.filter(request => {
      const matchesSearch = !searchTerm ||
        request.ivrNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.serviceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.insurance.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || request.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [ivrRequests, searchTerm, statusFilter, priorityFilter]);

  // Status badge styling
  const getStatusBadge = useCallback((status: string) => {
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
  }, []);

  // Priority badge styling
  const getPriorityBadge = useCallback((priority: string) => {
    const priorityMap = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return priorityMap[priority as keyof typeof priorityMap] || 'bg-gray-100 text-gray-800';
  }, []);

  // Priority dot color
  const getPriorityDotColor = useCallback((priority: string) => {
    const colorMap = {
      high: 'bg-red-500',
      medium: 'bg-yellow-500',
      low: 'bg-green-500'
    };
    return colorMap[priority as keyof typeof colorMap] || 'bg-gray-500';
  }, []);

  // Format status text
  const formatStatusText = useCallback((status: string) => {
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
  }, []);

  // Format relative time
  const formatRelativeTime = useCallback((dateString: string) => {
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
  }, []);

  // Handle row click
  const handleRowClick = useCallback((request: SharedIVRRequest) => {
    console.log('🟢 [STEP 1] IVRListComponent - Row clicked!');
    console.log('🟢 [STEP 1] IVR Number:', request.ivrNumber);
    console.log('🟢 [STEP 1] IVR ID:', request.id);
    console.log('🟢 [STEP 1] Patient Name:', request.patientName);
    console.log('🟢 [STEP 1] onSelectIVR callback type:', typeof onSelectIVR);
    console.log('🟢 [STEP 1] onSelectIVR callback exists:', !!onSelectIVR);
    console.log('🟢 [STEP 1] About to call onSelectIVR...');

    onSelectIVR(request);

    console.log('🟢 [STEP 1] onSelectIVR called successfully');
    setOpenMenuId(null);
  }, [onSelectIVR]);

  // Handle search
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      if (openMenuId) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  if (error) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <div className="text-red-600 mb-2">Error loading IVR requests</div>
        <div className="text-sm text-gray-500">{error}</div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Header with Search and Filters */}
      {showFilters && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="space-y-3">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search IVR requests..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="flex-1 text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="submitted">Pending Review</option>
                <option value="in_review">In Review</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="documents_requested">Documents Requested</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
                className="flex-1 text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Priority</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>

            {/* Results count */}
            <div className="text-xs text-gray-500">
              {filteredRequests.length} of {ivrRequests.length} requests
            </div>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-6 text-center">
            <div className="text-gray-500 mb-2">No IVR requests found</div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                  Priority
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IVR ID
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((request, index) => (
                <tr
                  key={request.id}
                  className={`
                    group cursor-pointer transition-colors hover:bg-blue-50
                    ${selectedIVR?.id === request.id ? 'bg-blue-100 border-l-4 border-blue-500' : index % 2 === 1 ? 'bg-gray-50' : 'bg-white'}
                    ${compact ? 'h-10' : 'h-12'}
                  `}
                  onClick={() => handleRowClick(request)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRowClick(request);
                  }}
                  role="button"
                  aria-label={`Select IVR request ${request.ivrNumber} for ${request.patientName}`}
                >
                  {/* Priority Dot */}
                  <td className="px-3 py-2">
                    <div
                      className={`w-2 h-2 rounded-full ${getPriorityDotColor(request.priority)}`}
                      title={`Priority: ${request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}`}
                    />
                  </td>

                  {/* IVR ID */}
                  <td className="px-3 py-2 font-medium text-gray-900 text-sm">
                    <div className="flex items-center space-x-2">
                      {request.hasUnreadMessages && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full" aria-label="Unread messages"></span>
                      )}
                      <span className="truncate">{request.ivrNumber}</span>
                    </div>
                  </td>

                  {/* Patient */}
                  <td className="px-3 py-2 text-gray-900 text-sm">
                    <div className="flex items-center space-x-1 max-w-[120px]">
                      <UserIcon className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{request.patientName}</span>
                    </div>
                  </td>

                  {/* Service */}
                  <td className="px-3 py-2 text-gray-600 text-sm">
                    <div className="flex items-center space-x-1 max-w-[140px]">
                      <BuildingOfficeIcon className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{request.serviceType}</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(request.status)}`}>
                      {formatStatusText(request.status)}
                    </span>
                  </td>

                  {/* Submitted */}
                  <td className="px-3 py-2 text-gray-600 text-sm">
                    <div className="flex items-center space-x-1">
                      <CalendarDaysIcon className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{formatRelativeTime(request.submittedDate)}</span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-2 relative">
                    <div className="flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === request.id ? null : request.id);
                        }}
                        className="w-6 h-6 rounded hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all"
                        aria-label="More actions"
                        title="More actions"
                      >
                        <EllipsisVerticalIcon className="w-4 h-4" />
                      </button>
                      {openMenuId === request.id && (
                        <div className={`absolute right-0 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[140px] ${
                          index >= filteredRequests.length - 3 ? 'bottom-8' : 'top-8'
                        }`}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowClick(request);
                              setOpenMenuId(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-gray-700 flex items-center"
                          >
                            <UserIcon className="w-4 h-4 mr-2" />
                            View Details
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer with summary */}
      {!loading && filteredRequests.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>{filteredRequests.length} requests</span>
            {selectedIVR && (
              <span className="text-blue-600 font-medium">
                {selectedIVR.ivrNumber} selected
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default IVRListComponent;