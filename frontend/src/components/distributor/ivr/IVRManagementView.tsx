import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { IVRRequest, IVRStatus, IVRPriority } from '../../../types/ivr';

interface IVRStats {
  totalIVRs: number;
  pendingReview: number;
  approved: number;
  rejected: number;
}

// Mock IVR data - replace with actual API calls
const mockIVRs: IVRRequest[] = [
  {
    id: 'IVR-2024-001',
    patient: {
      id: 'P-1234',
      firstName: 'John',
      lastName: 'Smith',
      dateOfBirth: '1980-05-15',
      email: 'john@example.com',
      phone: '(555) 123-4567',
      address: '123 Main St',
      city: 'Boston',
      state: 'MA',
      zipCode: '02101',
      primaryCondition: 'Chronic wound care',
      lastVisitDate: '2024-03-15',
      insuranceInfo: {
        provider: 'Blue Cross Blue Shield',
        policyNumber: 'BCBS123456',
        groupNumber: 'GRP001',
        status: 'active'
      }
    },
    provider: {
      id: 'PR-001',
      name: 'Dr. Sarah Johnson',
      speciality: 'Wound Care',
      npi: '1234567890'
    },
    serviceType: 'Wound Care Treatment',
    priority: IVRPriority.HIGH,
    status: IVRStatus.IN_REVIEW,
    documents: [],
    statusHistory: [],
    approvals: [],
    escalations: [],
    facilityId: 'F-001',
    createdAt: '2024-03-20T10:30:00Z',
    updatedAt: '2024-03-20T14:15:00Z',
    reviewNotes: [],
    communication: [],
    reviews: []
  },
  {
    id: 'IVR-2024-002',
    patient: {
      id: 'P-1235',
      firstName: 'Emily',
      lastName: 'Davis',
      dateOfBirth: '1988-03-30',
      email: 'emily@example.com',
      phone: '(555) 456-7890',
      address: '321 Elm St',
      city: 'Boston',
      state: 'MA',
      zipCode: '02104',
      primaryCondition: 'Pressure sore',
      lastVisitDate: '2024-02-28',
      insuranceInfo: {
        provider: 'Cigna',
        policyNumber: 'CIG901234',
        groupNumber: 'GRP004',
        status: 'pending'
      }
    },
    provider: {
      id: 'PR-002',
      name: 'Dr. Michael Brown',
      speciality: 'Dermatology',
      npi: '0987654321'
    },
    serviceType: 'Advanced Wound Dressing',
    priority: IVRPriority.MEDIUM,
    status: IVRStatus.APPROVED,
    documents: [],
    statusHistory: [],
    approvals: [],
    escalations: [],
    facilityId: 'F-001',
    createdAt: '2024-03-19T09:15:00Z',
    updatedAt: '2024-03-20T11:30:00Z',
    reviewNotes: [],
    communication: [],
    reviews: []
  },
  {
    id: 'IVR-2024-003',
    patient: {
      id: 'P-1236',
      firstName: 'David',
      lastName: 'Wilson',
      dateOfBirth: '1965-09-12',
      email: 'david@example.com',
      phone: '(555) 567-8901',
      address: '654 Maple Ave',
      city: 'Boston',
      state: 'MA',
      zipCode: '02105',
      primaryCondition: 'Venous leg ulcer',
      lastVisitDate: '2024-03-18',
      insuranceInfo: {
        provider: 'Medicare',
        policyNumber: 'MED567890',
        groupNumber: 'GRP005',
        status: 'active'
      }
    },
    provider: {
      id: 'PR-003',
      name: 'Dr. Lisa Chen',
      speciality: 'Vascular Surgery',
      npi: '1122334455'
    },
    serviceType: 'Negative Pressure Therapy',
    priority: IVRPriority.URGENT,
    status: IVRStatus.SUBMITTED,
    documents: [],
    statusHistory: [],
    approvals: [],
    escalations: [],
    facilityId: 'F-001',
    createdAt: '2024-03-20T08:45:00Z',
    updatedAt: '2024-03-20T08:45:00Z',
    reviewNotes: [],
    communication: [],
    reviews: []
  },
  {
    id: 'IVR-2024-004',
    patient: {
      id: 'P-1237',
      firstName: 'Maria',
      lastName: 'Rodriguez',
      dateOfBirth: '1975-12-03',
      email: 'maria@example.com',
      phone: '(555) 345-6789',
      address: '789 Pine St',
      city: 'Boston',
      state: 'MA',
      zipCode: '02103',
      primaryCondition: 'Diabetic ulcer',
      lastVisitDate: '2024-03-10',
      insuranceInfo: {
        provider: 'Aetna',
        policyNumber: 'AET345678',
        groupNumber: 'GRP003',
        status: 'active'
      }
    },
    provider: {
      id: 'PR-004',
      name: 'Dr. Robert Kim',
      speciality: 'Endocrinology',
      npi: '5566778899'
    },
    serviceType: 'Collagen Matrix',
    priority: IVRPriority.LOW,
    status: IVRStatus.REJECTED,
    documents: [],
    statusHistory: [],
    approvals: [],
    escalations: [],
    facilityId: 'F-001',
    createdAt: '2024-03-18T16:20:00Z',
    updatedAt: '2024-03-19T10:45:00Z',
    reviewNotes: [],
    communication: [],
    reviews: []
  }
];

