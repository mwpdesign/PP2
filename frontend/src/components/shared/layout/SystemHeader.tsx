import React from 'react';
import { format } from 'date-fns';
import { useAuth } from '../../../contexts/AuthContext';
import { NotificationBell } from '../NotificationBell';

const SystemHeader: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="hidden md:flex items-center justify-between p-4 bg-white border-b border-gray-200">
      <div>
        <h1 className="text-lg font-medium text-gray-900">
          Welcome, {user?.first_name} {user?.last_name}
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <NotificationBell />
        <div className="flex items-center">
          <div className="h-2 w-2 bg-green-500 rounded-full mr-2" />
          <span className="text-sm text-gray-600">System Status: Operational</span>
        </div>
      </div>
    </div>
  );
};

export default SystemHeader;