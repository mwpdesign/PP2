import React from 'react';
import AdminPageLayout from './shared/AdminPageLayout';

const AuditLogs: React.FC = () => {
  return (
    <AdminPageLayout
      title="Audit Logs"
      description="Review system audit logs and security events"
    >
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
          <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-medium text-slate-900 mb-2">Audit Logs Coming Soon</h2>
        <p className="text-slate-600">
          Comprehensive audit logging and review features are being developed.
        </p>
      </div>
    </AdminPageLayout>
  );
};

export default AuditLogs; 