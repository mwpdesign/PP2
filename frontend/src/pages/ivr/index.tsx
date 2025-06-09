import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { MetricCard } from '../../components/shared/DashboardWidgets/MetricCard';
import {
  PlusIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface DoctorIVRRequest {
  id: string;
  ivrNumber: string;
  patientName: string;
  serviceType: string;
  status: 'submitted' | 'in_review' | 'approved' | 'rejected' | 'awaiting_docs';
  priority: 'high' | 'medium' | 'low';
  submittedDate: string;
  lastUpdated: string;
  daysSinceSubmission: number;
  hasUnreadMessages: boolean;
  patientId: string;
  insurance: string;
  estimatedCompletion?: string;
}

interface DoctorDashboardStats {
  submitted: number;
  inReview: number;
  approved: number;
  awaitingDocs: number;
}

// Memoized IVR request row component for performance
const DoctorIVRRequestRow = React.memo(({
  request,
  index,
  onRowClick,
  onViewDetails,
  onCommunicate,
  navigate
}: {
  request: DoctorIVRRequest;
  index: number;
  onRowClick: (request: DoctorIVRRequest) => void;
  onViewDetails: (request: DoctorIVRRequest) => void;
  onCommunicate: (request: DoctorIVRRequest) => void;
  navigate: (path: string) => void;
}) => {

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      submitted: { color: 'blue', dot: 'bg-blue-500', bg: 'bg-blue-100', text: 'text-blue-800', label: 'Submitted' },
      in_review: { color: 'yellow', dot: 'bg-yellow-500', bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'In Review' },
      approved: { color: 'emerald', dot: 'bg-emerald-500', bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Approved' },
      rejected: { color: 'red', dot: 'bg-red-500', bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
      awaiting_docs: { color: 'amber', dot: 'bg-amber-500', bg: 'bg-amber-100', text: 'text-amber-800', label: 'Awaiting Docs' }
    };
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.submitted;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      high: { bg: 'bg-red-100', text: 'text-red-800', label: 'High' },
      medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Medium' },
      low: { bg: 'bg-green-100', text: 'text-green-800', label: 'Low' }
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
    >
      <td className="px-4 py-3 font-medium text-gray-900">
        <div className="flex items-center space-x-2">
          {request.hasUnreadMessages && (
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
          )}
          <span>{request.ivrNumber}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-gray-900 truncate max-w-[150px]">
        {request.patientName}
      </td>
      <td className="px-4 py-3 text-gray-600 truncate max-w-[150px]">
        {request.serviceType}
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {getInsuranceAbbreviation(request.insurance)}
        </span>
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
        {request.daysSinceSubmission}d
      </td>
      <td className="px-6 py-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(request);
            }}
            className="p-2 rounded-lg hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-colors"
            title="View Details"
          >
            <EyeIcon className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCommunicate(request);
            }}
            className="p-2 rounded-lg hover:bg-green-100 text-green-600 hover:text-green-700 transition-colors"
            title="Communication"
          >
            <ChatBubbleLeftRightIcon className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
});

const DoctorIVRManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Mock data for doctor's IVR submissions - replace with actual API calls
  const [ivrRequests] = useState<DoctorIVRRequest[]>([
    {
      id: 'IVR-001',
      ivrNumber: 'IVR-2024-001',
      patientName: 'John Smith',
      serviceType: 'Wound Care Authorization',
      status: 'approved',
      priority: 'high',
      submittedDate: '2024-03-15',
      lastUpdated: '2024-03-18',
      daysSinceSubmission: 3,
      hasUnreadMessages: false,
      patientId: 'P-1234',
      insurance: 'Blue Cross Blue Shield',
      estimatedCompletion: '2024-03-20'
    },
    {
      id: 'IVR-002',
      ivrNumber: 'IVR-2024-002',
      patientName: 'Emily Davis',
      serviceType: 'Skin Graft Authorization',
      status: 'in_review',
      priority: 'medium',
      submittedDate: '2024-03-16',
      lastUpdated: '2024-03-17',
      daysSinceSubmission: 2,
      hasUnreadMessages: true,
      patientId: 'P-1235',
      insurance: 'UnitedHealthcare',
      estimatedCompletion: '2024-03-22'
    },
    {
      id: 'IVR-003',
      ivrNumber: 'IVR-2024-003',
      patientName: 'David Wilson',
      serviceType: 'Negative Pressure Therapy',
      status: 'awaiting_docs',
      priority: 'high',
      submittedDate: '2024-03-14',
      lastUpdated: '2024-03-17',
      daysSinceSubmission: 4,
      hasUnreadMessages: true,
      patientId: 'P-1236',
      insurance: 'Aetna'
    },
    {
      id: 'IVR-004',
      ivrNumber: 'IVR-2024-004',
      patientName: 'Sarah Johnson',
      serviceType: 'Advanced Wound Care',
      status: 'submitted',
      priority: 'low',
      submittedDate: '2024-03-18',
      lastUpdated: '2024-03-18',
      daysSinceSubmission: 1,
      hasUnreadMessages: false,
      patientId: 'P-1237',
      insurance: 'Cigna'
    },
    {
      id: 'IVR-005',
      ivrNumber: 'IVR-2024-005',
      patientName: 'Michael Brown',
      serviceType: 'Collagen Dressing Auth',
      status: 'rejected',
      priority: 'medium',
      submittedDate: '2024-03-12',
      lastUpdated: '2024-03-16',
      daysSinceSubmission: 6,
      hasUnreadMessages: true,
      patientId: 'P-1238',
      insurance: 'Medicare'
    }
  ]);

  const [dashboardStats] = useState<DoctorDashboardStats>({
    submitted: 8,
    inReview: 5,
    approved: 12,
    awaitingDocs: 3
  });

  // Load data
  useEffect(() => {
    setLoading(false);
  }, []);

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

  const handleViewDetails = useCallback((request: DoctorIVRRequest) => {
    navigate(`/doctor/ivr/${request.id}`);
  }, [navigate]);

  const handleCommunicate = useCallback((request: DoctorIVRRequest) => {
    navigate(`/doctor/ivr/${request.id}?tab=communication`);
  }, [navigate]);

  const handleNewIVR = useCallback(() => {
    navigate('/doctor/patients/select');
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 p-6">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-6 h-24" />
            ))}
          </div>
          <div className="bg-white rounded-lg p-6 h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">IVR Management</h1>
            <p className="text-gray-600">Track your insurance verification requests</p>
          </div>
          <button
            onClick={handleNewIVR}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            New IVR Request
          </button>
        </div>
      </div>

      {/* Stats Cards Header */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        <MetricCard
          title="Submitted"
          value={dashboardStats.submitted}
          className="border-l-4 border-blue-500"
          icon={<DocumentTextIcon className="w-6 h-6 text-blue-500" />}
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
          title="Awaiting Docs"
          value={dashboardStats.awaitingDocs}
          className="border-l-4 border-amber-500"
          icon={<ExclamationTriangleIcon className="w-6 h-6 text-amber-500" />}
        />
      </div>

      {/* IVR Requests Table */}
      <div className="bg-white rounded-lg shadow-sm">
        {/* Search and Filter Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">My IVR Requests</h2>
            <div className="flex items-center space-x-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="submitted">Submitted</option>
                <option value="in_review">In Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="awaiting_docs">Awaiting Docs</option>
              </select>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search IVRs..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IVR#
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Insurance
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days Since
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
                  onViewDetails={handleViewDetails}
                  onCommunicate={handleCommunicate}
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
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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