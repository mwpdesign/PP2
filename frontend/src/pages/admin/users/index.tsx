import React, { useState } from 'react';
import { 
  Key, 
  PencilIcon, 
  XCircle as XCircleIcon, 
  Archive as ArchiveBoxIcon,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Search,
  Filter
} from 'lucide-react';
import AddUserModal from '../../../components/admin/users/AddUserModal';
import PasswordResetModal from '../../../components/admin/users/PasswordResetModal';

// Mock data for demonstration
const users = [
  {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    role: 'Doctor',
    organization: 'General Hospital',
    status: 'Active',
    lastLogin: '2024-02-20T10:00:00',
  },
  {
    id: 2,
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    role: 'Nurse',
    organization: 'City Clinic',
    status: 'Active',
    lastLogin: '2024-02-20T09:30:00',
  },
  {
    id: 3,
    firstName: 'Mike',
    lastName: 'Johnson',
    email: 'mike.johnson@example.com',
    role: 'Admin',
    organization: 'Healthcare Corp',
    status: 'Inactive',
    lastLogin: '2024-02-19T15:45:00',
  },
];

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

const UserManagement = () => {
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isPasswordResetModalOpen, setIsPasswordResetModalOpen] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState<{id: number; name: string} | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'lastName', direction: 'asc' });
  const usersPerPage = 25;
  const [openActionMenu, setOpenActionMenu] = useState<number | null>(null);

  const handleSort = (key: string) => {
    setSortConfig((prevSort) => ({
      key,
      direction: prevSort.key === key && prevSort.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedUsers = [...users].sort((a, b) => {
    const aValue = a[sortConfig.key as keyof typeof a] || '';
    const bValue = b[sortConfig.key as keyof typeof b] || '';
    return sortConfig.direction === 'asc' 
      ? String(aValue).localeCompare(String(bValue))
      : String(bValue).localeCompare(String(aValue));
  });

  const filteredUsers = sortedUsers.filter((user) => {
    const matchesSearch =
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.organization.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole =
      selectedRole === 'all' || user.role.toLowerCase() === selectedRole.toLowerCase();

    return matchesSearch && matchesRole;
  });

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedUsers([]);
  };

  const handleBulkAction = (action: 'archive' | 'deactivate') => {
    // TODO: Implement bulk actions with proper HIPAA compliance
    console.log(`Bulk ${action}:`, selectedUsers);
  };

  const handleUserAction = (userId: number, action: 'archive' | 'deactivate') => {
    // TODO: Implement single user actions with proper HIPAA compliance
    console.log(`${action} user:`, userId);
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedUsers(checked ? paginatedUsers.map(u => u.id) : []);
  };

  const handleSelectUser = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAddUser = (userData: any) => {
    // TODO: Implement user creation logic with proper HIPAA compliance
    console.log('Creating new user:', userData);
  };

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      'Admin': 'bg-slate-100 text-slate-800 border border-slate-200',
      'Doctor': 'bg-emerald-50 text-emerald-800 border border-emerald-200',
      'Nurse': 'bg-slate-50 text-slate-800 border border-slate-200',
      'Staff': 'bg-gray-100 text-gray-800 border border-gray-200',
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800 border border-gray-200';
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const handlePasswordReset = async (method: 'temporary' | 'email' | 'force-change') => {
    if (!selectedUserForReset) return;
    
    try {
      // TODO: Implement actual password reset logic with proper HIPAA compliance
      console.log('Password reset for user:', selectedUserForReset.id, 'Method:', method);
      
      // Log the action for audit trail
      console.log('Audit log: Password reset initiated', {
        userId: selectedUserForReset.id,
        method,
        timestamp: new Date().toISOString(),
        initiatedBy: 'current-admin-id' // TODO: Get from auth context
      });
      
      // Show success message (implement proper notification system)
      alert(`Password reset email sent to user: ${selectedUserForReset.name}`);
    } catch (error) {
      console.error('Password reset failed:', error);
      alert('Failed to reset password. Please try again.');
    }
  };

  const getStatusBadgeStyles = (status: string) => {
    const baseStyles = 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border';
    switch (status) {
      case 'Active':
        return `${baseStyles} bg-emerald-50 text-emerald-700 border-emerald-200`;
      case 'Inactive':
        return `${baseStyles} bg-gray-100 text-gray-700 border-gray-200`;
      case 'Archived':
        return `${baseStyles} bg-amber-50 text-amber-700 border-amber-200`;
      default:
        return `${baseStyles} bg-gray-100 text-gray-700 border-gray-200`;
    }
  };

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="w-4 h-4 ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 ml-1" />
    );
  };

  const handleActionClick = (userId: number) => {
    setOpenActionMenu(openActionMenu === userId ? null : userId);
  };

  const ActionMenu = ({ user }: { user: typeof users[0] }) => {
    return (
      <div className="relative">
        <button
          onClick={() => handleActionClick(user.id)}
          className="inline-flex items-center px-2 py-1 bg-slate-600 hover:bg-slate-700 text-white text-xs rounded shadow-sm transition-colors duration-200"
        >
          <MoreVertical className="w-3.5 h-3.5 mr-1" />
          Actions
        </button>
        {openActionMenu === user.id && (
          <div className="absolute right-0 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
            <div className="py-1" role="menu">
              <button
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-slate-50 flex items-center"
                onClick={() => {
                  // Handle edit
                  handleActionClick(user.id);
                }}
              >
                <PencilIcon className="w-3.5 h-3.5 mr-2 text-gray-500" />
                Edit
              </button>
              <button
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-slate-50 flex items-center"
                onClick={() => {
                  setSelectedUserForReset({
                    id: user.id,
                    name: `${user.firstName} ${user.lastName}`
                  });
                  setIsPasswordResetModalOpen(true);
                  handleActionClick(user.id);
                }}
              >
                <Key className="w-3.5 h-3.5 mr-2 text-gray-500" />
                Reset Password
              </button>
              <button
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-slate-50 flex items-center"
                onClick={() => {
                  handleUserAction(user.id, 'deactivate');
                  handleActionClick(user.id);
                }}
              >
                <XCircleIcon className="w-3.5 h-3.5 mr-2 text-gray-500" />
                Deactivate
              </button>
              <button
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-slate-50 flex items-center"
                onClick={() => {
                  handleUserAction(user.id, 'archive');
                  handleActionClick(user.id);
                }}
              >
                <ArchiveBoxIcon className="w-3.5 h-3.5 mr-2 text-gray-500" />
                Archive
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">User Management</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleBulkAction('archive')}
            disabled={selectedUsers.length === 0}
            className="inline-flex items-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-sm"
          >
            <ArchiveBoxIcon className="w-4 h-4 mr-2" />
            Archive Selected ({selectedUsers.length})
          </button>
          <button
            onClick={() => setIsAddUserModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-md transition-colors duration-200 text-sm font-medium shadow-sm"
          >
            <Check className="w-4 h-4 mr-2" />
            Add User
          </button>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search Users
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="search"
                  type="text"
                  placeholder="Search by name, email, or organization..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full h-12 pl-10 pr-10 rounded-lg border-gray-300 shadow-sm focus:border-slate-400 focus:ring focus:ring-slate-200 focus:ring-opacity-50 text-base transition-colors duration-200"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Role
              </label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  id="role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="block w-full h-12 pl-10 rounded-lg border-gray-300 shadow-sm focus:border-slate-400 focus:ring focus:ring-slate-200 focus:ring-opacity-50 text-base transition-colors duration-200"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="doctor">Doctor</option>
                  <option value="nurse">Nurse</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {paginatedUsers.map((user) => (
          <div key={user.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors duration-200">
            <div className="p-4 flex items-center gap-4">
              <div className="flex items-center gap-4 flex-1">
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(user.id)}
                  onChange={() => handleSelectUser(user.id)}
                  className="rounded border-gray-300 text-slate-600 focus:ring-slate-500 h-4 w-4"
                />
                
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-12 w-12 rounded-full bg-slate-600 flex items-center justify-center text-white text-sm font-medium shadow-sm flex-shrink-0">
                    {getInitials(user.firstName, user.lastName)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-sm text-gray-500 truncate">{user.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                    {user.role}
                  </span>
                  <span className={getStatusBadgeStyles(user.status)}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                      user.status === 'Active' ? 'bg-emerald-600' : user.status === 'Inactive' ? 'bg-gray-600' : 'bg-amber-600'
                    }`} />
                    {user.status}
                  </span>
                </div>

                <div className="hidden md:block text-sm text-gray-500 flex-shrink-0">
                  {user.organization}
                </div>

                <div className="hidden sm:block text-sm text-gray-500 flex-shrink-0">
                  {formatDate(user.lastLogin)}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  className="inline-flex items-center px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white text-sm rounded shadow-sm transition-colors duration-200"
                >
                  <PencilIcon className="w-4 h-4 mr-1.5" />
                  Edit
                </button>
                <button 
                  onClick={() => {
                    setSelectedUserForReset({
                      id: user.id,
                      name: `${user.firstName} ${user.lastName}`
                    });
                    setIsPasswordResetModalOpen(true);
                  }}
                  className="inline-flex items-center px-3 py-1.5 bg-slate-500 hover:bg-slate-600 text-white text-sm rounded shadow-sm transition-colors duration-200"
                >
                  <Key className="w-4 h-4 mr-1.5" />
                  Reset
                </button>
                <button 
                  onClick={() => handleUserAction(user.id, 'deactivate')}
                  className="inline-flex items-center px-3 py-1.5 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded shadow-sm transition-colors duration-200"
                >
                  <XCircleIcon className="w-4 h-4 mr-1.5" />
                  Deactivate
                </button>
                <button 
                  onClick={() => handleUserAction(user.id, 'archive')}
                  className="inline-flex items-center px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm rounded shadow-sm transition-colors duration-200"
                >
                  <ArchiveBoxIcon className="w-4 h-4 mr-1.5" />
                  Archive
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white px-4 py-3 flex items-center justify-between border border-gray-200 rounded-lg shadow-sm">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            Previous
          </button>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing{' '}
              <span className="font-medium">
                {(currentPage - 1) * usersPerPage + 1}
              </span>{' '}
              to{' '}
              <span className="font-medium">
                {Math.min(currentPage * usersPerPage, filteredUsers.length)}
              </span>{' '}
              of{' '}
              <span className="font-medium">{filteredUsers.length}</span>{' '}
              results
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Previous
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => handlePageChange(i + 1)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors duration-200 ${
                    currentPage === i + 1
                      ? 'z-10 bg-slate-600 border-slate-600 text-white'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Next
              </button>
            </nav>
          </div>
        </div>
      </div>

      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onSubmit={handleAddUser}
      />

      <PasswordResetModal
        isOpen={isPasswordResetModalOpen}
        onClose={() => {
          setIsPasswordResetModalOpen(false);
          setSelectedUserForReset(null);
        }}
        onSubmit={handlePasswordReset}
        userName={selectedUserForReset?.name || ''}
      />
    </div>
  );
};

export default UserManagement; 