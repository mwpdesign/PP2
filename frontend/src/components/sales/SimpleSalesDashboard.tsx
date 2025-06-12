import React from 'react';
import {
  HomeIcon,
  UsersIcon,
  UserPlusIcon,
  ListBulletIcon,
  PhoneIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/solid';
import { useAuth } from '../../contexts/AuthContext';
import UnifiedDashboardLayout from '../shared/layout/UnifiedDashboardLayout';

const SimpleSalesDashboard: React.FC = () => {
  const { logout, user } = useAuth();

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
    { name: 'Customer Accounts', href: '/sales/customers', icon: UsersIcon },
    ...(canManageDoctors ? [
      { name: 'Doctors', href: '/sales/doctors', icon: UsersIcon },
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

  return (
    <UnifiedDashboardLayout navigation={navigation} userInfo={userInfo}>
      {/* Dashboard Content */}
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900">Sales Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome, {user?.first_name || 'Sales'} {user?.last_name}</p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Sales Management</h2>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-purple-800">
                💼 Sales representative dashboard is under development.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                👥 View Customer Accounts
              </button>
              <button className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                📞 Schedule Follow-ups
              </button>
              <button className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                📈 Sales Reports
              </button>
              <button className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                🎯 Lead Management
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Monthly Sales</h3>
                <p className="text-2xl font-bold text-gray-900">--</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <UsersIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Active Leads</h3>
                <p className="text-2xl font-bold text-gray-900">--</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Conversion Rate</h3>
                <p className="text-2xl font-bold text-gray-900">--%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <DocumentTextIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Target Progress</h3>
                <p className="text-2xl font-bold text-gray-900">--%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
};

export default SimpleSalesDashboard;