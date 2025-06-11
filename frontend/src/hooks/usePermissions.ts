import { useState, useEffect } from 'react';

interface Permission {
  id: string;
  name: string;
  display_name: string;
  description: string;
  resource: string;
  action: string;
  is_active: boolean;
}

interface UsePermissionsReturn {
  hasPermission: (permissionName: string) => boolean;
  permissions: Permission[];
  loading: boolean;
  checkPermission: (permissionName: string) => Promise<boolean>;
}

export const usePermissions = (): UsePermissionsReturn => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserPermissions();
  }, []);

  const loadUserPermissions = async () => {
    try {
      const response = await fetch('/api/v1/permissions/my-permissions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPermissions(data.permissions || []);
      } else {
        // Fallback to default permissions for doctors
        const defaultPermissions = [
          {
            id: 'create_orders',
            name: 'create_orders',
            display_name: 'Create Orders',
            description: 'Place orders for wound care products after IVR approval',
            resource: 'orders',
            action: 'create',
            is_active: true
          },
          {
            id: 'view_orders',
            name: 'view_orders',
            display_name: 'View Orders',
            description: 'Track order status and shipments',
            resource: 'orders',
            action: 'read',
            is_active: true
          }
        ];
        setPermissions(defaultPermissions);
      }
    } catch (error) {
      console.error('Error loading permissions:', error);
      // Use default permissions as fallback
      const defaultPermissions = [
        {
          id: 'create_orders',
          name: 'create_orders',
          display_name: 'Create Orders',
          description: 'Place orders for wound care products after IVR approval',
          resource: 'orders',
          action: 'create',
          is_active: true
        }
      ];
      setPermissions(defaultPermissions);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permissionName: string): boolean => {
    return permissions.some(p => p.name === permissionName || p.id === permissionName);
  };

  const checkPermission = async (permissionName: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/v1/permissions/check-permission', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ permission_name: permissionName })
      });

      if (response.ok) {
        const data = await response.json();
        return data.has_permission;
      }
    } catch (error) {
      console.error('Error checking permission:', error);
    }

    // Fallback to local check
    return hasPermission(permissionName);
  };

  return {
    hasPermission,
    permissions,
    loading,
    checkPermission
  };
};