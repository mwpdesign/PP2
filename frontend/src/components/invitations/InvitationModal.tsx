// Invitation Modal Component for Healthcare IVR Platform
// Task ID: mbvu8p4nc9bidurxtvc
// Phase 4: Frontend Integration

import React, { useState, useEffect } from 'react';
import { X, Mail, User, Building, MessageSquare, Calendar, Users } from 'lucide-react';
import { invitationService } from '../../services/invitationService';
import {
  InvitationType,
  InvitationCreateRequest,
  DoctorInvitationRequest,
  SalesInvitationRequest,
  PracticeStaffInvitationRequest
} from '../../types/invitation';

interface InvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (error: string) => void;
  defaultType?: InvitationType;
  organizationId?: string;
}

interface FormData {
  email: string;
  invitation_type: InvitationType;
  first_name: string;
  last_name: string;
  organization_id: string;
  invitation_message: string;
  expires_in_days: number;
  staff_role?: 'office_admin' | 'medical_staff';
  parent_distributor_id?: string;
}

const INVITATION_TYPES: { value: InvitationType; label: string; description: string }[] = [
  { value: 'doctor', label: 'Doctor', description: 'Medical practitioner' },
  { value: 'sales', label: 'Sales Representative', description: 'Sales team member' },
  { value: 'distributor', label: 'Distributor', description: 'Product distributor' },
  { value: 'master_distributor', label: 'Master Distributor', description: 'Regional distributor' },
  { value: 'office_admin', label: 'Office Administrator', description: 'Practice office staff' },
  { value: 'medical_staff', label: 'Medical Staff', description: 'Clinical support staff' },
  { value: 'ivr_company', label: 'IVR Company', description: 'IVR service provider' },
  { value: 'shipping_logistics', label: 'Shipping & Logistics', description: 'Logistics partner' },
  { value: 'admin', label: 'Administrator', description: 'System administrator' },
  { value: 'chp_admin', label: 'CHP Administrator', description: 'CHP system admin' }
];

