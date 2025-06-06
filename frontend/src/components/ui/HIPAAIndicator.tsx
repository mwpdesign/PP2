import React, { useState } from 'react';
import { ShieldCheckIcon, LockClosedIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface HIPAAIndicatorProps {
  type: 'section' | 'field' | 'form';
  message?: string;
  encrypted?: boolean;
}

export const HIPAAIndicator: React.FC<HIPAAIndicatorProps> = ({
  type,
  message,
  encrypted = true,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const getIcon = () => {
    switch (type) {
      case 'section':
        return <ShieldCheckIcon className="h-4 w-4" />;
      case 'field':
        return <LockClosedIcon className="h-4 w-4" />;
      case 'form':
        return <InformationCircleIcon className="h-4 w-4" />;
      default:
        return <ShieldCheckIcon className="h-4 w-4" />;
    }
  };

  const getDefaultMessage = () => {
    switch (type) {
      case 'section':
        return 'This section is HIPAA compliant';
      case 'field':
        return encrypted
          ? 'This field is encrypted and HIPAA compliant'
          : 'This field contains Protected Health Information (PHI)';
      case 'form':
        return 'This form handles Protected Health Information (PHI)';
      default:
        return 'HIPAA compliant';
    }
  };

  const tooltipMessage = message || getDefaultMessage();

  return (
    <div className="relative inline-flex">
      <div
        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 cursor-help"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {getIcon()}
        <span className="text-xs font-medium hidden sm:inline">
          HIPAA
        </span>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap z-50">
          {tooltipMessage}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};