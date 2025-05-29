import React, { useState } from 'react';
import { PlusIcon, MagnifyingGlassIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';

const UserManagement: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState('all');

  const mockUsers = [
    {
      id: 'USR-001',
      name: 'Dr. Sarah Johnson',
      email: 'sarah.johnson@healthcare.com',
      role: 'Doctor',
      status: 'active',
      lastLogin: '2024-03-20 10:30 AM',
      permissions: ['patient_access', 'prescribe', 'view_records']
    },
    {
      id: 'USR-002',
      name: 'Admin Smith',
      email: 'admin.smith@healthcare.com',
      role: 'Administrator',
      status: 'active',
      lastLogin: '2024-03-20 09:15 AM',
      permissions: ['full_access', 'user_management', 'system_config']
    },
    {
      id: 'USR-003',
      name: 'Nurse Williams',
      email: 'nurse.williams@healthcare.com',
      role: 'Nurse',
      status: 'inactive',
      lastLogin: '2024-03-19 15:45 PM',
      permissions: ['patient_access', 'view_records']
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50';
      case 'inactive': return 'text-red-600 bg-red-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
          <p className="mt-1 text-sm text-slate-600">Manage system users and permissions</p>
        </div>
        <button className="flex items-center justify-center px-4 py-2 bg-[#375788] text-white rounded-lg hover:bg-[#2a4368] w-full md:w-auto">
          <PlusIcon className="h-5 w-5 mr-2" />
          Add User
        </button>
      </div>

      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search users..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#375788] focus:border-[#375788]"
          />
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full sm:w-auto border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#375788] focus:border-[#375788]"
          >
            <option value="all">All Roles</option>
            <option value="doctor">Doctors</option>
            <option value="nurse">Nurses</option>
            <option value="admin">Administrators</option>
          </select>
          <button className="flex items-center justify-center px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 w-full sm:w-auto">
            <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
            Filters
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">Role</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden lg:table-cell">Permissions</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">Last Login</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {mockUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
                        <span className="text-slate-600 font-medium text-sm">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-slate-900">{user.name}</div>
                        <div className="text-sm text-slate-500">{user.email}</div>
                        <div className="md:hidden text-xs text-slate-500">
                          {user.role} • {user.status}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 hidden md:table-cell">{user.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                    <div className="flex flex-wrap gap-2">
                      {user.permissions.map((permission, idx) => (
                        <span key={idx} className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-full">
                          {permission}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 hidden md:table-cell">{user.lastLogin}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-[#375788] hover:text-[#2a4368]">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
        <div className="text-sm text-slate-600 w-full sm:w-auto text-center sm:text-left">
          Showing 3 of 3 users
        </div>
        <div className="flex items-center space-x-2">
          <button className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">Previous</button>
          <button className="px-4 py-2 bg-[#375788] text-white rounded-lg hover:bg-[#2a4368]">Next</button>
        </div>
      </div>
    </div>
  );
};

export default UserManagement; 