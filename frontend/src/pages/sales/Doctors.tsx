import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon,
  UsersIcon as UsersIconSolid,
  PhoneIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/solid';
import { useAuth } from '../../contexts/AuthContext';
import UnifiedDashboardLayout from '../../components/shared/layout/UnifiedDashboardLayout';


// Mock data for doctors
const mockDoctors = [
  {
    id: '1',
    name: 'Dr. Sarah Johnson',
    specialty: 'Wound Care Specialist',
    location: 'Metro General Hospital',
    facility: 'Metro General Hospital',
    dateAdded: '2024-01-15',
    phone: '(555) 123-4567',
    email: 'sarah.johnson@metro.com',
    status: 'Active'
  },
  {
    id: '2',
    name: 'Dr. Michael Chen',
    specialty: 'Dermatology',
    location: 'City Medical Center',
    facility: 'City Medical Center',
    dateAdded: '2024-02-03',
    phone: '(555) 234-5678',
    email: 'michael.chen@citymed.com',
    status: 'Active'
  },
  {
    id: '3',
    name: 'Dr. Emily Rodriguez',
    specialty: 'Plastic Surgery',
    location: 'Regional Health System',
    facility: 'Regional Health System',
    dateAdded: '2024-02-20',
    phone: '(555) 345-6789',
    email: 'emily.rodriguez@regional.com',
    status: 'Pending'
  }
];

const Doctors: React.FC = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [doctors, setDoctors] = useState(mockDoctors);

  // Check if user has permission to manage doctors
  const canManageDoctors = user?.role && ['Sales', 'Distributor', 'Master Distributor', 'Admin', 'CHP Admin'].includes(user.role);

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navigation = [
    { name: 'Dashboard', href: '/sales/dashboard', icon: HomeIcon },
    { name: 'Customer Accounts', href: '/sales/customers', icon: UsersIconSolid },
    ...(canManageDoctors ? [
      { name: 'Doctors', href: '/sales/doctors', icon: UsersIconSolid },
    ] : []),
    { name: 'Lead Management', href: '/sales/leads', icon: PhoneIcon },
    { name: 'Sales Reports', href: '/sales/reports', icon: ChartBarIcon },
    { name: 'Proposals', href: '/sales/proposals', icon: DocumentTextIcon },
    { name: 'Revenue Tracking', href: '/sales/revenue', icon: CurrencyDollarIcon },
    { name: 'Settings', href: '/sales/settings', icon: Cog6ToothIcon },
    {
      name: 'Sign Out',
      href: '#',
      icon: ArrowRightOnRectangleIcon,
      onClick: handleLogout
    }
  ];

  const userInfo = {
    name: user?.first_name ? `${user.first_name} ${user.last_name}` : 'Sales Rep',
    role: 'Sales Representative',
    avatar: user?.first_name?.charAt(0) || 'S'
  };

  // Filter doctors based on search term
  const filteredDoctors = doctors.filter(doctor =>
    doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.location.toLowerCase().includes(searchTerm.toLowerCase())
  );



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    switch (status) {
      case 'Active':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'Pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'Inactive':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  return (
    <UnifiedDashboardLayout navigation={navigation} userInfo={userInfo}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Manage Doctors</h1>
            <p className="mt-1 text-sm text-gray-600">
              Add and manage healthcare providers in your network
            </p>
          </div>
          <button
            onClick={() => navigate('/sales/doctors/add')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add New Doctor
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search doctors by name, specialty, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-slate-500 focus:border-slate-500"
            />
          </div>
        </div>

        {/* Doctors Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {filteredDoctors.length === 0 ? (
            // Empty State
            <div className="text-center py-12">
              <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {searchTerm ? 'No doctors found' : 'No doctors added yet'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm
                  ? 'Try adjusting your search criteria'
                  : 'Get started by adding your first healthcare provider'
                }
              </p>
              {!searchTerm && (
                <div className="mt-6">
                  <button
                    onClick={() => navigate('/sales/doctors/add')}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add New Doctor
                  </button>
                </div>
              )}
            </div>
          ) : (
            // Table
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Doctor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Specialty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location/Facility
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date Added
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDoctors.map((doctor) => (
                    <tr key={doctor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-slate-700">
                                {doctor.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{doctor.name}</div>
                            <div className="text-sm text-gray-500">{doctor.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {doctor.specialty}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {doctor.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(doctor.dateAdded)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusBadge(doctor.status)}>
                          {doctor.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {/* TODO: Implement view doctor */}}
                            className="text-slate-600 hover:text-slate-900 transition-colors"
                            title="View Doctor"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {/* TODO: Implement edit doctor */}}
                            className="text-slate-600 hover:text-slate-900 transition-colors"
                            title="Edit Doctor"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination (placeholder for future implementation) */}
        {filteredDoctors.length > 0 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow">
            <div className="flex-1 flex justify-between sm:hidden">
              <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                Previous
              </button>
              <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredDoctors.length}</span> of{' '}
                  <span className="font-medium">{filteredDoctors.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                    Previous
                  </button>
                  <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-slate-50 text-sm font-medium text-slate-600">
                    1
                  </button>
                  <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>


    </UnifiedDashboardLayout>
  );
};

export default Doctors;