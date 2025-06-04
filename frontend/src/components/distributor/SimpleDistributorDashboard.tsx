import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const SimpleDistributorDashboard: React.FC = () => {
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Distributor Dashboard</h1>
              <p className="text-gray-600 mt-2">Welcome, {user?.first_name || 'Distributor'} {user?.last_name}</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Distribution Management</h2>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800">
                📦 Regional distribution dashboard is under development.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                📋 View Order Queue
              </button>
              <button className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                🚚 Track Shipments
              </button>
              <button className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                📊 Inventory Reports
              </button>
              <button className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                🏪 Manage Retailers
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-medium text-gray-900">Pending Orders</h3>
            <p className="text-3xl font-bold text-blue-600">--</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-medium text-gray-900">Active Retailers</h3>
            <p className="text-3xl font-bold text-green-600">--</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-medium text-gray-900">Monthly Volume</h3>
            <p className="text-3xl font-bold text-purple-600">--</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-medium text-gray-900">Territory Coverage</h3>
            <p className="text-3xl font-bold text-orange-600">--</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleDistributorDashboard;