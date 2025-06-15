// Role hierarchy utilities for Healthcare IVR Platform

export const ROLE_HIERARCHY = [
  'medical_staff',
  'office_admin',
  'doctor',
  'sales',
  'distributor',
  'master_distributor',
  'chp_admin',
  'admin'
] as const;

export type UserRole = typeof ROLE_HIERARCHY[number];

/**
 * Check if user role is higher in hierarchy than target role
 */
export const isUpperRole = (userRole: string, targetRole: string): boolean => {
  const userIndex = ROLE_HIERARCHY.indexOf(userRole.toLowerCase() as UserRole);
  const targetIndex = ROLE_HIERARCHY.indexOf(targetRole.toLowerCase() as UserRole);
  return userIndex > targetIndex && userIndex !== -1 && targetIndex !== -1;
};

/**
 * Check if user should have read-only access to a page designed for target role
 */
export const shouldApplyReadOnly = (userRole: string, targetRole: string): boolean => {
  return isUpperRole(userRole, targetRole);
};

/**
 * Get the appropriate "on behalf of" text for upper roles
 */
export const getOnBehalfOfText = (userRole: string, targetRole: string, specificUser?: string): string => {
  if (specificUser) {
    return specificUser;
  }

  // Generic role-based text
  switch (targetRole.toLowerCase()) {
    case 'doctor':
      return 'healthcare providers';
    case 'sales':
      return 'sales representatives';
    case 'distributor':
      return 'distributors';
    case 'office_admin':
      return 'office administrators';
    case 'medical_staff':
      return 'medical staff';
    default:
      return `${targetRole} users`;
  }
};

/**
 * Get role display name for UI
 */
export const getRoleDisplayName = (role: string): string => {
  const roleMap: Record<string, string> = {
    'medical_staff': 'Medical Staff',
    'office_admin': 'Office Administrator',
    'doctor': 'Doctor',
    'sales': 'Sales Representative',
    'distributor': 'Regional Distributor',
    'master_distributor': 'Master Distributor',
    'chp_admin': 'CHP Administrator',
    'admin': 'System Administrator'
  };

  return roleMap[role.toLowerCase()] || role;
};

/**
 * Check if role can manage other roles
 */
export const canManageRole = (managerRole: string, targetRole: string): boolean => {
  return isUpperRole(managerRole, targetRole);
};

/**
 * Get roles that a user can manage
 */
export const getManagedRoles = (userRole: string): UserRole[] => {
  const userIndex = ROLE_HIERARCHY.indexOf(userRole.toLowerCase() as UserRole);
  if (userIndex === -1) return [];

  return ROLE_HIERARCHY.slice(0, userIndex);
};

/**
 * Check if user has communication privileges for a target role
 */
export const hasCommunicationPrivileges = (userRole: string, targetRole: string): boolean => {
  // Upper roles can always communicate with lower roles
  if (isUpperRole(userRole, targetRole)) {
    return true;
  }

  // Same role can communicate
  if (userRole.toLowerCase() === targetRole.toLowerCase()) {
    return true;
  }

  // Special cases for peer communication
  const peerGroups = [
    ['medical_staff', 'office_admin'], // Office staff can communicate with each other
    ['sales', 'distributor'], // Sales and distributors can communicate
  ];

  return peerGroups.some(group =>
    group.includes(userRole.toLowerCase() as UserRole) &&
    group.includes(targetRole.toLowerCase() as UserRole)
  );
};