import React from 'react';
import AdminPageLayout from './shared/AdminPageLayout';

const SystemAnalytics: React.FC = () => {
  return (
    <AdminPageLayout
      title="System Analytics"
      description="Monitor system performance and usage analytics"
    >
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
          <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h2 className="text-xl font-medium text-slate-900 mb-2">System Analytics Coming Soon</h2>
        <p className="text-slate-600">
          Advanced analytics and reporting features are being implemented.
        </p>
      </div>
    </AdminPageLayout>
  );
};

export default SystemAnalytics; 