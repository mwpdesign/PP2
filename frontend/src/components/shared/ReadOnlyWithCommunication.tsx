import React, { ReactNode, useEffect } from 'react';
import { EyeIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

interface ReadOnlyWithCommunicationProps {
  children: ReactNode;
  userRole: string;
  targetRole: string; // The role this page is designed for (e.g., 'doctor', 'distributor')
  pageName: string;
  onBehalfOf?: string; // Who the upper role is helping
  className?: string;
}

const ReadOnlyWithCommunication: React.FC<ReadOnlyWithCommunicationProps> = ({
  children,
  userRole,
  targetRole,
  pageName,
  onBehalfOf,
  className = ''
}) => {
  // Define role hierarchy (higher index = higher authority)
  const roleHierarchy = [
    'medical_staff',
    'office_admin',
    'doctor',
    'sales',
    'distributor',
    'master_distributor',
    'chp_admin',
    'admin'
  ];

  const userRoleIndex = roleHierarchy.indexOf(userRole.toLowerCase());
  const targetRoleIndex = roleHierarchy.indexOf(targetRole.toLowerCase());
  const isUpperRole = userRoleIndex > targetRoleIndex;

  // Log access for audit purposes
  useEffect(() => {
    if (isUpperRole) {
      console.log(`🔍 READ-ONLY ACCESS: ${userRole} viewing ${pageName} (designed for ${targetRole})${onBehalfOf ? ` on behalf of ${onBehalfOf}` : ''}`);

      // Log to audit system if available
      if (window.auditLog) {
        window.auditLog({
          action: 'READ_ONLY_ACCESS',
          resource: pageName,
          user_role: userRole,
          target_role: targetRole,
          on_behalf_of: onBehalfOf,
          timestamp: new Date().toISOString()
        });
      }
    }
  }, [isUpperRole, userRole, targetRole, pageName, onBehalfOf]);

  // Apply read-only styling if user is upper role
  useEffect(() => {
    if (isUpperRole) {
      const style = document.createElement('style');
      style.id = 'read-only-communication-styles';
      style.textContent = `
        /* Disable modify/delete buttons but keep communication active */
        .read-only-wrapper button:not([data-communication]):not([data-navigation]):not([data-search]):not([data-filter]):not([data-pagination]):not([data-sort]) {
          opacity: 0.5 !important;
          cursor: not-allowed !important;
          pointer-events: none !important;
        }

        /* Keep communication buttons active */
        .read-only-wrapper button[data-communication="true"],
        .read-only-wrapper button[data-communication="chat"],
        .read-only-wrapper button[data-communication="upload"],
        .read-only-wrapper button[data-communication="message"],
        .read-only-wrapper button[data-communication="comment"],
        .read-only-wrapper button[data-communication="document"] {
          opacity: 1 !important;
          cursor: pointer !important;
          pointer-events: auto !important;
        }

        /* Keep navigation and search active */
        .read-only-wrapper button[data-navigation="true"],
        .read-only-wrapper button[data-search="true"],
        .read-only-wrapper button[data-filter="true"],
        .read-only-wrapper button[data-pagination="true"],
        .read-only-wrapper button[data-sort="true"] {
          opacity: 1 !important;
          cursor: pointer !important;
          pointer-events: auto !important;
        }

        /* Disable form inputs except communication forms */
        .read-only-wrapper input:not([data-communication]):not([data-search]):not([data-filter]),
        .read-only-wrapper select:not([data-communication]):not([data-search]):not([data-filter]),
        .read-only-wrapper textarea:not([data-communication]) {
          opacity: 0.6 !important;
          cursor: not-allowed !important;
          pointer-events: none !important;
          background-color: #f9fafb !important;
        }

        /* Keep communication inputs active */
        .read-only-wrapper input[data-communication="true"],
        .read-only-wrapper textarea[data-communication="true"],
        .read-only-wrapper input[data-communication="chat"],
        .read-only-wrapper textarea[data-communication="chat"],
        .read-only-wrapper input[data-communication="message"],
        .read-only-wrapper textarea[data-communication="message"] {
          opacity: 1 !important;
          cursor: text !important;
          pointer-events: auto !important;
          background-color: white !important;
        }

        /* Keep search and filter inputs active */
        .read-only-wrapper input[data-search="true"],
        .read-only-wrapper input[data-filter="true"],
        .read-only-wrapper select[data-filter="true"] {
          opacity: 1 !important;
          cursor: pointer !important;
          pointer-events: auto !important;
          background-color: white !important;
        }

        /* Disable checkboxes and radio buttons except communication */
        .read-only-wrapper input[type="checkbox"]:not([data-communication]),
        .read-only-wrapper input[type="radio"]:not([data-communication]) {
          opacity: 0.5 !important;
          cursor: not-allowed !important;
          pointer-events: none !important;
        }

        /* Style file upload areas for communication */
        .read-only-wrapper [data-communication="upload"] {
          border: 2px dashed #3b82f6 !important;
          background-color: #eff6ff !important;
        }
      `;
      document.head.appendChild(style);

      return () => {
        const existingStyle = document.getElementById('read-only-communication-styles');
        if (existingStyle) {
          existingStyle.remove();
        }
      };
    }
  }, [isUpperRole]);

  if (!isUpperRole) {
    // User has appropriate role, render normally
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={`read-only-wrapper ${className}`}>
      {/* Read-Only Banner */}
      <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <EyeIcon className="h-5 w-5 text-amber-400" aria-hidden="true" />
          </div>
          <div className="ml-3 flex-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-700 font-medium">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 mr-2">
                    View Only
                  </span>
                  You are viewing this page in read-only mode
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  As a {userRole}, you can view {targetRole} data and provide support through communication features
                  {onBehalfOf && ` on behalf of ${onBehalfOf}`}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <ChatBubbleLeftRightIcon className="h-4 w-4 text-amber-600" />
                <span className="text-xs text-amber-600 font-medium">Communication Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wrapped Content */}
      {children}

      {/* Communication Helper */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Communication Features Available</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Send messages and comments to provide guidance</li>
                <li>Upload documents and attachments to help with requests</li>
                <li>View communication history and status updates</li>
                <li>All uploads will be logged as "{userRole} on behalf of {onBehalfOf || targetRole}"</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReadOnlyWithCommunication;