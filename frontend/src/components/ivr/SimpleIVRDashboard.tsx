import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const SimpleIVRDashboard: React.FC = () => {
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">IVR Dashboard</h1>
              <p className="text-gray-600 mt-2">Welcome, {user?.first_name || 'IVR User'}</p>
              <p className="text-sm text-gray-500">Role: {user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">IVR System Dashboard</h2>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              🚧 This dashboard is under development. IVR functionality will be available soon.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900">Active Calls</h3>
              <p className="text-2xl font-bold text-blue-600">--</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-900">Completed Today</h3>
              <p className="text-2xl font-bold text-green-600">--</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-medium text-purple-900">Queue Length</h3>
              <p className="text-2xl font-bold text-purple-600">--</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleIVRDashboard;