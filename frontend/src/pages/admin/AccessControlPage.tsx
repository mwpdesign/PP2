import React from 'react';
import { Shield } from 'lucide-react';

const AccessControlPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Access Control</h1>
        <div className="flex items-center space-x-2">
          <Shield className="w-6 h-6 text-[#2E86AB]" />
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-slate-600">Access Control configuration coming soon...</p>
      </div>
    </div>
  );
};

export default AccessControlPage; 