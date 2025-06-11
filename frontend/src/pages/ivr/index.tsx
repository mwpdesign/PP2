import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useIVR } from '../../contexts/IVRContext';
import { MetricCard } from '../../components/shared/DashboardWidgets/MetricCard';
import { SharedIVRRequest, DashboardStats } from '../../data/mockIVRData';
import {
  PlusIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  CalendarDaysIcon,
  UserIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

// Type alias for Doctor view - uses shared interface
type DoctorIVRRequest = SharedIVRRequest;
type DoctorDashboardStats = DashboardStats;

// Memoized IVR request row component for performance
const DoctorIVRRequestRow = React.memo(({
  request,
  index,
  onRowClick,
  openMenuId,
  setOpenMenuId,
  navigate
}: {
  request: DoctorIVRRequest;
  index: number;
  onRowClick: (request: DoctorIVRRequest) => void;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
  navigate: (path: string) => void;
}) => {

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      submitted: { color: 'blue', dot: 'bg-blue-500', bg: 'bg-blue-100', text: 'text-blue-800', label: 'Submitted' },
      in_review: { color: 'amber', dot: 'bg-amber-500', bg: 'bg-amber-100', text: 'text-amber-800', label: 'In Review' },
      pending_approval: { color: 'emerald', dot: 'bg-emerald-500', bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Pending Approval' },
      documents_requested: { color: 'purple', dot: 'bg-purple-500', bg: 'bg-purple-100', text: 'text-purple-800', label: 'Documents Requested' },
      approved: { color: 'green', dot: 'bg-green-500', bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
      rejected: { color: 'red', dot: 'bg-red-500', bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
      escalated: { color: 'orange', dot: 'bg-orange-500', bg: 'bg-orange-100', text: 'text-orange-800', label: 'Escalated' },
      cancelled: { color: 'slate', dot: 'bg-slate-500', bg: 'bg-slate-100', text: 'text-slate-800', label: 'Cancelled' }
    };
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.submitted;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      high: { bg: 'bg-red-100', text: 'text-red-800', label: 'High Priority' },
      medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Medium Priority' },
      low: { bg: 'bg-green-100', text: 'text-green-800', label: 'Low Priority' }
    };
    return priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
  };

  const getInsuranceAbbreviation = (insurance: string) => {
    const abbrevMap: Record<string, string> = {
      'Blue Cross Blue Shield': 'BCBS',
      'UnitedHealthcare': 'UHC',
      'Aetna': 'AET',
      'Cigna': 'CIG',
      'Humana': 'HUM',
      'Medicare': 'MED'
    };
    return abbrevMap[insurance] || insurance.substring(0, 4).toUpperCase();
  };

  const statusBadge = getStatusBadge(request.status);
  const priorityBadge = getPriorityBadge(request.priority);

  const getFormattedDaysAgo = (submittedDate: string) => {
    const submitted = new Date(submittedDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - submitted.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return '1 week ago';
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <tr
      className={`group h-12 cursor-pointer transition-colors hover:bg-slate-100 ${
        index % 2 === 1 ? 'bg-slate-50' : 'bg-white'
      }`}
      onClick={() => onRowClick(request)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onRowClick(request);
      }}
      role="button"
      aria-label={`View IVR request ${request.ivrNumber} for ${request.patientName}`}
    >
      <td className="px-4 py-3 font-medium text-gray-900">
        <div className="flex items-center space-x-2">
          {request.hasUnreadMessages && (
            <span className="w-2 h-2 bg-slate-500 rounded-full" aria-label="Unread messages"></span>
          )}
          <span>{request.ivrNumber}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-gray-900 truncate max-w-[150px]">
        <div className="flex items-center space-x-2">
          <UserIcon className="w-4 h-4 text-gray-400" />
          <span>{request.patientName}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-gray-600 truncate max-w-[150px]">
        <div className="flex items-center space-x-2">
          <BuildingOfficeIcon className="w-4 h-4 text-gray-400" />
          <span>{request.serviceType}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center space-x-2">
          <ShieldCheckIcon className="w-4 h-4 text-slate-500" />
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
            {getInsuranceAbbreviation(request.insurance)}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${statusBadge.dot}`} />
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}>
            {statusBadge.label}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${priorityBadge.bg} ${priorityBadge.text}`}>
          {priorityBadge.label}
        </span>
      </td>
      <td className="px-4 py-3 text-gray-600 text-sm">
        <div className="flex items-center space-x-1">
          <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
          <span>{getFormattedDaysAgo(request.submittedDate)}</span>
        </div>
      </td>
      <td className="px-6 py-2 relative">
        <div className="flex justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpenMenuId(openMenuId === request.id ? null : request.id);
            }}
            className="w-8 h-8 rounded hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all"
            aria-label={`More actions for IVR ${request.ivrNumber}`}
          >
            <EllipsisVerticalIcon className="w-5 h-5" />
          </button>
          {openMenuId === request.id && (
            <div
              className={`absolute right-0 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10 min-w-[160px] ${
                index >= 3 ? 'bottom-8' : 'top-8'
              }`}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/doctor/ivr/${request.id}`);
                  setOpenMenuId(null);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 text-slate-700 flex items-center space-x-2"
              >
                <EyeIcon className="w-4 h-4" />
                <span>View Details</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/doctor/ivr/${request.id}?tab=communication`);
                  setOpenMenuId(null);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 text-slate-600 flex items-center space-x-2"
              >
                <ChatBubbleLeftRightIcon className="w-4 h-4" />
                <span>Open Communication</span>
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
});

const DoctorIVRManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { ivrRequests, dashboardStats } = useIVR();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Load data
  useEffect(() => {
    setLoading(false);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (openMenuId) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  // Filtered requests
  const filteredRequests = useMemo(() => {
    let filtered = ivrRequests;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(request =>
        request.ivrNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.serviceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.insurance.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [ivrRequests, statusFilter, searchTerm]);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleRowClick = useCallback((request: DoctorIVRRequest) => {
    // Navigate to IVR detail view for doctors
    navigate(`/doctor/ivr/${request.id}`);
  }, [navigate]);

  const handleNewIVR = useCallback(() => {
    navigate('/doctor/patients/select');
  }, [navigate]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-6 h-24" />
          ))}
        </div>
        <div className="bg-white rounded-lg p-6 h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Insurance Verification Requests</h1>
          <p className="text-gray-600">Track and manage your insurance verification requests</p>
        </div>
        <button
          onClick={handleNewIVR}
          className="inline-flex items-center px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          New IVR Request
        </button>
      </div>

      {/* Stats Cards Header */}
      <div className="grid grid-cols-4 gap-6">
        <MetricCard
          title="Submitted"
          value={dashboardStats.submitted}
          className="border-l-4 border-blue-500"
          icon={<DocumentTextIcon className="w-6 h-6 text-slate-500" />}
        />
        <MetricCard
          title="In Review"
          value={dashboardStats.inReview}
          className="border-l-4 border-yellow-500"
          icon={<ClockIcon className="w-6 h-6 text-yellow-500" />}
        />
        <MetricCard
          title="Approved"
          value={dashboardStats.approved}
          className="border-l-4 border-emerald-500"
          icon={<CheckCircleIcon className="w-6 h-6 text-emerald-500" />}
        />
        <MetricCard
          title="Documents Requested"
          value={dashboardStats.documentsRequested}
          className="border-l-4 border-purple-500"
          icon={<ExclamationTriangleIcon className="w-6 h-6 text-purple-500" />}
        />
      </div>

      {/* IVR Requests Table */}
      <div className="bg-white rounded-lg shadow-sm">
        {/* Search and Filter Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">My Insurance Verification Requests</h2>
            <div className="flex items-center space-x-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Filter by status"
              >
                <option value="all">All Status</option>
                <option value="submitted">Submitted</option>
                <option value="in_review">In Review</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="documents_requested">Documents Requested</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="escalated">Escalated</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search IVRs..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-label="Search IVR requests"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* High-Density Table */}
        <div className="overflow-x-auto">
          <table className="w-full" role="table" aria-label="IVR requests table">
            <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Request ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service Requested
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Insurance Provider
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority Level
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((request, index) => (
                <DoctorIVRRequestRow
                  key={request.id}
                  request={request}
                  index={index}
                  onRowClick={handleRowClick}
                  openMenuId={openMenuId}
                  setOpenMenuId={setOpenMenuId}
                  navigate={navigate}
                />
              ))}
            </tbody>
          </table>
        </div>

        {filteredRequests.length === 0 && (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DocumentTextIcon className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No IVR requests found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'You haven\'t submitted any IVR requests yet.'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <button
                  onClick={handleNewIVR}
                  className="inline-flex items-center px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Submit Your First IVR
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorIVRManagement;