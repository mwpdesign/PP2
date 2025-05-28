import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { AdminNavigation } from '../../navigation/AdminNavigation';

const AdminLayout: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNavigation />
      
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="pb-6">
            <h1 className="text-2xl font-semibold text-gray-900">
              Welcome, {user?.firstName} {user?.lastName}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Healthcare IVR Platform Administration
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout; 