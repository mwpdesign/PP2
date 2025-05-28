import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, MoreVertical, Archive, RefreshCw, 
  Edit, Trash2, UserPlus, Download 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { User, Role } from '@/types/user';
import { userService } from '@/services/userService';
import { formatDate } from '@/utils/format';

// Role definitions with their specific field requirements
const ROLES = {
  DOCTOR: 'Doctor',
  DOCTOR_ASSISTANT: 'Doctor Assistant',
  MASTER_DISTRIBUTOR: 'Master Distributor',
  DISTRIBUTOR: 'Distributor',
  SALES_REP: 'Sales Representative',
  IVR_STAFF: 'IVR Company Staff',
  LOGISTICS: 'Logistics Coordinator',
  SYSTEM_ADMIN: 'System Admin',
  COMPLIANCE: 'Compliance Officer'
} as const;

interface UserTableProps {
  onEditUser: (user: User) => void;
  onAddUser: () => void;
}

export const UserTable: React.FC<UserTableProps> = ({ onEditUser, onAddUser }) => {
  // State
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    role: '',
    status: '' as '' | 'active' | 'inactive' | 'archived',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });
  const [sorting, setSorting] = useState({
    field: 'createdAt',
    order: 'desc' as 'asc' | 'desc',
  });

  // Load users
  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.searchUsers({
        query: searchTerm,
        role: filters.role || undefined,
        status: filters.status || undefined,
        page: pagination.page,
        limit: pagination.pageSize,
        sortBy: sorting.field,
        sortOrder: sorting.order,
      });
      setUsers(response.users);
      setPagination({
        ...pagination,
        total: response.total,
      });
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Load users when dependencies change
  useEffect(() => {
    loadUsers();
  }, [searchTerm, filters, pagination.page, pagination.pageSize, sorting]);

  // Handle bulk actions
  const handleBulkArchive = async () => {
    if (!selectedUsers.length) return;
    try {
      await userService.bulkArchive(selectedUsers);
      toast.success('Users archived successfully');
      setSelectedUsers([]);
      loadUsers();
    } catch (error) {
      console.error('Failed to archive users:', error);
      toast.error('Failed to archive users');
    }
  };

  const handleBulkUpdateStatus = async (status: 'active' | 'inactive') => {
    if (!selectedUsers.length) return;
    try {
      await userService.bulkUpdateStatus(selectedUsers, status);
      toast.success(`Users ${status === 'active' ? 'activated' : 'deactivated'} successfully`);
      setSelectedUsers([]);
      loadUsers();
    } catch (error) {
      console.error('Failed to update user status:', error);
      toast.error('Failed to update user status');
    }
  };

  // Handle single user actions
  const handleArchiveUser = async (userId: string) => {
    try {
      await userService.archiveUser(userId);
      toast.success('User archived successfully');
      loadUsers();
    } catch (error) {
      console.error('Failed to archive user:', error);
      toast.error('Failed to archive user');
    }
  };

  const handleResetPassword = async (userId: string) => {
    try {
      await userService.resetPassword(userId);
      toast.success('Password reset email sent');
    } catch (error) {
      console.error('Failed to reset password:', error);
      toast.error('Failed to reset password');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86AB] focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-2">
              <select
                value={filters.role}
                onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                className="border border-gray-300 rounded-md text-sm py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-[#2E86AB] focus:border-transparent"
              >
                <option value="">All Roles</option>
                {Object.values(ROLES).map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>

              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value as typeof filters.status })}
                className="border border-gray-300 rounded-md text-sm py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-[#2E86AB] focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onAddUser}
              className="flex items-center px-4 py-2 bg-[#2E86AB] text-white rounded-md hover:bg-[#247297] transition-colors"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </button>

            {selectedUsers.length > 0 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleBulkUpdateStatus('active')}
                  className="px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded-md transition-colors"
                >
                  Activate
                </button>
                <button
                  onClick={() => handleBulkUpdateStatus('inactive')}
                  className="px-3 py-1 text-sm text-orange-600 hover:bg-orange-50 rounded-md transition-colors"
                >
                  Deactivate
                </button>
                <button
                  onClick={handleBulkArchive}
                  className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  Archive
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={selectedUsers.length === users.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedUsers(users.map(user => user.id));
                    } else {
                      setSelectedUsers([]);
                    }
                  }}
                  className="rounded border-gray-300 text-[#2E86AB] focus:ring-[#2E86AB]"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Login
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                  <RefreshCw className="h-5 w-5 animate-spin mx-auto" />
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers([...selectedUsers, user.id]);
                        } else {
                          setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                        }
                      }}
                      className="rounded border-gray-300 text-[#2E86AB] focus:ring-[#2E86AB]"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : user.status === 'inactive'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => onEditUser(user)}
                        className="text-[#2E86AB] hover:text-[#247297]"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleResetPassword(user.id)}
                        className="text-orange-600 hover:text-orange-700"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleArchiveUser(user.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Archive className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <select
              value={pagination.pageSize}
              onChange={(e) => {
                setPagination({
                  ...pagination,
                  page: 1,
                  pageSize: Number(e.target.value),
                });
              }}
              className="border border-gray-300 rounded-md text-sm py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-[#2E86AB] focus:border-transparent"
            >
              <option value="10">10 per page</option>
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
              <option value="100">100 per page</option>
            </select>
            <span className="text-sm text-gray-500">
              Showing {(pagination.page - 1) * pagination.pageSize + 1} to{' '}
              {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
              {pagination.total} results
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              disabled={pagination.page === 1}
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              disabled={pagination.page === pagination.totalPages}
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 