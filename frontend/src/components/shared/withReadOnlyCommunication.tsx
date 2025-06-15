import React from 'react';
import ReadOnlyWithCommunication from './ReadOnlyWithCommunication';
import { shouldApplyReadOnly, getOnBehalfOfText, getRoleDisplayName } from '../../utils/roleUtils';

interface WithReadOnlyCommunicationOptions {
  targetRole: string;
  pageName: string;
  getUserRole: () => string;
  getSpecificUser?: () => string | undefined;
}

/**
 * Higher-order component that wraps a component with read-only communication functionality
 * when accessed by upper roles
 */
export function withReadOnlyCommunication<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithReadOnlyCommunicationOptions
) {
  const WithReadOnlyComponent: React.FC<P> = (props) => {
    const userRole = options.getUserRole();
    const specificUser = options.getSpecificUser?.();

    // Check if read-only wrapper should be applied
    const shouldApplyWrapper = shouldApplyReadOnly(userRole, options.targetRole);

    if (!shouldApplyWrapper) {
      // User has appropriate role, render component normally
      return <WrappedComponent {...props} />;
    }

    // Apply read-only wrapper for upper roles
    return (
      <ReadOnlyWithCommunication
        userRole={getRoleDisplayName(userRole)}
        targetRole={getRoleDisplayName(options.targetRole)}
        pageName={options.pageName}
        onBehalfOf={getOnBehalfOfText(userRole, options.targetRole, specificUser)}
      >
        <WrappedComponent {...props} />
      </ReadOnlyWithCommunication>
    );
  };

  WithReadOnlyComponent.displayName = `withReadOnlyCommunication(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithReadOnlyComponent;
}

/**
 * Hook to get current user role from authentication context
 */
export const useCurrentUserRole = (): string => {
  // This should be replaced with actual authentication context
  // For now, we'll check localStorage or use a default
  const authToken = localStorage.getItem('authToken');
  const userInfo = localStorage.getItem('userInfo');

  if (userInfo) {
    try {
      const parsed = JSON.parse(userInfo);
      return parsed.role || 'doctor';
    } catch (e) {
      console.warn('Failed to parse user info from localStorage');
    }
  }

  // Fallback: try to determine from current path or default to doctor
  const path = window.location.pathname;
  if (path.includes('/admin')) return 'admin';
  if (path.includes('/chp-admin')) return 'chp_admin';
  if (path.includes('/master-distributor')) return 'master_distributor';
  if (path.includes('/distributor')) return 'distributor';
  if (path.includes('/sales')) return 'sales';
  if (path.includes('/ivr-company')) return 'ivr_company';

  return 'doctor'; // Default fallback
};

/**
 * Utility function to create read-only wrapper options
 */
export const createReadOnlyOptions = (
  targetRole: string,
  pageName: string,
  getSpecificUser?: () => string | undefined
): WithReadOnlyCommunicationOptions => ({
  targetRole,
  pageName,
  getUserRole: useCurrentUserRole,
  getSpecificUser
});