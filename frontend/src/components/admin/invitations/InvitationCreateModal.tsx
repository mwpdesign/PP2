import React, { useState } from 'react';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface InvitationCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const InvitationCreateModal: React.FC<InvitationCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    invitation_type: 'doctor',
    role_name: 'Healthcare Provider',
    organization_id: '',
    invitation_message: '',
    expires_in_days: 7
  });
  const [loading, setLoading] = useState(false);

  const invitationTypes = [
    { value: 'doctor', label: 'Doctor', role: 'Healthcare Provider' },
    { value: 'sales', label: 'Sales Representative', role: 'Sales Representative' },
    { value: 'distributor', label: 'Distributor', role: 'Distributor' },
    { value: 'master_distributor', label: 'Master Distributor', role: 'Master Distributor' },
    { value: 'office_admin', label: 'Office Administrator', role: 'Office Administrator' },
    { value: 'medical_staff', label: 'Medical Staff', role: 'Medical Staff' },
    { value: 'ivr_company', label: 'IVR Company', role: 'IVR Specialist' },
    { value: 'shipping_logistics', label: 'Shipping & Logistics', role: 'Logistics Coordinator' },
    { value: 'admin', label: 'Admin', role: 'System Administrator' },
    { value: 'chp_admin', label: 'CHP Admin', role: 'CHP Administrator' }
  ];

  const handleTypeChange = (type: string) => {
    const selectedType = invitationTypes.find(t => t.value === type);
    setFormData(prev => ({
      ...prev,
      invitation_type: type,
      role_name: selectedType?.role || ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success('Invitation created successfully');
      onSuccess();
      onClose();

      // Reset form
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        invitation_type: 'doctor',
        role_name: 'Healthcare Provider',
        organization_id: '',
        invitation_message: '',
        expires_in_days: 7
      });
    } catch (error) {
      toast.error('Failed to create invitation');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Create New Invitation</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              required
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB] focus:border-transparent"
              placeholder="user@example.com"
            />
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-slate-700 mb-2">
                First Name
              </label>
              <input
                type="text"
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB] focus:border-transparent"
                placeholder="John"
              />
            </div>
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-slate-700 mb-2">
                Last Name
              </label>
              <input
                type="text"
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB] focus:border-transparent"
                placeholder="Smith"
              />
            </div>
          </div>

          {/* Invitation Type */}
          <div>
            <label htmlFor="invitation_type" className="block text-sm font-medium text-slate-700 mb-2">
              User Type *
            </label>
            <select
              id="invitation_type"
              required
              value={formData.invitation_type}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB] focus:border-transparent"
            >
              {invitationTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Role Name */}
          <div>
            <label htmlFor="role_name" className="block text-sm font-medium text-slate-700 mb-2">
              Role Name *
            </label>
            <input
              type="text"
              id="role_name"
              required
              value={formData.role_name}
              onChange={(e) => setFormData(prev => ({ ...prev, role_name: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB] focus:border-transparent"
              placeholder="Healthcare Provider"
            />
          </div>

          {/* Organization ID */}
          <div>
            <label htmlFor="organization_id" className="block text-sm font-medium text-slate-700 mb-2">
              Organization ID
            </label>
            <input
              type="text"
              id="organization_id"
              value={formData.organization_id}
              onChange={(e) => setFormData(prev => ({ ...prev, organization_id: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB] focus:border-transparent"
              placeholder="Optional organization UUID"
            />
          </div>

          {/* Expiry Days */}
          <div>
            <label htmlFor="expires_in_days" className="block text-sm font-medium text-slate-700 mb-2">
              Expires In (Days)
            </label>
            <select
              id="expires_in_days"
              value={formData.expires_in_days}
              onChange={(e) => setFormData(prev => ({ ...prev, expires_in_days: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB] focus:border-transparent"
            >
              <option value={1}>1 Day</option>
              <option value={3}>3 Days</option>
              <option value={7}>7 Days</option>
              <option value={14}>14 Days</option>
              <option value={30}>30 Days</option>
            </select>
          </div>

          {/* Invitation Message */}
          <div>
            <label htmlFor="invitation_message" className="block text-sm font-medium text-slate-700 mb-2">
              Custom Message
            </label>
            <textarea
              id="invitation_message"
              rows={3}
              value={formData.invitation_message}
              onChange={(e) => setFormData(prev => ({ ...prev, invitation_message: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB] focus:border-transparent"
              placeholder="Optional custom message for the invitation email..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2E86AB]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-[#2E86AB] text-white rounded-lg hover:bg-[#247297] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2E86AB] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Invitation
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};