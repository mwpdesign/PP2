import React from 'react';
import { DocumentTextIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface IVREmptyStateProps {
  /** Optional className for styling */
  className?: string;
}

/**
 * IVREmptyState Component
 *
 * Displays an empty state in the detail panel when no IVR is selected.
 * Features:
 * - Professional empty state design
 * - Clear instructions for user interaction
 * - Consistent styling with the application
 */
const IVREmptyState: React.FC<IVREmptyStateProps> = ({
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center h-full bg-gray-50 ${className}`}>
      <div className="text-center max-w-md mx-auto px-6">
        {/* Icon */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-6">
          <DocumentTextIcon className="h-8 w-8 text-gray-400" />
        </div>

        {/* Title */}
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Select an IVR Request
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-6">
          Choose an IVR request from the list to view detailed information, status updates, and available actions.
        </p>

        {/* Instructions */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-start space-x-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <h4 className="text-sm font-medium text-gray-900 mb-1">
                Getting Started
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Click on any IVR request in the list</li>
                <li>• Use search to find specific requests</li>
                <li>• Filter by status or priority</li>
                <li>• View detailed information and take actions</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IVREmptyState;