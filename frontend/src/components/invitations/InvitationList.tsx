// Invitation List Component for Healthcare IVR Platform
// Task ID: mbvu8p4nc9bidurxtvc
// Phase 4: Frontend Integration

import React, { useState, useEffect } from 'react';
import {
  Mail,
  Search,
  Filter,
  MoreVertical,
  Send,
  RefreshCw,
  X,
  Calendar,
  User,
  Building,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { invitationService } from '../../services/invitationService';
import {
  Invitation,
  InvitationListParams,
  InvitationType,
  InvitationStatus
} from '../../types/invitation';

interface InvitationListProps {
  organizationId?: string;
  onInvitationUpdate?: () => void;
  onError: (error: string) => void;
  onSuccess: (message: string) => void;
}

interface FilterState {
  search: string;
  invitation_type: InvitationType | '';
  status: InvitationStatus | '';
  sort_by: string;
  sort_order: 'asc' | 'desc';
}

export const InvitationList: React.FC<InvitationListProps> = ({
  organizationId,
  onInvitationUpdate,
  onError,
  onSuccess
}) => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [showFilters, setShowFilters] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    invitation_type: '',
    status: '',
    sort_by: 'created_at',
    sort_order: 'desc'
  });

  const loadInvitations = async () => {
    try {
      setLoading(true);
      const params: InvitationListParams = {
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
        sort_by: filters.sort_by,
        sort_order: filters.sort_order
      };

      if (organizationId) params.organization_id = organizationId;
      if (filters.search) params.search = filters.search;
      if (filters.invitation_type) params.invitation_type = filters.invitation_type;
      if (filters.status) params.status = filters.status;

      const response = await invitationService.listInvitations(params);
      setInvitations(response.invitations);
      setTotalCount(response.total_count);
    } catch (error: any) {
      onError(error.response?.data?.detail || 'Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvitations();
  }, [currentPage, filters, organizationId]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleSendInvitation = async (invitationId: string) => {
    try {
      setActionLoading(invitationId);
      await invitationService.sendInvitation(invitationId);
      onSuccess('Invitation sent successfully');
      loadInvitations();
      onInvitationUpdate?.();
    } catch (error: any) {
      onError(error.response?.data?.detail || 'Failed to send invitation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      setActionLoading(invitationId);
      await invitationService.resendInvitation(invitationId);
      onSuccess('Invitation resent successfully');
      loadInvitations();
      onInvitationUpdate?.();
    } catch (error: any) {
      onError(error.response?.data?.detail || 'Failed to resend invitation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) {
      return;
    }

    try {
      setActionLoading(invitationId);
      await invitationService.cancelInvitation(invitationId);
      onSuccess('Invitation cancelled successfully');
      loadInvitations();
      onInvitationUpdate?.();
    } catch (error: any) {
      onError(error.response?.data?.detail || 'Failed to cancel invitation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleExtendExpiry = async (invitationId: string) => {
    try {
      setActionLoading(invitationId);
      await invitationService.extendInvitationExpiry(invitationId, 7);
      onSuccess('Invitation expiry extended by 7 days');
      loadInvitations();
      onInvitationUpdate?.();
    } catch (error: any) {
      onError(error.response?.data?.detail || 'Failed to extend invitation');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusIcon = (status: InvitationStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'sent':
        return <Mail className="h-4 w-4 text-blue-500" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'expired':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <X className="h-4 w-4 text-gray-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Invitations</h2>
            <p className="text-sm text-gray-500 mt-1">
              {totalCount} total invitations
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-3 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </button>
            <button
              onClick={loadInvitations}
              disabled={loading}
              className="flex items-center space-x-2 px-3 py-2 text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="Search by email or name..."
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={filters.invitation_type}
                  onChange={(e) => handleFilterChange('invitation_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="doctor">Doctor</option>
                  <option value="sales">Sales Rep</option>
                  <option value="distributor">Distributor</option>
                  <option value="master_distributor">Master Distributor</option>
                  <option value="office_admin">Office Admin</option>
                  <option value="medical_staff">Medical Staff</option>
                  <option value="ivr_company">IVR Company</option>
                  <option value="shipping_logistics">Shipping</option>
                  <option value="admin">Admin</option>
                  <option value="chp_admin">CHP Admin</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="sent">Sent</option>
                  <option value="accepted">Accepted</option>
                  <option value="expired">Expired</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort By
                </label>
                <select
                  value={`${filters.sort_by}-${filters.sort_order}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split('-');
                    handleFilterChange('sort_by', sortBy);
                    handleFilterChange('sort_order', sortOrder);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="created_at-desc">Newest First</option>
                  <option value="created_at-asc">Oldest First</option>
                  <option value="email-asc">Email A-Z</option>
                  <option value="email-desc">Email Z-A</option>
                  <option value="expires_at-asc">Expiring Soon</option>
                  <option value="status-asc">Status A-Z</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading invitations...</span>
          </div>
        ) : invitations.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No invitations found</h3>
            <p className="text-gray-500">
              {Object.values(filters).some(v => v)
                ? 'Try adjusting your filters to see more results.'
                : 'Start by creating your first invitation.'
              }
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invitee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expires
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attempts
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invitations.map((invitation) => (
                <tr key={invitation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-500" />
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {invitation.full_name || 'No name provided'}
                        </div>
                        <div className="text-sm text-gray-500">{invitation.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {invitationService.getInvitationTypeLabel(invitation.invitation_type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(invitation.status)}
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${invitationService.getStatusColor(invitation.status)}`}>
                        {invitationService.getStatusLabel(invitation.status)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invitation.sent_at
                      ? new Date(invitation.sent_at).toLocaleDateString()
                      : 'Not sent'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className={invitation.is_expired ? 'text-red-600' : ''}>
                      {invitationService.formatExpiryDate(invitation.expires_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invitation.email_attempts}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {invitation.status === 'pending' && (
                        <button
                          onClick={() => handleSendInvitation(invitation.id)}
                          disabled={actionLoading === invitation.id}
                          className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                          title="Send invitation"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      )}

                      {(invitation.status === 'sent' || invitation.status === 'failed') && (
                        <button
                          onClick={() => handleResendInvitation(invitation.id)}
                          disabled={actionLoading === invitation.id}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          title="Resend invitation"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                      )}

                      {invitation.is_expired && invitation.status !== 'accepted' && (
                        <button
                          onClick={() => handleExtendExpiry(invitation.id)}
                          disabled={actionLoading === invitation.id}
                          className="text-purple-600 hover:text-purple-900 disabled:opacity-50"
                          title="Extend expiry"
                        >
                          <Calendar className="h-4 w-4" />
                        </button>
                      )}

                      {(invitation.status === 'pending' || invitation.status === 'sent') && (
                        <button
                          onClick={() => handleCancelInvitation(invitation.id)}
                          disabled={actionLoading === invitation.id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          title="Cancel invitation"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}

                      {actionLoading === invitation.id && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-3 border-t bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} results
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};