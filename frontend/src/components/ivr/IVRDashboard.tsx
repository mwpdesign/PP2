import React from 'react';
import { PhoneIcon, ClockIcon, CheckCircleIcon, ExclamationTriangleIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

const IVRDashboard: React.FC = () => {
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">IVR Dashboard</h1>
          <p className="text-gray-600 mt-2">Interactive Voice Response System Management</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
          Logout
        </button>
      </div>

      {/* Coming Soon Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 mr-3" />
          <div>
            <h3 className="text-lg font-medium text-yellow-800">Dashboard Under Development</h3>
            <p className="text-yellow-700 mt-1">
              The IVR dashboard is currently being built. This is a placeholder interface.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <PhoneIcon className="h-8 w-8 text-[#2E86AB]" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Calls</p>
              <p className="text-2xl font-bold text-gray-900">--</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Wait Time</p>
              <p className="text-2xl font-bold text-gray-900">--</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed Today</p>
              <p className="text-2xl font-bold text-gray-900">--</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Failed Calls</p>
              <p className="text-2xl font-bold text-gray-900">--</p>
            </div>
          </div>
        </div>
      </div>

      {/* Placeholder Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent IVR Activity</h3>
          <div className="text-center py-8 text-gray-500">
            <PhoneIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>IVR activity monitoring will be available soon</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">System Status</h3>
          <div className="text-center py-8 text-gray-500">
            <CheckCircleIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>System monitoring dashboard coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IVRDashboard;