export const InvitationModal: React.FC<InvitationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onError,
  defaultType = 'doctor',
  organizationId = ''
}) => {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    invitation_type: defaultType,
    first_name: '',
    last_name: '',
    organization_id: organizationId,
    invitation_message: '',
    expires_in_days: 7,
    staff_role: undefined,
    parent_distributor_id: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setFormData({
        email: '',
        invitation_type: defaultType,
        first_name: '',
        last_name: '',
        organization_id: organizationId,
        invitation_message: '',
        expires_in_days: 7,
        staff_role: undefined,
        parent_distributor_id: ''
      });
      setErrors({});
    }
  }, [isOpen, defaultType, organizationId]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.invitation_type) {
      newErrors.invitation_type = 'Invitation type is required';
    }

    if (!formData.organization_id && formData.invitation_type !== 'admin' && formData.invitation_type !== 'chp_admin') {
      newErrors.organization_id = 'Organization is required';
    }

    if (formData.expires_in_days < 1 || formData.expires_in_days > 30) {
      newErrors.expires_in_days = 'Expiry must be between 1 and 30 days';
    }

    if ((formData.invitation_type === 'office_admin' || formData.invitation_type === 'medical_staff') && !formData.staff_role) {
      newErrors.staff_role = 'Staff role is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      let invitation;

      // Use specialized endpoints for specific invitation types
      if (formData.invitation_type === 'doctor') {
        const doctorData: DoctorInvitationRequest = {
          email: formData.email,
          organization_id: formData.organization_id,
          first_name: formData.first_name || undefined,
          last_name: formData.last_name || undefined,
          invitation_message: formData.invitation_message || undefined
        };
        invitation = await invitationService.createDoctorInvitation(doctorData);
      } else if (formData.invitation_type === 'sales') {
        const salesData: SalesInvitationRequest = {
          email: formData.email,
          organization_id: formData.organization_id,
          parent_distributor_id: formData.parent_distributor_id || undefined,
          first_name: formData.first_name || undefined,
          last_name: formData.last_name || undefined,
          invitation_message: formData.invitation_message || undefined
        };
        invitation = await invitationService.createSalesInvitation(salesData);
      } else if (formData.invitation_type === 'office_admin' || formData.invitation_type === 'medical_staff') {
        const staffData: PracticeStaffInvitationRequest = {
          email: formData.email,
          organization_id: formData.organization_id,
          staff_role: formData.staff_role!,
          first_name: formData.first_name || undefined,
          last_name: formData.last_name || undefined,
          invitation_message: formData.invitation_message || undefined
        };
        invitation = await invitationService.createPracticeStaffInvitation(staffData);
      } else {
        // Use general invitation endpoint
        const generalData: InvitationCreateRequest = {
          email: formData.email,
          invitation_type: formData.invitation_type,
          role_name: formData.invitation_type,
          organization_id: formData.organization_id || undefined,
          first_name: formData.first_name || undefined,
          last_name: formData.last_name || undefined,
          invitation_message: formData.invitation_message || undefined,
          expires_in_days: formData.expires_in_days,
          parent_distributor_id: formData.parent_distributor_id || undefined
        };
        invitation = await invitationService.createInvitation(generalData);
      }

      onSuccess(`Invitation sent to ${invitation.email} successfully!`);
      onClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to create invitation';
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Send Invitation</h2>
              <p className="text-sm text-gray-500">Invite a new user to join the platform</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="inline h-4 w-4 mr-1" />
              Email Address *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="user@example.com"
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>

          {/* Invitation Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="inline h-4 w-4 mr-1" />
              Invitation Type *
            </label>
            <select
              value={formData.invitation_type}
              onChange={(e) => handleInputChange('invitation_type', e.target.value as InvitationType)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.invitation_type ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              {INVITATION_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label} - {type.description}
                </option>
              ))}
            </select>
            {errors.invitation_type && <p className="mt-1 text-sm text-red-600">{errors.invitation_type}</p>}
          </div>

          {/* Staff Role (for office_admin and medical_staff) */}
          {(formData.invitation_type === 'office_admin' || formData.invitation_type === 'medical_staff') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Staff Role *
              </label>
              <select
                value={formData.staff_role || ''}
                onChange={(e) => handleInputChange('staff_role', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.staff_role ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select staff role</option>
                <option value="office_admin">Office Administrator</option>
                <option value="medical_staff">Medical Staff</option>
              </select>
              {errors.staff_role && <p className="mt-1 text-sm text-red-600">{errors.staff_role}</p>}
            </div>
          )}

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline h-4 w-4 mr-1" />
                First Name
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Doe"
              />
            </div>
          </div>

          {/* Organization ID */}
          {formData.invitation_type !== 'admin' && formData.invitation_type !== 'chp_admin' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building className="inline h-4 w-4 mr-1" />
                Organization ID *
              </label>
              <input
                type="text"
                value={formData.organization_id}
                onChange={(e) => handleInputChange('organization_id', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.organization_id ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Organization UUID"
              />
              {errors.organization_id && <p className="mt-1 text-sm text-red-600">{errors.organization_id}</p>}
            </div>
          )}

          {/* Parent Distributor (for sales) */}
          {formData.invitation_type === 'sales' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parent Distributor ID
              </label>
              <input
                type="text"
                value={formData.parent_distributor_id}
                onChange={(e) => handleInputChange('parent_distributor_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Distributor UUID (optional)"
              />
            </div>
          )}

          {/* Expiry Days */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              Expires in (days)
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={formData.expires_in_days}
              onChange={(e) => handleInputChange('expires_in_days', parseInt(e.target.value))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.expires_in_days ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.expires_in_days && <p className="mt-1 text-sm text-red-600">{errors.expires_in_days}</p>}
          </div>

          {/* Invitation Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MessageSquare className="inline h-4 w-4 mr-1" />
              Custom Message
            </label>
            <textarea
              value={formData.invitation_message}
              onChange={(e) => handleInputChange('invitation_message', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Optional welcome message for the invitee..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  <span>Send Invitation</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};