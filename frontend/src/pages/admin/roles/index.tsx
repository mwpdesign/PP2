import React from 'react';
import {
  UserGroupIcon,
  ShieldCheckIcon,
  KeyIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';

const roles = [
  {
    name: 'Administrator',
    description: 'Full system access and management capabilities',
    icon: ShieldCheckIcon,
    permissions: ['all'],
    users: 3,
  },
  {
    name: 'Doctor',
    description: 'Patient management and IVR submission access',
    icon: UserGroupIcon,
    permissions: ['manage_patients', 'submit_ivr', 'place_orders'],
    users: 25,
  },
  {
    name: 'IVR Company',
    description: 'IVR review and approval capabilities',
    icon: KeyIcon,
    permissions: ['review_ivr', 'approve_requests'],
    users: 8,
  },
  {
    name: 'Logistics',
    description: 'Order and shipping management',
    icon: LockClosedIcon,
    permissions: ['manage_orders', 'manage_shipping'],
    users: 12,
  },
];

const RoleAssignment = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
        {roles.map((role) => (
          <div key={role.name} className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <role.icon className="h-6 w-6 text-[#2E86AB]" />
              </div>
              <div className="ml-4 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    {role.name}
                  </h3>
                  <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {role.users} users
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {role.description}
                </p>
                <div className="mt-2">
                  <div className="flex flex-wrap gap-2">
                    {role.permissions.map((permission) => (
                      <span
                        key={permission}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {permission}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="ml-4">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2E86AB]"
                >
                  Manage
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoleAssignment; 