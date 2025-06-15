// Invitations Page for Healthcare IVR Platform
// Task ID: mbvu8p4nc9bidurxtvc
// Phase 4: Frontend Integration

import React, { useState } from 'react';
import { Plus, Mail, Users, TrendingUp, Clock } from 'lucide-react';
import { InvitationModal } from '../../components/invitations/InvitationModal';
import { InvitationList } from '../../components/invitations/InvitationList';
import { invitationService } from '../../services/invitationService';
import { InvitationStatistics } from '../../types/invitation';

interface NotificationState {
  type: 'success' | 'error';
  message: string;
}

export const InvitationsPage: React.FC = () => {
  const [showInvitationModal, setShowInvitationModal] = useState(false);
  const [notification, setNotification] = useState<NotificationState | null>(null);
  const [statistics, setStatistics] = useState<InvitationStatistics | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadStatistics = async () => {
    try {
      setStatsLoading(true);
      const stats = await invitationService.getInvitationStatistics();
      setStatistics(stats);
    } catch (error: any) {
      console.error('Failed to load statistics:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  React.useEffect(() => {
    loadStatistics();
  }, []);

  const handleInvitationUpdate = () => {
    loadStatistics();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Mail className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">User Invitations</h1>
                <p className="text-gray-600">Manage and track user invitations across the platform</p>
              </div>
            </div>
            <button
              onClick={() => setShowInvitationModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Send Invitation</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className={`p-4 rounded-lg ${
            notification.type === 'success'
              ? 'bg-green-100 border border-green-200 text-green-800'
              : 'bg-red-100 border border-red-200 text-red-800'
          }`}>
            <div className="flex items-center justify-between">
              <span>{notification.message}</span>
              <button
                onClick={() => setNotification(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      {statistics && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Invitations */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Mail className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Invitations</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.total_invitations}</p>
                </div>
              </div>
            </div>

            {/* Pending Invitations */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.pending_invitations}</p>
                </div>
              </div>
            </div>

            {/* Accepted Invitations */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Accepted</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.accepted_invitations}</p>
                </div>
              </div>
            </div>

            {/* Acceptance Rate */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Acceptance Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(statistics.acceptance_rate * 100)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invitation Types Breakdown */}
      {statistics && Object.keys(statistics.invitations_by_type).length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h3 className="text-lg font-medium text-gray-900">Invitations by Type</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {Object.entries(statistics.invitations_by_type).map(([type, count]) => (
                  <div key={type} className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{count}</div>
                    <div className="text-sm text-gray-600">
                      {invitationService.getInvitationTypeLabel(type)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invitations List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 pb-8">
        <InvitationList
          onInvitationUpdate={handleInvitationUpdate}
          onError={(error) => showNotification('error', error)}
          onSuccess={(message) => showNotification('success', message)}
        />
      </div>

      {/* Invitation Modal */}
      <InvitationModal
        isOpen={showInvitationModal}
        onClose={() => setShowInvitationModal(false)}
        onSuccess={(message) => {
          showNotification('success', message);
          handleInvitationUpdate();
        }}
        onError={(error) => showNotification('error', error)}
      />
    </div>
  );
};