// Memoized IVR row component for performance
const IVRRow = React.memo(({
  ivr,
  index,
  onRowClick,
  openMenuId,
  setOpenMenuId
}: {
  ivr: IVRRequest;
  index: number;
  onRowClick: (ivr: IVRRequest) => void;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
}) => {
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return '1d ago';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)}w ago`;
    return `${Math.ceil(diffDays / 30)}mo ago`;
  };

  const getStatusBadgeColor = (status: IVRStatus) => {
    switch (status) {
      case IVRStatus.APPROVED:
        return 'bg-green-100 text-green-800';
      case IVRStatus.REJECTED:
        return 'bg-red-100 text-red-800';
      case IVRStatus.IN_REVIEW:
        return 'bg-blue-100 text-blue-800';
      case IVRStatus.SUBMITTED:
        return 'bg-yellow-100 text-yellow-800';
      case IVRStatus.DRAFT:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityDotColor = (priority: IVRPriority) => {
    switch (priority) {
      case IVRPriority.URGENT:
        return 'bg-red-500';
      case IVRPriority.HIGH:
        return 'bg-orange-500';
      case IVRPriority.MEDIUM:
        return 'bg-yellow-500';
      case IVRPriority.LOW:
        return 'bg-green-500';
      default:
        return 'bg-gray-400';
    }
  };

  const formatStatusText = (status: IVRStatus) => {
    switch (status) {
      case IVRStatus.IN_REVIEW:
        return 'In Review';
      case IVRStatus.SUBMITTED:
        return 'Pending Review';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <tr
      className={`group h-12 cursor-pointer transition-colors hover:bg-slate-100 ${
        index % 2 === 1 ? 'bg-slate-50' : 'bg-white'
      }`}
      onClick={() => onRowClick(ivr)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onRowClick(ivr);
      }}
    >
      <td className="px-4 py-3">
        <div
          className={`w-2 h-2 rounded-full ${getPriorityDotColor(ivr.priority)}`}
          title={`Priority: ${ivr.priority.charAt(0).toUpperCase() + ivr.priority.slice(1)}`}
        />
      </td>
      <td className="px-4 py-3 font-medium text-gray-900 text-sm">
        {ivr.id}
      </td>
      <td className="px-4 py-3 text-gray-900 text-sm truncate max-w-[150px]">
        {ivr.patient.firstName} {ivr.patient.lastName}
      </td>
      <td className="px-4 py-3 text-gray-600 text-sm truncate max-w-[120px]">
        {ivr.provider.name}
      </td>
      <td className="px-4 py-3 text-gray-600 text-sm truncate max-w-[140px]">
        {ivr.serviceType}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(ivr.status)}`}>
          {formatStatusText(ivr.status)}
        </span>
      </td>
      <td className="px-4 py-3 text-gray-600 text-sm">
        {formatRelativeTime(ivr.createdAt)}
      </td>
      <td className="px-6 py-2 relative">
        <div className="flex justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpenMenuId(openMenuId === ivr.id ? null : ivr.id);
            }}
            className="w-8 h-8 rounded hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all"
            aria-label={`More actions for IVR ${ivr.id}`}
            title="More actions"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
          {openMenuId === ivr.id && (
            <div className={`absolute right-0 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10 min-w-[140px] ${
              index >= 3 ? 'bottom-8' : 'top-8'
            }`}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRowClick(ivr);
                  setOpenMenuId(null);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 text-slate-700 flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View Details
              </button>
              {ivr.status === IVRStatus.SUBMITTED && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle review action
                    setOpenMenuId(null);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 text-blue-600 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Start Review
                </button>
              )}
              {ivr.status === IVRStatus.IN_REVIEW && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle approve action
                      setOpenMenuId(null);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 text-green-600 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Approve
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle reject action
                      setOpenMenuId(null);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 text-red-600 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Reject
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
});

