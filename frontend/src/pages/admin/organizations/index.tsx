import React from 'react';
import {
  BuildingOfficeIcon,
  UsersIcon,
  PhoneIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

const organizations = [
  {
    id: 1,
    name: 'City General Hospital',
    type: 'Hospital',
    location: 'New York, NY',
    users: 150,
    patients: 2500,
    status: 'active',
  },
  {
    id: 2,
    name: 'Wellness Medical Center',
    type: 'Medical Center',
    location: 'Los Angeles, CA',
    users: 75,
    patients: 1200,
    status: 'active',
  },
  {
    id: 3,
    name: 'IVR Health Solutions',
    type: 'IVR Provider',
    location: 'Chicago, IL',
    users: 25,
    patients: null,
    status: 'active',
  },
  {
    id: 4,
    name: 'MedLogistics Inc.',
    type: 'Logistics',
    location: 'Houston, TX',
    users: 40,
    patients: null,
    status: 'active',
  },
];

const OrganizationManagement = () => {
  return (
    <div className="space-y-6">
      {/* Actions Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Organizations</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage healthcare organizations and their settings
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#2E86AB] hover:bg-[#247297] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2E86AB]"
        >
          Add Organization
        </button>
      </div>

      {/* Organizations List */}
      <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
        {organizations.map((org) => (
          <div key={org.id} className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BuildingOfficeIcon className="h-8 w-8 text-[#2E86AB]" />
              </div>
              <div className="ml-4 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    {org.name}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      org.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {org.status}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <UsersIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                    {org.users} users
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPinIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                    {org.location}
                  </div>
                  {org.patients && (
                    <div className="flex items-center text-sm text-gray-500">
                      <PhoneIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                      {org.patients} patients
                    </div>
                  )}
                  <div className="flex items-center text-sm text-gray-500">
                    <BuildingOfficeIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                    {org.type}
                  </div>
                </div>
              </div>
              <div className="ml-4">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2E86AB]"
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

export default OrganizationManagement; 