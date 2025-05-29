import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  Edit2, 
  Trash2, 
  Shield, 
  UserPlus,
  ArrowUpDown,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'doctor' | 'nurse' | 'support';
  status: 'active' | 'inactive' | 'pending';
  lastLogin: Date;
  territory: string;
  hipaaTrainingDate: Date;
}

const mockUsers: User[] = [
  {
    id: 'U1001',
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@healthcare.com',
    role: 'doctor',
    status: 'active',
    lastLogin: new Date(Date.now() - 1000 * 60 * 30),
    territory: 'Northeast',
    hipaaTrainingDate: new Date(2024, 1, 15)
  },
  {
    id: 'U1002',
    name: 'Admin Michael Chen',
    email: 'michael.chen@healthcare.com',
    role: 'admin',
    status: 'active',
    lastLogin: new Date(Date.now() - 1000 * 60 * 60),
    territory: 'All',
    hipaaTrainingDate: new Date(2024, 1, 10)
  },
  {
    id: 'U1003',
    name: 'Nurse Emily Rodriguez',
    email: 'emily.r@healthcare.com',
    role: 'nurse',
    status: 'active',
    lastLogin: new Date(Date.now() - 1000 * 60 * 120),
    territory: 'Southwest',
    hipaaTrainingDate: new Date(2024, 1, 20)
  },
  {
    id: 'U1004',
    name: 'Support David Williams',
    email: 'david.w@healthcare.com',
    role: 'support',
    status: 'pending',
    lastLogin: new Date(Date.now() - 1000 * 60 * 240),
    territory: 'Southeast',
    hipaaTrainingDate: new Date(2024, 1, 5)
  },
  {
    id: 'U1005',
    name: 'Dr. Maria Garcia',
    email: 'maria.g@healthcare.com',
    role: 'doctor',
    status: 'inactive',
    lastLogin: new Date(Date.now() - 1000 * 60 * 480),
    territory: 'West',
    hipaaTrainingDate: new Date(2024, 0, 25)
  }
];

export const AdminUserTable: React.FC = () => {
  const [users] = useState<User[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof User>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedRole, setSelectedRole] = useState<User['role'] | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<User['status'] | 'all'>('all');

  const getRoleColor = (role: User['role']) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'doctor':
        return 'bg-blue-100 text-blue-800';
      case 'nurse':
        return 'bg-green-100 text-green-800';
      case 'support':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: User['status']) => {
    switch (status) {
      case 'active':
        return 'text-green-500';
      case 'inactive':
        return 'text-red-500';
      case 'pending':
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: User['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5" />;
      case 'inactive':
        return <XCircle className="h-5 w-5" />;
      case 'pending':
        return <Clock className="h-5 w-5" />;
    }
  };

  const filteredUsers = users
    .filter(user => 
      (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       user.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (selectedRole === 'all' || user.role === selectedRole) &&
      (selectedStatus === 'all' || user.status === selectedStatus)
    )
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const handleSort = (field: keyof User) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="space-y-4">
      {/* Table Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search users..."
            className="pl-10 pr-4 py-2 w-full border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#475569]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select
            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#475569]"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as User['role'] | 'all')}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="doctor">Doctor</option>
            <option value="nurse">Nurse</option>
            <option value="support">Support</option>
          </select>
          <select
            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#475569]"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as User['status'] | 'all')}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
          <button
            className="px-4 py-2 bg-[#475569] text-white rounded-lg hover:bg-[#334155] transition-colors flex items-center gap-2"
          >
            <UserPlus className="h-5 w-5" />
            <span className="hidden sm:inline">Add User</span>
          </button>
        </div>
      </div>

      {/* User Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                <button
                  className="flex items-center gap-1 hover:text-slate-700"
                  onClick={() => handleSort('name')}
                >
                  User
                  <ArrowUpDown className="h-4 w-4" />
                </button>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Role
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                <button
                  className="flex items-center gap-1 hover:text-slate-700"
                  onClick={() => handleSort('lastLogin')}
                >
                  Last Login
                  <ArrowUpDown className="h-4 w-4" />
                </button>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Territory
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                HIPAA Training
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-slate-900">{user.name}</div>
                      <div className="text-sm text-slate-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(user.role)}`}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`flex items-center ${getStatusColor(user.status)}`}>
                    {getStatusIcon(user.status)}
                    <span className="ml-2 text-sm">
                      {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {format(user.lastLogin, 'MMM d, h:mm a')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {user.territory}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {format(user.hipaaTrainingDate, 'MMM d, yyyy')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-3">
                    <button className="text-slate-400 hover:text-slate-500">
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button className="text-slate-400 hover:text-slate-500">
                      <Shield className="h-5 w-5" />
                    </button>
                    <button className="text-red-400 hover:text-red-500">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 sm:px-6">
        <div className="flex items-center">
          <p className="text-sm text-slate-700">
            Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredUsers.length}</span> of{' '}
            <span className="font-medium">{users.length}</span> users
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button className="px-3 py-1 border border-slate-200 rounded-md text-sm text-slate-600 hover:bg-slate-50">
            Previous
          </button>
          <button className="px-3 py-1 border border-slate-200 rounded-md text-sm text-slate-600 hover:bg-slate-50">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}; 