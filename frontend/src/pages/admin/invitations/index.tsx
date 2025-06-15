import React, { useState, useEffect, useCallback } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon,
  EyeIcon,
  PaperAirplaneIcon,
  TrashIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  UsersIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

import { invitationService } from '../../../services/invitationService';
import {
  Invitation,
  InvitationListParams,
  InvitationStatistics,
  InvitationType,
  InvitationStatus
} from '../../../types/invitation';
import { InvitationCreateModal } from '../../../components/admin/invitations/InvitationCreateModal';
import { InvitationDetailModal } from '../../../components/admin/invitations/InvitationDetailModal';
import { InvitationAnalyticsDashboard } from '../../../components/admin/invitations/InvitationAnalyticsDashboard';
import { BulkInvitationModal } from '../../../components/admin/invitations/BulkInvitationModal';

// Mock data for now - will be replaced with actual API calls
const mockInvitations = [
  {
    id: '1',
    email: 'doctor@example.com',
    full_name: 'Dr. John Smith',
    invitation_type: 'doctor',
    role_name: 'Healthcare Provider',
    status: 'pending',
    created_at: '2025-01-15T10:00:00Z',
    expires_at: '2025-01-22T10:00:00Z',
    email_attempts: 1,
    is_expired: false,
    days_until_expiry: 7
  },
  {
    id: '2',
    email: 'sales@example.com',
    full_name: 'Jane Doe',
    invitation_type: 'sales',
    role_name: 'Sales Representative',
    status: 'sent',
    created_at: '2025-01-14T15:30:00Z',
    expires_at: '2025-01-21T15:30:00Z',
    email_attempts: 2,
    is_expired: false,
    days_until_expiry: 6
  },
  {
    id: '3',
    email: 'admin@example.com',
    full_name: 'Bob Wilson',
    invitation_type: 'office_admin',
    role_name: 'Office Administrator',
    status: 'accepted',
    created_at: '2025-01-10T09:15:00Z',
    expires_at: '2025-01-17T09:15:00Z',
    email_attempts: 1,
    is_expired: false,
    days_until_expiry: 2
  },
  {
    id: '4',
    email: 'distributor@medwest.com',
    full_name: 'Sarah Johnson',
    invitation_type: 'distributor',
    role_name: 'Regional Distributor',
    status: 'accepted',
    created_at: '2025-01-12T14:20:00Z',
    expires_at: '2025-01-19T14:20:00Z',
    email_attempts: 1,
    is_expired: false,
    days_until_expiry: 4
  },
  {
    id: '5',
    email: 'ivr.specialist@verifycare.com',
    full_name: 'Michael Chen',
    invitation_type: 'ivr_company',
    role_name: 'IVR Specialist',
    status: 'sent',
    created_at: '2025-01-13T11:45:00Z',
    expires_at: '2025-01-20T11:45:00Z',
    email_attempts: 3,
    is_expired: false,
    days_until_expiry: 5
  },
  {
    id: '6',
    email: 'expired@example.com',
    full_name: 'David Brown',
    invitation_type: 'medical_staff',
    role_name: 'Medical Assistant',
    status: 'expired',
    created_at: '2025-01-05T08:30:00Z',
    expires_at: '2025-01-12T08:30:00Z',
    email_attempts: 2,
    is_expired: true,
    days_until_expiry: -3
  },
  {
    id: '7',
    email: 'logistics@fastship.com',
    full_name: 'Lisa Rodriguez',
    invitation_type: 'shipping_logistics',
    role_name: 'Logistics Coordinator',
    status: 'pending',
    created_at: '2025-01-16T16:00:00Z',
    expires_at: '2025-01-23T16:00:00Z',
    email_attempts: 0,
    is_expired: false,
    days_until_expiry: 8
  },
  {
    id: '8',
    email: 'master.dist@healthsupply.com',
    full_name: 'Robert Taylor',
    invitation_type: 'master_distributor',
    role_name: 'Master Distributor',
    status: 'accepted',
    created_at: '2025-01-08T13:15:00Z',
    expires_at: '2025-01-15T13:15:00Z',
    email_attempts: 1,
    is_expired: false,
    days_until_expiry: 0
  }
];

const mockStatistics = {
  total_invitations: 156,
  pending_invitations: 23,
  accepted_invitations: 89,
  expired_invitations: 12,
  acceptance_rate: 0.78,
  sent_invitations: 32,
  cancelled_invitations: 0,
  failed_invitations: 0,
  average_acceptance_time_hours: 48,
  invitations_by_type: {
    doctor: 45,
    sales: 28,
    distributor: 15,
    master_distributor: 8,
    office_admin: 25,
    medical_staff: 18,
    ivr_company: 12,
    shipping_logistics: 5,
    admin: 0,
    chp_admin: 0
  },
  invitations_by_day: [
    { date: '2025-01-10', count: 5 },
    { date: '2025-01-11', count: 8 },
    { date: '2025-01-12', count: 12 },
    { date: '2025-01-13', count: 7 },
    { date: '2025-01-14', count: 15 },
    { date: '2025-01-15', count: 9 },
    { date: '2025-01-16', count: 6 }
  ]
};

const AdminInvitationManagement: React.FC = () => {
  // State management
  const [invitations, setInvitations] = useState(mockInvitations);
  const [statistics, setStatistics] = useState(mockStatistics);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedInvitation, setSelectedInvitation] = useState<any>(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAnalyticsDashboard, setShowAnalyticsDashboard] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Filter and pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const itemsPerPage = 20;

  // Load invitations with filters
  const loadInvitations = useCallback(async (page: number = 1, reset: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      const params: InvitationListParams = {
        limit: itemsPerPage,
        offset: (page - 1) * itemsPerPage,
        sort_by: 'created_at',
        sort_order: 'desc'
      };

      // Apply filters
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (typeFilter !== 'all') {
        params.invitation_type = typeFilter;
      }
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      try {
        const response = await invitationService.listInvitations(params);

        if (reset || page === 1) {
          setInvitations(response.invitations);
        } else {
          setInvitations(prev => [...prev, ...response.invitations]);
        }

        setTotalCount(response.total_count);
        setHasMore(response.has_more);
        setCurrentPage(page);
      } catch (apiError) {
        console.log('🎭 API not available, using mock data for invitations');
        // Fallback to mock data when API is not available
        if (reset || page === 1) {
          setInvitations(mockInvitations);
        }
        setTotalCount(mockInvitations.length);
        setHasMore(false);
        setCurrentPage(page);
      }

    } catch (err) {
      console.error('Error loading invitations:', err);
      setError('Failed to load invitations. Please try again.');
      toast.error('Failed to load invitations');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, typeFilter]);

  // Load statistics
  const loadStatistics = useCallback(async () => {
    try {
      const stats = await invitationService.getInvitationStatistics({ days: 30 });
      setStatistics(stats);
    } catch (err) {
      console.log('🎭 API not available, using mock statistics');
      // Fallback to mock statistics when API is not available
      setStatistics(mockStatistics);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadInvitations(1, true);
    loadStatistics();
  }, [loadInvitations, loadStatistics]);

  // Handle search
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  }, []);

  // Handle filter changes
  const handleStatusFilter = useCallback((status: InvitationStatus | 'all') => {
    setStatusFilter(status as string);
    setCurrentPage(1);
  }, []);

  const handleTypeFilter = useCallback((type: InvitationType | 'all') => {
    setTypeFilter(type as string);
    setCurrentPage(1);
  }, []);

  // Handle invitation actions
  const handleResendInvitation = async (invitation: any) => {
    try {
      await invitationService.resendInvitation(invitation.id);
      toast.success('Invitation resent successfully');
      loadInvitations(1, true);
    } catch (err) {
      console.error('Error resending invitation:', err);
      toast.error('Failed to resend invitation');
    }
  };

  const handleCancelInvitation = async (invitation: any) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) {
      return;
    }

    try {
      await invitationService.cancelInvitation(invitation.id);
      toast.success('Invitation cancelled successfully');
      loadInvitations(1, true);
    } catch (err) {
      console.error('Error cancelling invitation:', err);
      toast.error('Failed to cancel invitation');
    }
  };

  const handleExtendExpiry = async (invitation: any, days: number = 7) => {
    try {
      await invitationService.extendInvitationExpiry(invitation.id, days);
      toast.success(`Invitation expiry extended by ${days} days`);
      loadInvitations(1, true);
    } catch (err) {
      console.error('Error extending invitation:', err);
      toast.error('Failed to extend invitation expiry');
    }
  };

  // Handle bulk operations
  const handleBulkExpireOld = async () => {
    if (!confirm('Are you sure you want to expire all old invitations?')) {
      return;
    }

    try {
      const result = await invitationService.expireOldInvitations();
      toast.success(`Expired ${result.affected_count} old invitations`);
      loadInvitations(1, true);
      loadStatistics();
    } catch (err) {
      console.error('Error expiring old invitations:', err);
      toast.error('Failed to expire old invitations');
    }
  };

  const handleBulkCleanup = async () => {
    if (!confirm('Are you sure you want to cleanup old completed invitations? This action cannot be undone.')) {
      return;
    }

    try {
      const result = await invitationService.cleanupOldInvitations(90);
      toast.success(`Cleaned up ${result.affected_count} old invitations`);
      loadInvitations(1, true);
      loadStatistics();
    } catch (err) {
      console.error('Error cleaning up invitations:', err);
      toast.error('Failed to cleanup old invitations');
    }
  };

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';

    switch (status) {
      case 'pending':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      case 'sent':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'accepted':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'expired':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'cancelled':
        return `${baseClasses} bg-gray-100 text-gray-600`;
      case 'failed':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  // Get type badge styling
  const getTypeBadge = (type: string) => {
    const baseClasses = 'inline-flex items-center px-2 py-1 rounded text-xs font-medium';

    switch (type) {
      case 'doctor':
        return `${baseClasses} bg-blue-50 text-blue-700`;
      case 'sales':
        return `${baseClasses} bg-green-50 text-green-700`;
      case 'distributor':
        return `${baseClasses} bg-purple-50 text-purple-700`;
      case 'master_distributor':
        return `${baseClasses} bg-indigo-50 text-indigo-700`;
      case 'office_admin':
        return `${baseClasses} bg-yellow-50 text-yellow-700`;
      case 'medical_staff':
        return `${baseClasses} bg-pink-50 text-pink-700`;
      case 'ivr_company':
        return `${baseClasses} bg-cyan-50 text-cyan-700`;
      case 'shipping_logistics':
        return `${baseClasses} bg-orange-50 text-orange-700`;
      case 'admin':
        return `${baseClasses} bg-red-50 text-red-700`;
      case 'chp_admin':
        return `${baseClasses} bg-gray-50 text-gray-700`;
      default:
        return `${baseClasses} bg-gray-50 text-gray-700`;
    }
  };

  // Filter invitations based on search and filters
  const filteredInvitations = invitations.filter(invitation => {
    const matchesSearch = !searchTerm ||
      invitation.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invitation.full_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || invitation.status === statusFilter;
    const matchesType = typeFilter === 'all' || invitation.invitation_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Invitation Management</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage and monitor all user invitations across the platform
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAnalyticsDashboard(true)}
            className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2E86AB]"
          >
            <ChartBarIcon className="h-4 w-4 mr-2" />
            Analytics
          </button>
          <button
            onClick={() => setShowBulkModal(true)}
            className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2E86AB]"
          >
            <UsersIcon className="h-4 w-4 mr-2" />
            Bulk Actions
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 bg-[#2E86AB] text-white rounded-lg hover:bg-[#247297] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2E86AB]"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Invitation
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <EnvelopeIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Total Invitations</p>
                <p className="text-2xl font-bold text-slate-900">{statistics.total_invitations}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Pending</p>
                <p className="text-2xl font-bold text-slate-900">{statistics.pending_invitations}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Accepted</p>
                <p className="text-2xl font-bold text-slate-900">{statistics.accepted_invitations}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Expired</p>
                <p className="text-2xl font-bold text-slate-900">{statistics.expired_invitations}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by email, name, or organization..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB] focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilter(e.target.value as InvitationStatus | 'all')}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB] focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="sent">Sent</option>
              <option value="accepted">Accepted</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="sm:w-48">
            <select
              value={typeFilter}
              onChange={(e) => handleTypeFilter(e.target.value as InvitationType | 'all')}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB] focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="doctor">Doctor</option>
              <option value="sales">Sales Rep</option>
              <option value="distributor">Distributor</option>
              <option value="master_distributor">Master Distributor</option>
              <option value="office_admin">Office Admin</option>
              <option value="medical_staff">Medical Staff</option>
              <option value="ivr_company">IVR Company</option>
              <option value="shipping_logistics">Shipping & Logistics</option>
              <option value="admin">Admin</option>
              <option value="chp_admin">CHP Admin</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => loadInvitations(1, true)}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2E86AB] disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Invitations Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-medium text-slate-900">
            Invitations ({totalCount.toLocaleString()})
          </h3>
        </div>

        {error && (
          <div className="p-6 border-b border-slate-200">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading && filteredInvitations.length === 0 ? (
          <div className="p-12 text-center">
            <ArrowPathIcon className="h-8 w-8 text-slate-400 animate-spin mx-auto mb-4" />
            <p className="text-slate-500">Loading invitations...</p>
          </div>
        ) : filteredInvitations.length === 0 ? (
          <div className="p-12 text-center">
            <EnvelopeIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No invitations found</h3>
            <p className="text-slate-500 mb-6">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : 'Get started by creating your first invitation.'}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-[#2E86AB] text-white rounded-lg hover:bg-[#247297] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2E86AB]"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create First Invitation
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Invitee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Type & Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Expires
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Attempts
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredInvitations.map((invitation) => (
                  <tr key={invitation.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-slate-900">
                          {invitation.full_name || invitation.email}
                        </div>
                        {invitation.full_name && (
                          <div className="text-sm text-slate-500">{invitation.email}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <span className={getTypeBadge(invitation.invitation_type)}>
                          {invitation.invitation_type.replace('_', ' ')}
                        </span>
                        <div className="text-xs text-slate-500">{invitation.role_name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(invitation.status)}>
                        {invitation.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {format(new Date(invitation.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">
                        {format(new Date(invitation.expires_at), 'MMM d, yyyy')}
                      </div>
                      {invitation.is_expired && (
                        <div className="text-xs text-red-600">Expired</div>
                      )}
                      {!invitation.is_expired && invitation.days_until_expiry <= 3 && (
                        <div className="text-xs text-yellow-600">
                          {invitation.days_until_expiry} days left
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {invitation.email_attempts}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedInvitation(invitation);
                            setShowDetailModal(true);
                          }}
                          className="text-slate-400 hover:text-slate-600"
                          title="View Details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>

                        {(invitation.status === 'pending' || invitation.status === 'sent') && (
                          <button
                            onClick={() => handleResendInvitation(invitation)}
                            className="text-blue-400 hover:text-blue-600"
                            title="Resend Invitation"
                          >
                            <PaperAirplaneIcon className="h-4 w-4" />
                          </button>
                        )}

                        {(invitation.status === 'pending' || invitation.status === 'sent') && (
                          <button
                            onClick={() => handleExtendExpiry(invitation)}
                            className="text-green-400 hover:text-green-600"
                            title="Extend Expiry"
                          >
                            <CalendarDaysIcon className="h-4 w-4" />
                          </button>
                        )}

                        {(invitation.status === 'pending' || invitation.status === 'sent') && (
                          <button
                            onClick={() => handleCancelInvitation(invitation)}
                            className="text-red-400 hover:text-red-600"
                            title="Cancel Invitation"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Load More Button */}
        {hasMore && (
          <div className="px-6 py-4 border-t border-slate-200 text-center">
            <button
              onClick={() => loadInvitations(currentPage + 1)}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2E86AB] disabled:opacity-50"
            >
              {loading ? (
                <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ArrowPathIcon className="h-4 w-4 mr-2" />
              )}
              Load More ({totalCount - filteredInvitations.length} remaining)
            </button>
          </div>
        )}
      </div>

      {/* Bulk Operations Section */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-slate-900 mb-4">Bulk Operations</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleBulkExpireOld}
            className="inline-flex items-center px-4 py-2 border border-yellow-300 rounded-lg text-sm font-medium text-yellow-700 bg-yellow-50 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
          >
            <ClockIcon className="h-4 w-4 mr-2" />
            Expire Old Invitations
          </button>
          <button
            onClick={handleBulkCleanup}
            className="inline-flex items-center px-4 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            Cleanup Old Records
          </button>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          Use bulk operations to maintain invitation hygiene and clean up old records.
        </p>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <InvitationCreateModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            loadInvitations(1, true);
            loadStatistics();
          }}
        />
      )}

      {showDetailModal && selectedInvitation && (
        <InvitationDetailModal
          isOpen={showDetailModal}
          invitation={selectedInvitation}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedInvitation(null);
          }}
          onUpdate={() => {
            loadInvitations(1, true);
            loadStatistics();
          }}
        />
      )}

      {showAnalyticsDashboard && (
        <InvitationAnalyticsDashboard
          isOpen={showAnalyticsDashboard}
          onClose={() => setShowAnalyticsDashboard(false)}
        />
      )}

      {showBulkModal && (
        <BulkInvitationModal
          isOpen={showBulkModal}
          onClose={() => setShowBulkModal(false)}
          onSuccess={() => {
            loadInvitations(1, true);
            loadStatistics();
          }}
        />
      )}
    </div>
  );
};

export default AdminInvitationManagement;