import React, { useState } from 'react';
import {
  XMarkIcon,
  PaperAirplaneIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserIcon,
  EnvelopeIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface InvitationDetailModalProps {
  isOpen: boolean;
  invitation: any;
  onClose: () => void;
  onUpdate: () => void;
}

export const InvitationDetailModal: React.FC<InvitationDetailModalProps> = ({
  isOpen,
  invitation,
  onClose,
  onUpdate
}) => {
  const [loading, setLoading] = useState(false);
  const [extendDays, setExtendDays] = useState(7);

  if (!isOpen || !invitation) return null;

  const handleResend = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Invitation resent successfully');
      onUpdate();
    } catch (error) {
      toast.error('Failed to resend invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleExtend = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success(`Invitation expiry extended by ${extendDays} days`);
      onUpdate();
    } catch (error) {
      toast.error('Failed to extend invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this invitation?')) {
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Invitation cancelled successfully');
      onUpdate();
      onClose();
    } catch (error) {
      toast.error('Failed to cancel invitation');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-600" />;
      case 'sent':
        return <PaperAirplaneIcon className="h-5 w-5 text-blue-600" />;
      case 'accepted':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'expired':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />;
      case 'cancelled':
        return <XMarkIcon className="h-5 w-5 text-gray-600" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium';

    switch (status) {
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'sent':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'accepted':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'expired':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'cancelled':
        return `${baseClasses} bg-gray-100 text-gray-600`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getTypeBadge = (type: string) => {
    const baseClasses = 'inline-flex items-center px-2 py-1 rounded text-sm font-medium';

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

  const canResend = invitation.status === 'pending' || invitation.status === 'sent';
  const canExtend = invitation.status === 'pending' || invitation.status === 'sent';
  const canCancel = invitation.status === 'pending' || invitation.status === 'sent';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            {getStatusIcon(invitation.status)}
            <h3 className="text-lg font-semibold text-slate-900">Invitation Details</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status and Type */}
          <div className="flex items-center justify-between">
            <span className={getStatusBadge(invitation.status)}>
              {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
            </span>
            <span className={getTypeBadge(invitation.invitation_type)}>
              {invitation.invitation_type.replace('_', ' ')}
            </span>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <UserIcon className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-700">Invitee</p>
                  <p className="text-sm text-slate-900">
                    {invitation.full_name || 'No name provided'}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <EnvelopeIcon className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-700">Email</p>
                  <p className="text-sm text-slate-900">{invitation.email}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <BuildingOfficeIcon className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-700">Role</p>
                  <p className="text-sm text-slate-900">{invitation.role_name}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-700">Created</p>
                <p className="text-sm text-slate-900">
                  {format(new Date(invitation.created_at), 'MMM d, yyyy h:mm a')}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-700">Expires</p>
                <p className="text-sm text-slate-900">
                  {format(new Date(invitation.expires_at), 'MMM d, yyyy h:mm a')}
                </p>
                {invitation.is_expired && (
                  <p className="text-xs text-red-600 mt-1">This invitation has expired</p>
                )}
                {!invitation.is_expired && invitation.days_until_expiry <= 3 && (
                  <p className="text-xs text-yellow-600 mt-1">
                    Expires in {invitation.days_until_expiry} days
                  </p>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-slate-700">Email Attempts</p>
                <p className="text-sm text-slate-900">{invitation.email_attempts}</p>
              </div>
            </div>
          </div>

          {/* Custom Message */}
          {invitation.invitation_message && (
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Custom Message</p>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-sm text-slate-900">{invitation.invitation_message}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          {(canResend || canExtend || canCancel) && (
            <div className="border-t border-slate-200 pt-6">
              <h4 className="text-sm font-medium text-slate-700 mb-4">Actions</h4>

              <div className="space-y-4">
                {/* Resend */}
                {canResend && (
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-blue-900">Resend Invitation</p>
                      <p className="text-xs text-blue-700">Send the invitation email again</p>
                    </div>
                    <button
                      onClick={handleResend}
                      disabled={loading}
                      className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                      Resend
                    </button>
                  </div>
                )}

                {/* Extend */}
                {canExtend && (
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-900">Extend Expiry</p>
                      <p className="text-xs text-green-700">Add more time before expiration</p>
                      <div className="mt-2">
                        <select
                          value={extendDays}
                          onChange={(e) => setExtendDays(parseInt(e.target.value))}
                          className="text-xs border border-green-300 rounded px-2 py-1 bg-white"
                        >
                          <option value={1}>1 day</option>
                          <option value={3}>3 days</option>
                          <option value={7}>7 days</option>
                          <option value={14}>14 days</option>
                          <option value={30}>30 days</option>
                        </select>
                      </div>
                    </div>
                    <button
                      onClick={handleExtend}
                      disabled={loading}
                      className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                      <CalendarDaysIcon className="h-4 w-4 mr-2" />
                      Extend
                    </button>
                  </div>
                )}

                {/* Cancel */}
                {canCancel && (
                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-red-900">Cancel Invitation</p>
                      <p className="text-xs text-red-700">Permanently cancel this invitation</p>
                    </div>
                    <button
                      onClick={handleCancel}
                      disabled={loading}
                      className="inline-flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      <XMarkIcon className="h-4 w-4 mr-2" />
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2E86AB]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};