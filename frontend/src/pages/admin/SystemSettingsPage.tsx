import React from 'react';
import { Settings } from 'lucide-react';

const SystemSettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">System Settings</h1>
        <div className="flex items-center space-x-2">
          <Settings className="w-6 h-6 text-[#2E86AB]" />
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-slate-600">System Settings configuration coming soon...</p>
      </div>
    </div>
  );
};

export default SystemSettingsPage; 