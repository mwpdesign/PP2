import React from 'react';
import AdminPageLayout from './shared/AdminPageLayout';

const IVRReviewQueue: React.FC = () => {
  return (
    <AdminPageLayout
      title="IVR Review Queue"
      description="Review and manage IVR call recordings and transcripts"
    >
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
          <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-medium text-slate-900 mb-2">IVR Review Queue Coming Soon</h2>
        <p className="text-slate-600">
          The IVR review system is being enhanced. New features will be available shortly.
        </p>
      </div>
    </AdminPageLayout>
  );
};

export default IVRReviewQueue; 