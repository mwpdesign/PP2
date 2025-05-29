import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import AdminSidebar from './AdminSidebar';

const AdminLayout: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Sidebar */}
      <AdminSidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 ml-[280px]">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-8 py-4">
            <h1 className="text-lg font-medium text-gray-900">
              Welcome, {user?.firstName} {user?.lastName}
            </h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <div className="h-2 w-2 bg-green-500 rounded-full mr-2" />
                <span className="text-sm text-gray-600">System Status: Operational</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout; 