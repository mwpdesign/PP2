import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRightOnRectangleIcon,
  HomeIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  QueueListIcon,
  ClockIcon,
  CheckCircleIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  DocumentChartBarIcon
} from '@heroicons/react/24/solid';
import { useAuth } from '../../contexts/AuthContext';
import UnifiedDashboardLayout from '../shared/layout/UnifiedDashboardLayout';
import { MetricCard } from '../shared/DashboardWidgets/MetricCard';

interface IVRRequest {
  id: string;
  ivrNumber: string;
  patientName: string;
  doctorName: string;
  insurance: string;
  status: 'pending_review' | 'awaiting_docs' | 'ready' | 'completed';
  priority: 'high' | 'medium' | 'low';
  daysPending: number;
  submittedDate: string;
  patientId: string;
  doctorId: string;
}

interface DashboardStats {
  pendingReview: number;
  awaitingDocs: number;
  ready: number;
  completed: number;
}

// Memoized IVR request row component for performance
const IVRRequestRow = React.memo(({
  request,
  index,
  onRowClick,
  openMenuId,
  setOpenMenuId,
  navigate
}: {
  request: IVRRequest;
  index: number;
  onRowClick: (request: IVRRequest) => void;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
  navigate: (path: string) => void;
}) => {

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending_review: { color: 'amber', dot: 'bg-amber-500', bg: 'bg-amber-100', text: 'text-amber-800', label: 'Pending Review' },
      awaiting_docs: { color: 'blue', dot: 'bg-blue-500', bg: 'bg-blue-100', text: 'text-blue-800', label: 'Awaiting Docs' },
      ready: { color: 'emerald', dot: 'bg-emerald-500', bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Ready' },
      completed: { color: 'slate', dot: 'bg-slate-500', bg: 'bg-slate-100', text: 'text-slate-800', label: 'Completed' }
    };
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.pending_review;
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
        {request.ivrNumber}
      </td>
      <td className="px-4 py-3 text-gray-900 truncate max-w-[150px]">
        {request.patientName}
      </td>
      <td className="px-4 py-3 text-gray-600 truncate max-w-[150px]">
        {request.doctorName}
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
        {request.daysPending}d
      </td>
      <td className="px-6 py-2 relative">
        <div className="flex justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpenMenuId(openMenuId === request.id ? null : request.id);
            }}
            className="w-8 h-8 rounded hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all"
          >
            •••
          </button>
          {openMenuId === request.id && (
            <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10 min-w-[140px]">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/ivr-company/review/${request.id}`);
                  setOpenMenuId(null);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 text-slate-700"
              >
                Review Details
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle approve action
                  setOpenMenuId(null);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 text-emerald-600"
              >
                Quick Approve
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle request docs action
                  setOpenMenuId(null);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 text-blue-600"
              >
                Request Docs
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
});

const SimpleIVRDashboard: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navigation = [
    { name: 'Dashboard', href: '/ivr-company/dashboard', icon: HomeIcon },
    { name: 'Review Queue', href: '/ivr-company/queue', icon: QueueListIcon },
    { name: 'In Progress', href: '/ivr-company/in-progress', icon: ClockIcon },
    { name: 'Completed Today', href: '/ivr-company/completed', icon: CheckCircleIcon },
    { name: 'Communications', href: '/ivr-company/communications', icon: ChatBubbleLeftRightIcon },
    { name: 'Documents', href: '/ivr-company/documents', icon: DocumentTextIcon },
    { name: 'Reports', href: '/ivr-company/reports', icon: DocumentChartBarIcon },
    {
      name: 'Sign Out',
      href: '#',
      icon: ArrowRightOnRectangleIcon,
      onClick: handleLogout
    }
  ];

  const userInfo = {
    name: user?.first_name ? `${user.first_name} ${user.last_name}` : 'IVR Specialist',
    role: 'Insurance Verification Specialist',
    avatar: user?.first_name?.charAt(0) || 'I'
  };

  // Mock data - replace with actual API calls
  const [ivrRequests] = useState<IVRRequest[]>([
    {
      id: '660e8400-e29b-41d4-a716-446655440001',
      ivrNumber: 'IVR-2024-001',
      patientName: 'John Smith',
      doctorName: 'Dr. Sarah Wilson',
      insurance: 'Blue Cross Blue Shield',
      status: 'pending_review',
      priority: 'high',
      daysPending: 3,
      submittedDate: '2024-03-15',
      patientId: 'P-1234',
      doctorId: 'D-001'
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440002',
      ivrNumber: 'IVR-2024-002',
      patientName: 'Emily Davis',
      doctorName: 'Dr. Michael Brown',
      insurance: 'UnitedHealthcare',
      status: 'awaiting_docs',
      priority: 'medium',
      daysPending: 7,
      submittedDate: '2024-03-10',
      patientId: 'P-1235',
      doctorId: 'D-002'
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440003',
      ivrNumber: 'IVR-2024-003',
      patientName: 'David Wilson',
      doctorName: 'Dr. Jennifer Lee',
      insurance: 'Aetna',
      status: 'ready',
      priority: 'low',
      daysPending: 1,
      submittedDate: '2024-03-18',
      patientId: 'P-1236',
      doctorId: 'D-003'
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440004',
      ivrNumber: 'IVR-2024-004',
      patientName: 'Sarah Johnson',
      doctorName: 'Dr. Robert Chen',
      insurance: 'Cigna',
      status: 'completed',
      priority: 'medium',
      daysPending: 0,
      submittedDate: '2024-03-12',
      patientId: 'P-1237',
      doctorId: 'D-004'
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440005',
      ivrNumber: 'IVR-2024-005',
      patientName: 'Michael Brown',
      doctorName: 'Dr. Lisa Anderson',
      insurance: 'Medicare',
      status: 'pending_review',
      priority: 'high',
      daysPending: 2,
      submittedDate: '2024-03-16',
      patientId: 'P-1238',
      doctorId: 'D-005'
    }
  ]);

  const [dashboardStats] = useState<DashboardStats>({
    pendingReview: 15,
    awaitingDocs: 8,
    ready: 12,
    completed: 142
  });

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
        request.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.insurance.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [ivrRequests, statusFilter, searchTerm]);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleRowClick = useCallback((request: IVRRequest) => {
    navigate(`/ivr-company/review/${request.id}`);
  }, [navigate]);

  if (loading) {
    return (
      <UnifiedDashboardLayout navigation={navigation} userInfo={userInfo}>
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-6 h-24" />
            ))}
          </div>
          <div className="bg-white rounded-lg p-6 h-96" />
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout navigation={navigation} userInfo={userInfo}>
      <div className="space-y-6">
        {/* Stats Cards Header */}
        <div className="grid grid-cols-4 gap-6">
          <MetricCard
            title="Pending Review"
            value={dashboardStats.pendingReview}
            className="border-l-4 border-amber-500"
          />
          <MetricCard
            title="Awaiting Docs"
            value={dashboardStats.awaitingDocs}
            className="border-l-4 border-blue-500"
          />
          <MetricCard
            title="Ready to Approve"
            value={dashboardStats.ready}
            className="border-l-4 border-emerald-500"
          />
          <MetricCard
            title="Completed Today"
            value={dashboardStats.completed}
            className="border-l-4 border-slate-600"
          />
        </div>

        {/* Review Queue Table */}
        <div className="bg-white rounded-lg shadow-sm">
          {/* Search and Filter Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Review Queue</h2>
              <div className="flex items-center space-x-4">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="pending_review">Pending Review</option>
                  <option value="awaiting_docs">Awaiting Docs</option>
                  <option value="ready">Ready to Approve</option>
                  <option value="completed">Completed</option>
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
                    Doctor
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
                    Days Pending
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request, index) => (
                  <IVRRequestRow
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
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No IVR requests found</h3>
                <p className="text-gray-500">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Try adjusting your search or filter criteria.'
                    : 'IVR requests will appear here when submitted by doctors.'
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
};

export default SimpleIVRDashboard;