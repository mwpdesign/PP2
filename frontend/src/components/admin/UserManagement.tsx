import React from 'react';
import AdminPageLayout from './shared/AdminPageLayout';

const UserManagement: React.FC = () => {
  return (
    <AdminPageLayout
      title="User Management"
      description="Manage system users, roles, and permissions"
    >
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
          <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h2 className="text-xl font-medium text-slate-900 mb-2">User Management Coming Soon</h2>
        <p className="text-slate-600">
          This feature is currently under development. Check back soon for updates.
        </p>
      </div>
    </AdminPageLayout>
  );
};

export default UserManagement; 