const IVRManagementView: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<IVRStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<IVRPriority | 'all'>('all');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Calculate stats from mock data
  const stats: IVRStats = useMemo(() => {
    return {
      totalIVRs: mockIVRs.length,
      pendingReview: mockIVRs.filter(ivr => ivr.status === IVRStatus.SUBMITTED).length,
      approved: mockIVRs.filter(ivr => ivr.status === IVRStatus.APPROVED).length,
      rejected: mockIVRs.filter(ivr => ivr.status === IVRStatus.REJECTED).length
    };
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

  // Filtered IVRs
  const filteredIVRs = useMemo(() => {
    return mockIVRs.filter(ivr => {
      const matchesSearch = !searchTerm ||
        ivr.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${ivr.patient.firstName} ${ivr.patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ivr.provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ivr.serviceType.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || ivr.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || ivr.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [searchTerm, statusFilter, priorityFilter]);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleRowClick = useCallback((ivr: IVRRequest) => {
    // Navigate to IVR details page
    navigate(`/distributor/ivr/${ivr.id}`);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      {/* Stats Header Cards */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total IVRs</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalIVRs}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Review</p>
              <p className="text-3xl font-bold text-orange-600">{stats.pendingReview}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* IVR Management Table */}
      <div className="bg-white rounded-lg shadow-sm">
        {/* Search and Filters Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">IVR Management</h2>
            <div className="flex items-center space-x-4">
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
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as IVRStatus | 'all')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="all">All Status</option>
                <option value={IVRStatus.SUBMITTED}>Pending Review</option>
                <option value={IVRStatus.IN_REVIEW}>In Review</option>
                <option value={IVRStatus.APPROVED}>Approved</option>
                <option value={IVRStatus.REJECTED}>Rejected</option>
                <option value={IVRStatus.DRAFT}>Draft</option>
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as IVRPriority | 'all')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="all">All Priority</option>
                <option value={IVRPriority.URGENT}>Urgent</option>
                <option value={IVRPriority.HIGH}>High</option>
                <option value={IVRPriority.MEDIUM}>Medium</option>
                <option value={IVRPriority.LOW}>Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* High-Density Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  Priority
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IVR ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Provider
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
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
              {filteredIVRs.map((ivr, index) => (
                <IVRRow
                  key={ivr.id}
                  ivr={ivr}
                  index={index}
                  onRowClick={handleRowClick}
                  openMenuId={openMenuId}
                  setOpenMenuId={setOpenMenuId}
                />
              ))}
            </tbody>
          </table>
        </div>

        {filteredIVRs.length === 0 && (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' ? 'No IVRs found' : 'No IVRs yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                  ? 'No IVRs match your current filters. Try adjusting your search criteria.'
                  : 'IVR submissions will appear here once they are created.'
                }
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IVRManagementView;