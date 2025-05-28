import React, { useState } from 'react';
import { Shield, Save, X } from 'lucide-react';

interface Permission {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

const PermissionsSection: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('provider');
  
  const [roles] = useState<Role[]>([
    {
      id: 'provider',
      name: 'Healthcare Provider',
      description: 'Full access to patient records and ordering capabilities',
      permissions: ['order_create', 'patient_view', 'patient_edit', 'analytics_view']
    },
    {
      id: 'office_admin',
      name: 'Office Administrator',
      description: 'Manage office settings and basic patient information',
      permissions: ['order_view', 'patient_view', 'settings_edit']
    },
    {
      id: 'staff',
      name: 'Medical Staff',
      description: 'View patient records and assist with orders',
      permissions: ['order_view', 'patient_view']
    }
  ]);

  const [permissions] = useState<Permission[]>([
    {
      id: 'order_create',
      name: 'Create Orders',
      description: 'Create and submit new medical supply orders',
      enabled: true
    },
    {
      id: 'order_view',
      name: 'View Orders',
      description: 'View existing orders and their status',
      enabled: true
    },
    {
      id: 'patient_view',
      name: 'View Patient Records',
      description: 'Access and view patient information',
      enabled: true
    },
    {
      id: 'patient_edit',
      name: 'Edit Patient Records',
      description: 'Modify patient information and medical history',
      enabled: true
    },
    {
      id: 'analytics_view',
      name: 'View Analytics',
      description: 'Access usage and ordering analytics',
      enabled: true
    },
    {
      id: 'settings_edit',
      name: 'Edit Settings',
      description: 'Modify account and facility settings',
      enabled: true
    }
  ]);

  const handleSave = () => {
    // TODO: Implement save functionality
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const currentRole = roles.find(role => role.id === selectedRole);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-slate-600" />
          <h2 className="text-xl font-semibold text-slate-800">Roles & Permissions</h2>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 text-sm bg-slate-600 text-white rounded-md hover:bg-slate-700"
          >
            Edit Permissions
          </button>
        ) : (
          <div className="space-x-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm bg-slate-600 text-white rounded-md hover:bg-slate-700"
            >
              <Save className="w-4 h-4 inline-block mr-1" />
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50"
            >
              <X className="w-4 h-4 inline-block mr-1" />
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Role Selection */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-medium text-slate-800 mb-4">Select Role</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {roles.map((role) => (
            <div
              key={role.id}
              onClick={() => isEditing && setSelectedRole(role.id)}
              className={`p-4 rounded-lg border ${
                selectedRole === role.id
                  ? 'border-slate-600 bg-slate-50'
                  : 'border-slate-200 hover:border-slate-300'
              } ${isEditing ? 'cursor-pointer' : ''}`}
            >
              <h4 className="font-medium text-slate-800">{role.name}</h4>
              <p className="text-sm text-slate-600 mt-1">{role.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Permissions List */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-medium text-slate-800 mb-4">
          Permissions for {currentRole?.name}
        </h3>
        <div className="space-y-4">
          {permissions.map((permission) => (
            <div
              key={permission.id}
              className={`p-4 rounded-lg border border-slate-200 ${
                currentRole?.permissions.includes(permission.id)
                  ? 'bg-slate-50'
                  : 'opacity-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-slate-800">{permission.name}</h4>
                  <p className="text-sm text-slate-600 mt-1">{permission.description}</p>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={currentRole?.permissions.includes(permission.id)}
                    onChange={() => {}}
                    disabled={!isEditing}
                    className="h-5 w-5 rounded border-slate-300 text-slate-600 focus:ring-slate-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
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
  );
};

export default PermissionsSection; 