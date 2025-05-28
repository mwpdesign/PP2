import React from 'react';

interface SystemHeaderProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children?: React.ReactNode;
}

const SystemHeader: React.FC<SystemHeaderProps> = ({
  title,
  subtitle,
  icon,
  children,
}) => {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-slate-50">
                {icon}
              </div>
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
              <p className="text-sm text-gray-500">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemHeader; 