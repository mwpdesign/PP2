import React from 'react';
import { AdminUserTable } from '../../components/admin/users/AdminUserTable';

const AdminUsersPage: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-slate-900">User Management</h1>
      <p className="mt-2 text-slate-500">Manage platform users and their permissions.</p>
      
      <div className="mt-6">
        <AdminUserTable />
      </div>
    </div>
  );
};

export default AdminUsersPage; 