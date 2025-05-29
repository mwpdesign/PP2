import React from 'react';
import AdminPageLayout from './shared/AdminPageLayout';

const ProviderNetwork: React.FC = () => {
  return (
    <AdminPageLayout
      title="Provider Network"
      description="Manage healthcare providers and facility networks"
    >
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
          <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h2 className="text-xl font-medium text-slate-900 mb-2">Provider Network Coming Soon</h2>
        <p className="text-slate-600">
          Provider network management features are currently in development.
        </p>
      </div>
    </AdminPageLayout>
  );
};

export default ProviderNetwork; 