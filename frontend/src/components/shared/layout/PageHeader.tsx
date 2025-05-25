import React from 'react';
import { format } from 'date-fns';

interface PageHeaderProps {
  title?: string;
  subtitle?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle }) => {
  return (
    <div className="flex items-center justify-between mb-8 bg-white p-6 rounded-lg shadow-sm">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
        )}
        <p className="text-sm text-gray-600 mt-1">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>
      <div className="flex items-center">
        <div className="h-2 w-2 bg-green-500 rounded-full mr-2" />
        <span className="text-sm text-gray-600">System Status: Operational</span>
      </div>
    </div>
  );
};

export default PageHeader; 