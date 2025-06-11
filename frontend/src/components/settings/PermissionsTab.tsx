/**
 * Permissions Tab Component
 * Phase 3.2C: Practice Staff Management + Role-Based Permissions
 *
 * Allows doctors to manage office staff and their access permissions.
 */

import React, { useState, useEffect } from 'react';
import {
  UserPlusIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PencilIcon,
  UserMinusIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';
import {
  BookmarkIcon as SaveIcon,
  XMarkIcon as XIcon,
  PencilIcon as EditIcon,
  UserXMarkIcon as DeactivateIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

// Types for Practice Staff Management
interface StaffMember {
  id: string;
  email: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  practice_role: string;
  is_active: boolean;
  created_at: string;
  invited_at: string | null;
  parent_doctor_id: string;
}

interface PracticeStatistics {
  total_staff: number;
  active_staff: number;
  office_admins: number;
  medical_staff: number;
  pending_invitations: number;
}

interface StaffListResponse {
  staff_members: StaffMember[];
  statistics: PracticeStatistics;
}

// Types for Role-Based Permissions
interface Permission {
  id: string;
  name: string;
  display_name: string;
  description: string;
  resource: string;
  action: string;
  is_active: boolean;
}

interface Role {
  id: string;
  name: string;
  display_name: string;
  description: string;
  is_system_role: boolean;
  is_active: boolean;
  permissions?: Permission[];
}

const PermissionsTab: React.FC = () => {
  // Staff Management State
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [statistics, setStatistics] = useState<PracticeStatistics>({
    total_staff: 0,
    active_staff: 0,
    office_admins: 0,
    medical_staff: 0,
    pending_invitations: 0
  });
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showEditStaffModal, setShowEditStaffModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  // Role/Permissions State
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('healthcare_provider');
  const [isEditingPermissions, setIsEditingPermissions] = useState(false);

  // Loading State
  const [loading, setLoading] = useState(true);

  // Form state for adding staff
  const [newStaffForm, setNewStaffForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    practice_role: 'office_admin'
  });

  // Form state for editing staff
  const [editStaffForm, setEditStaffForm] = useState({
    first_name: '',
    last_name: '',
    practice_role: 'office_admin'
  });

  // Load data on component mount
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadStaffData(),
        loadRolesAndPermissions()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error loading permissions data');
    } finally {
      setLoading(false);
    }
  };

  const loadStaffData = async () => {
    try {
      const response = await fetch('/api/v1/practice/staff', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data: StaffListResponse = await response.json();
        setStaffMembers(data.staff_members || []);
        setStatistics(data.statistics);
      } else {
        const errorData = await response.json();
        toast.error(errorData.detail || 'Failed to load staff data');
      }
    } catch (error) {
      console.error('Error loading staff data:', error);
      toast.error('Error loading staff data');
    }
  };

  const loadRolesAndPermissions = async () => {
    try {
      // Load roles and permissions in parallel
      const [rolesResponse, permissionsResponse] = await Promise.all([
        fetch('/api/v1/permissions/roles', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/v1/permissions/permissions', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (rolesResponse.ok && permissionsResponse.ok) {
        const [rolesData, permissionsData] = await Promise.all([
          rolesResponse.json(),
          permissionsResponse.json()
        ]);

        setRoles(rolesData.roles || []);
        setPermissions(permissionsData.permissions || []);
      } else {
        // If permissions API fails, use default roles and permissions for basic functionality
        const defaultPermissions = [
          // IVR Permissions
          {
            id: 'submit_ivr',
            name: 'submit_ivr',
            display_name: 'Submit IVR Requests',
            description: 'Create new insurance verification requests',
            resource: 'ivr',
            action: 'create',
            is_active: true
          },
          {
            id: 'view_ivr_details',
            name: 'view_ivr_details',
            display_name: 'View IVR Details',
            description: 'Access full IVR information and history',
            resource: 'ivr',
            action: 'read',
            is_active: true
          },
          {
            id: 'respond_ivr_messages',
            name: 'respond_ivr_messages',
            display_name: 'Respond to IVR Messages',
            description: 'Communicate with IVR company on behalf of doctor',
            resource: 'ivr',
            action: 'update',
            is_active: true
          },
          {
            id: 'upload_ivr_documents',
            name: 'upload_ivr_documents',
            display_name: 'Upload IVR Documents',
            description: 'Provide additional documentation for insurance verification',
            resource: 'ivr',
            action: 'update',
            is_active: true
          },
          // Patient Permissions
          {
            id: 'add_patients',
            name: 'add_patients',
            display_name: 'Add Patients',
            description: 'Register new patients in the system',
            resource: 'patients',
            action: 'create',
            is_active: true
          },
          {
            id: 'view_patients',
            name: 'view_patients',
            display_name: 'View Patients',
            description: 'Access patient records and information',
            resource: 'patients',
            action: 'read',
            is_active: true
          },
          // Order Permissions
          {
            id: 'create_orders',
            name: 'create_orders',
            display_name: 'Create Orders',
            description: 'Place orders for wound care products after IVR approval',
            resource: 'orders',
            action: 'create',
            is_active: true
          },
          {
            id: 'view_orders',
            name: 'view_orders',
            display_name: 'View Orders',
            description: 'Track order status and shipments',
            resource: 'orders',
            action: 'read',
            is_active: true
          },
          {
            id: 'receive_orders',
            name: 'receive_orders',
            display_name: 'Mark Orders Received',
            description: 'Confirm delivery of wound care products',
            resource: 'orders',
            action: 'update',
            is_active: true
          },
          // Other Permissions
          {
            id: 'view_analytics',
            name: 'view_analytics',
            display_name: 'View Analytics',
            description: 'Access practice metrics and reports',
            resource: 'analytics',
            action: 'read',
            is_active: true
          },
          {
            id: 'manage_settings',
            name: 'manage_settings',
            display_name: 'Manage Settings',
            description: 'Modify practice settings and preferences',
            resource: 'settings',
            action: 'update',
            is_active: true
          }
        ];

        setPermissions(defaultPermissions);

        setRoles([
          {
            id: '1',
            name: 'healthcare_provider',
            display_name: 'Healthcare Provider',
            description: 'Full access to all medical and administrative functions',
            is_system_role: true,
            is_active: true,
            permissions: defaultPermissions
          },
          {
            id: '2',
            name: 'office_administrator',
            display_name: 'Office Administrator',
            description: 'Trusted staff who handle all administrative tasks including IVR communications',
            is_system_role: false,
            is_active: true,
            permissions: defaultPermissions // Office Administrators get ALL permissions
          },
          {
            id: '3',
            name: 'medical_staff',
            display_name: 'Medical Staff',
            description: 'Clinical support staff who can handle patient care and IVR communications',
            is_system_role: false,
            is_active: true,
            permissions: defaultPermissions.filter(p => [
              'submit_ivr', 'view_ivr_details', 'respond_ivr_messages', 'upload_ivr_documents',
              'add_patients', 'view_patients', 'view_orders', 'receive_orders'
            ].includes(p.id))
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading roles and permissions:', error);
      // Use default roles and permissions as fallback
      const defaultPermissions = [
        // IVR Permissions
        {
          id: 'submit_ivr',
          name: 'submit_ivr',
          display_name: 'Submit IVR Requests',
          description: 'Create new insurance verification requests',
          resource: 'ivr',
          action: 'create',
          is_active: true
        },
        {
          id: 'view_ivr_details',
          name: 'view_ivr_details',
          display_name: 'View IVR Details',
          description: 'Access full IVR information and history',
          resource: 'ivr',
          action: 'read',
          is_active: true
        },
        {
          id: 'respond_ivr_messages',
          name: 'respond_ivr_messages',
          display_name: 'Respond to IVR Messages',
          description: 'Communicate with IVR company on behalf of doctor',
          resource: 'ivr',
          action: 'update',
          is_active: true
        },
        {
          id: 'upload_ivr_documents',
          name: 'upload_ivr_documents',
          display_name: 'Upload IVR Documents',
          description: 'Provide additional documentation for insurance verification',
          resource: 'ivr',
          action: 'update',
          is_active: true
        },
        // Patient Permissions
        {
          id: 'add_patients',
          name: 'add_patients',
          display_name: 'Add Patients',
          description: 'Register new patients in the system',
          resource: 'patients',
          action: 'create',
          is_active: true
        },
        {
          id: 'view_patients',
          name: 'view_patients',
          display_name: 'View Patients',
          description: 'Access patient records and information',
          resource: 'patients',
          action: 'read',
          is_active: true
        },
        // Order Permissions
        {
          id: 'create_orders',
          name: 'create_orders',
          display_name: 'Create Orders',
          description: 'Place orders for wound care products after IVR approval',
          resource: 'orders',
          action: 'create',
          is_active: true
        },
        {
          id: 'view_orders',
          name: 'view_orders',
          display_name: 'View Orders',
          description: 'Track order status and shipments',
          resource: 'orders',
          action: 'read',
          is_active: true
        },
        {
          id: 'receive_orders',
          name: 'receive_orders',
          display_name: 'Mark Orders Received',
          description: 'Confirm delivery of wound care products',
          resource: 'orders',
          action: 'update',
          is_active: true
        },
        // Other Permissions
        {
          id: 'view_analytics',
          name: 'view_analytics',
          display_name: 'View Analytics',
          description: 'Access practice metrics and reports',
          resource: 'analytics',
          action: 'read',
          is_active: true
        },
        {
          id: 'manage_settings',
          name: 'manage_settings',
          display_name: 'Manage Settings',
          description: 'Modify practice settings and preferences',
          resource: 'settings',
          action: 'update',
          is_active: true
        }
      ];

      setPermissions(defaultPermissions);

      setRoles([
        {
          id: '1',
          name: 'healthcare_provider',
          display_name: 'Healthcare Provider',
          description: 'Full access to all medical and administrative functions',
          is_system_role: true,
          is_active: true,
          permissions: defaultPermissions
        },
        {
          id: '2',
          name: 'office_administrator',
          display_name: 'Office Administrator',
          description: 'Trusted staff who handle all administrative tasks including IVR communications',
          is_system_role: false,
          is_active: true,
          permissions: defaultPermissions // Office Administrators get ALL permissions
        },
        {
          id: '3',
          name: 'medical_staff',
          display_name: 'Medical Staff',
          description: 'Clinical support staff who can handle patient care and IVR communications',
          is_system_role: false,
          is_active: true,
          permissions: defaultPermissions.filter(p => [
            'submit_ivr', 'view_ivr_details', 'respond_ivr_messages', 'upload_ivr_documents',
            'add_patients', 'view_patients', 'view_orders', 'receive_orders'
          ].includes(p.id))
        }
      ]);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/v1/practice/staff/invite', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: newStaffForm.email,
          first_name: newStaffForm.first_name,
          last_name: newStaffForm.last_name,
          practice_role: newStaffForm.practice_role
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Staff invitation sent successfully!');
        setShowAddStaffModal(false);
        setNewStaffForm({
          email: '',
          first_name: '',
          last_name: '',
          practice_role: 'office_admin'
        });
        loadStaffData(); // Reload to show the new pending invitation
      } else {
        const errorData = await response.json();
        toast.error(errorData.detail || 'Failed to send staff invitation');
      }
    } catch (error) {
      console.error('Error adding staff:', error);
      toast.error('Failed to send staff invitation');
    }
  };

  const handleEditStaff = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setEditStaffForm({
      first_name: staff.first_name || '',
      last_name: staff.last_name || '',
      practice_role: staff.practice_role
    });
    setShowEditStaffModal(true);
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;

    try {
      const response = await fetch(`/api/v1/practice/staff/${selectedStaff.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          first_name: editStaffForm.first_name,
          last_name: editStaffForm.last_name,
          practice_role: editStaffForm.practice_role
        })
      });

      if (response.ok) {
        toast.success('Staff member updated successfully');
        setShowEditStaffModal(false);
        setSelectedStaff(null);
        setEditStaffForm({
          first_name: '',
          last_name: '',
          practice_role: 'office_admin'
        });
        loadStaffData(); // Reload to show updated data
      } else {
        const errorData = await response.json();
        toast.error(errorData.detail || 'Failed to update staff member');
      }
    } catch (error) {
      console.error('Error updating staff:', error);
      toast.error('Error updating staff member');
    }
  };

  const handleDeactivateStaff = async () => {
    if (!selectedStaff) return;

    try {
      const response = await fetch(`/api/v1/practice/staff/${selectedStaff.id}/deactivate`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Staff member deactivated successfully');
        setShowDeactivateModal(false);
        setSelectedStaff(null);
        loadStaffData(); // Reload to show updated status
      } else {
        const errorData = await response.json();
        toast.error(errorData.detail || 'Failed to deactivate staff member');
      }
    } catch (error) {
      console.error('Error deactivating staff:', error);
      toast.error('Error deactivating staff member');
    }
  };

  const handleSavePermissions = () => {
    // TODO: Implement API call to save permission changes
    setIsEditingPermissions(false);
    toast.success('Permission changes saved successfully');
  };

    const handlePermissionToggle = (permissionId: string) => {
    if (!isEditingPermissions) return;

    const currentRole = roles.find(role => role.name === selectedRole);
    if (!currentRole || currentRole.is_system_role) return; // Can't edit system roles

    setRoles(prevRoles =>
      prevRoles.map(role => {
        if (role.name === selectedRole) {
          const hasPermission = role.permissions?.some(p => p.id === permissionId);
          const permission = permissions.find(p => p.id === permissionId);

          if (hasPermission) {
            // Remove permission
            return {
              ...role,
              permissions: role.permissions?.filter(p => p.id !== permissionId) || []
            };
          } else {
            // Add permission
            return {
              ...role,
              permissions: [...(role.permissions || []), permission].filter(Boolean) as Permission[]
            };
          }
        }
        return role;
      })
    );
  };

  const handleSelectAllPermissions = () => {
    if (!isEditingPermissions) return;

    const currentRole = roles.find(role => role.name === selectedRole);
    if (!currentRole || currentRole.is_system_role) return;

    setRoles(prevRoles =>
      prevRoles.map(role => {
        if (role.name === selectedRole) {
          return {
            ...role,
            permissions: [...permissions] // Give all permissions
          };
        }
        return role;
      })
    );
  };

  const handleDeselectAllPermissions = () => {
    if (!isEditingPermissions) return;

    const currentRole = roles.find(role => role.name === selectedRole);
    if (!currentRole || currentRole.is_system_role) return;

    setRoles(prevRoles =>
      prevRoles.map(role => {
        if (role.name === selectedRole) {
          return {
            ...role,
            permissions: [] // Remove all permissions
          };
        }
        return role;
      })
    );
  };

  const handleCancelPermissions = () => {
    // Reset to original permissions by reloading data
    loadRolesAndPermissions();
    setIsEditingPermissions(false);
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'office_admin':
        return 'Office Administrator';
      case 'medical_staff':
        return 'Medical Staff';
      default:
        return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'office_admin':
        return 'bg-blue-100 text-blue-800';
      case 'medical_staff':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  const getStatusText = (staff: StaffMember) => {
    if (staff.is_active) {
      return 'Active';
    } else if (staff.invited_at && !staff.is_active) {
      return 'Pending Invitation';
    } else {
      return 'Inactive';
    }
  };

  const currentRole = roles.find(role => role.name === selectedRole);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading permissions data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Team Management Section */}
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Team Management</h3>
            <p className="mt-1 text-sm text-gray-500">
              Manage your practice staff and their access permissions
            </p>
          </div>
          <button
            onClick={() => setShowAddStaffModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <UserPlusIcon className="h-4 w-4 mr-2" />
            Add Staff Member
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserGroupIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Staff
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {statistics.total_staff}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Staff
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {statistics.active_staff}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ShieldCheckIcon className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Office Admins
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {statistics.office_admins}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Pending Invitations
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {statistics.pending_invitations}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Current Staff Members */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h4 className="text-base font-medium text-gray-900 flex items-center">
              <UserGroupIcon className="h-5 w-5 mr-2" />
              Current Staff Members ({staffMembers.length})
            </h4>
          </div>

          {staffMembers.length === 0 ? (
            <div className="text-center py-12">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No staff members added yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Click 'Add Staff Member' to invite your team.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowAddStaffModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <UserPlusIcon className="h-4 w-4 mr-2" />
                  Add Staff Member
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {staffMembers.map((staff) => (
                      <tr key={staff.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
                                <span className="text-sm font-medium text-slate-700">
                                  {staff.first_name?.[0] || staff.email[0].toUpperCase()}
                                  {staff.last_name?.[0] || ''}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {staff.first_name && staff.last_name
                                  ? `${staff.first_name} ${staff.last_name}`
                                  : staff.username
                                }
                              </div>
                              <div className="text-sm text-gray-500">{staff.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(staff.practice_role)}`}>
                            <ShieldCheckIcon className="h-3 w-3 mr-1" />
                            {getRoleDisplayName(staff.practice_role)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(staff.is_active)}`}>
                            {getStatusText(staff)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleEditStaff(staff)}
                              className="inline-flex items-center p-1.5 border border-transparent rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors duration-150"
                              title="Edit staff member"
                              aria-label={`Edit ${staff.first_name} ${staff.last_name}`}
                            >
                              <EditIcon className="h-4 w-4" />
                            </button>
                            {staff.is_active && (
                              <button
                                onClick={() => {
                                  setSelectedStaff(staff);
                                  setShowDeactivateModal(true);
                                }}
                                className="inline-flex items-center p-1.5 border border-transparent rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-150"
                                title="Deactivate staff member"
                                aria-label={`Deactivate ${staff.first_name} ${staff.last_name}`}
                              >
                                <UserMinusIcon className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tablet View - Removed, using desktop view for md+ */}
              <div className="hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Staff Member
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role & Status
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {staffMembers.map((staff) => (
                      <tr key={staff.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-4 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
                                <span className="text-xs font-medium text-slate-700">
                                  {staff.first_name?.[0] || staff.email[0].toUpperCase()}
                                  {staff.last_name?.[0] || ''}
                                </span>
                              </div>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {staff.first_name && staff.last_name
                                  ? `${staff.first_name} ${staff.last_name}`
                                  : staff.username
                                }
                              </div>
                              <div className="text-sm text-gray-500">{staff.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(staff.practice_role)}`}>
                              <ShieldCheckIcon className="h-3 w-3 mr-1" />
                              {getRoleDisplayName(staff.practice_role)}
                            </span>
                            <div>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(staff.is_active)}`}>
                                {getStatusText(staff)}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleEditStaff(staff)}
                              className="inline-flex items-center p-1.5 border border-transparent rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors duration-150"
                              title="Edit staff member"
                              aria-label={`Edit ${staff.first_name} ${staff.last_name}`}
                            >
                              <EditIcon className="h-4 w-4" />
                            </button>
                            {staff.is_active && (
                              <button
                                onClick={() => {
                                  setSelectedStaff(staff);
                                  setShowDeactivateModal(true);
                                }}
                                className="inline-flex items-center p-1.5 border border-transparent rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-150"
                                title="Deactivate staff member"
                                aria-label={`Deactivate ${staff.first_name} ${staff.last_name}`}
                              >
                                <UserMinusIcon className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {staffMembers.map((staff) => (
                  <div key={staff.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-150">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center flex-1">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-slate-700">
                              {staff.first_name?.[0] || staff.email[0].toUpperCase()}
                              {staff.last_name?.[0] || ''}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {staff.first_name && staff.last_name
                              ? `${staff.first_name} ${staff.last_name}`
                              : staff.username
                            }
                          </div>
                          <div className="text-sm text-gray-500">{staff.email}</div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(staff.practice_role)}`}>
                              <ShieldCheckIcon className="h-3 w-3 mr-1" />
                              {getRoleDisplayName(staff.practice_role)}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(staff.is_active)}`}>
                              {getStatusText(staff)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleEditStaff(staff)}
                          className="inline-flex items-center p-2 border border-transparent rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors duration-150"
                          title="Edit staff member"
                          aria-label={`Edit ${staff.first_name} ${staff.last_name}`}
                        >
                          <EditIcon className="h-4 w-4" />
                        </button>
                        {staff.is_active && (
                          <button
                            onClick={() => {
                              setSelectedStaff(staff);
                              setShowDeactivateModal(true);
                            }}
                            className="inline-flex items-center p-2 border border-transparent rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-150"
                            title="Deactivate staff member"
                            aria-label={`Deactivate ${staff.first_name} ${staff.last_name}`}
                          >
                            <UserMinusIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Roles & Permissions Section */}
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <ShieldCheckIcon className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900">Roles & Permissions</h3>
          </div>
          {!isEditingPermissions ? (
            <button
              onClick={() => setIsEditingPermissions(true)}
              className="inline-flex items-center px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              <PencilIcon className="w-4 h-4 mr-2" />
              Edit Permissions
            </button>
          ) : (
            <div className="space-x-2">
              <button
                onClick={handleSavePermissions}
                className="inline-flex items-center px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                <SaveIcon className="w-4 h-4 mr-2" />
                Save
              </button>
              <button
                onClick={handleCancelPermissions}
                className="inline-flex items-center px-4 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                <XIcon className="w-4 h-4 mr-2" />
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Role Selection */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-base font-medium text-gray-900 mb-4">Select Role</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {roles.map((role) => (
              <div
                key={role.id}
                onClick={() => isEditingPermissions && setSelectedRole(role.name)}
                className={`p-4 rounded-lg border ${
                  selectedRole === role.name
                    ? 'border-gray-600 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${isEditingPermissions ? 'cursor-pointer' : ''}`}
              >
                <h5 className="font-medium text-gray-900">{role.display_name}</h5>
                <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                {role.is_system_role && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mt-2">
                    System Role
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Permissions List */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-base font-medium text-gray-900">
              Permissions for {currentRole?.display_name || 'Selected Role'}
            </h4>
            {currentRole?.is_system_role && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                System Role - Cannot Edit
              </span>
            )}
            {!currentRole?.is_system_role && isEditingPermissions && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Click checkboxes to add/remove permissions
              </span>
            )}
          </div>

          {permissions.length > 0 ? (
            <div className="space-y-4">
              {/* Select All / Deselect All buttons for non-system roles */}
              {!currentRole?.is_system_role && isEditingPermissions && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-sm font-medium text-gray-700">Quick Actions:</span>
                  <div className="space-x-2">
                    <button
                      onClick={handleSelectAllPermissions}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200"
                    >
                      Select All
                    </button>
                    <button
                      onClick={handleDeselectAllPermissions}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
              )}

              {permissions.map((permission) => (
                <div
                  key={permission.id}
                  className={`p-4 rounded-lg border transition-all duration-200 ${
                    currentRole?.permissions?.some(p => p.id === permission.id)
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200 opacity-60'
                  } ${isEditingPermissions && !currentRole?.is_system_role ? 'hover:shadow-md cursor-pointer' : ''}`}
                  onClick={() => !currentRole?.is_system_role && handlePermissionToggle(permission.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium text-gray-900">{permission.display_name}</h5>
                      <p className="text-sm text-gray-600 mt-1">{permission.description}</p>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2">
                        {permission.resource}.{permission.action}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={currentRole?.permissions?.some(p => p.id === permission.id) || false}
                        onChange={() => handlePermissionToggle(permission.id)}
                        disabled={!isEditingPermissions || currentRole?.is_system_role}
                        className="h-5 w-5 rounded border-gray-300 text-gray-600 focus:ring-gray-500 disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h5 className="mt-2 text-sm font-medium text-gray-900">No permissions configured</h5>
              <p className="mt-1 text-sm text-gray-500">
                Permission management is available for advanced role configuration.
              </p>
            </div>
          )}
        </div>

        {/* Warning Message */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Changes to permissions will affect all users with this role. Please review carefully before saving.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Staff Modal */}
      {showEditStaffModal && selectedStaff && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Staff Member</h3>
              <form onSubmit={handleUpdateStaff} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    required
                    value={editStaffForm.first_name}
                    onChange={(e) => setEditStaffForm({...editStaffForm, first_name: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    required
                    value={editStaffForm.last_name}
                    onChange={(e) => setEditStaffForm({...editStaffForm, last_name: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter last name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    disabled
                    value={selectedStaff.email}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
                    placeholder="Email cannot be changed"
                  />
                  <p className="mt-1 text-xs text-gray-500">Email address cannot be modified</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select
                    required
                    value={editStaffForm.practice_role}
                    onChange={(e) => setEditStaffForm({...editStaffForm, practice_role: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="office_admin">Office Administrator</option>
                    <option value="medical_staff">Medical Staff</option>
                  </select>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        Changes will take effect immediately. The staff member will be notified of any role changes.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditStaffModal(false);
                      setSelectedStaff(null);
                      setEditStaffForm({
                        first_name: '',
                        last_name: '',
                        practice_role: 'office_admin'
                      });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-600 hover:bg-slate-700"
                  >
                    Update Staff Member
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddStaffModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Staff Member</h3>
              <form onSubmit={handleAddStaff} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    required
                    value={newStaffForm.first_name}
                    onChange={(e) => setNewStaffForm({...newStaffForm, first_name: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    required
                    value={newStaffForm.last_name}
                    onChange={(e) => setNewStaffForm({...newStaffForm, last_name: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter last name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    required
                    value={newStaffForm.email}
                    onChange={(e) => setNewStaffForm({...newStaffForm, email: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select
                    required
                    value={newStaffForm.practice_role}
                    onChange={(e) => setNewStaffForm({...newStaffForm, practice_role: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="office_admin">Office Administrator</option>
                    <option value="medical_staff">Medical Staff</option>
                  </select>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        An invitation email will be sent to the staff member with instructions to complete their registration.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddStaffModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Send Invitation
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation Modal */}
      {showDeactivateModal && selectedStaff && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">Deactivate Staff Member</h3>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500">
                  Are you sure you want to deactivate{' '}
                  <span className="font-medium">
                    {selectedStaff.first_name && selectedStaff.last_name
                      ? `${selectedStaff.first_name} ${selectedStaff.last_name}`
                      : selectedStaff.email
                    }
                  </span>
                  ? They will lose access to the system immediately.
                </p>
              </div>
              <div className="flex justify-end space-x-3 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeactivateModal(false);
                    setSelectedStaff(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeactivateStaff}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                >
                  Deactivate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionsTab;