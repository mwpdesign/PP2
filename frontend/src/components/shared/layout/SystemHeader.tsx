import React from 'react';
import { format } from 'date-fns';

const SystemHeader: React.FC = () => {
  return (
    <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
      <div>
        <h1 className="text-lg font-medium text-gray-900">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center">
          <div className="h-2 w-2 bg-green-500 rounded-full mr-2" />
          <span className="text-sm text-gray-600">System Status: Operational</span>
        </div>
      </div>
    </div>
  );
};

export default SystemHeader; 