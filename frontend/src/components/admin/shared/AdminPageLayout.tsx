import React from 'react';

interface AdminPageLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

const AdminPageLayout: React.FC<AdminPageLayoutProps> = ({ title, description, children }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        )}
      </div>
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
        {children}
      </div>
    </div>
  );
};

export default AdminPageLayout; 