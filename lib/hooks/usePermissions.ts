import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { permissionsApi, PermissionsMatrix } from '@/lib/api/auth';

export interface PermissionCheck {
  module: string;
  action: 'View' | 'Create' | 'Edit' | 'Delete' | 'Export' | 'Approve';
}

export function usePermissions() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<PermissionsMatrix | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      const data = await permissionsApi.getPermissions();
      setPermissions(data);
    } catch (error: any) {
      // Silently handle permission errors - not all users can access the permissions API
      // Only admins and managers can view the full permissions matrix
      if (error?.response?.status === 403 || error?.response?.status === 401) {
        // User doesn't have permission to view permissions matrix - this is expected for non-admin users
        setPermissions(null);
      } else {
        console.error('Failed to load permissions:', error);
        setPermissions(null);
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if the tenant has access to a specific module
   */
  const hasModuleAccess = (module: string): boolean => {
    if (!user?.tenant) return false;
    
    // Normalize module name to lowercase for comparison
    const normalizedModule = module.toLowerCase();
    const activeModules = user.tenant.active_modules || [];
    
    // Check if module is in tenant's active modules
    return activeModules.some(m => m.toLowerCase() === normalizedModule);
  };

  const hasPermission = (module: string, action: string): boolean => {
    if (!user?.role || !permissions) return false;

    // First check if tenant has access to this module
    if (!hasModuleAccess(module)) return false;

    // Capitalize role to match permissions matrix keys (e.g., "admin" -> "Admin")
    const roleKey = user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase();

    // Check if role exists in permissions matrix
    if (!(roleKey in permissions)) return false;

    // Capitalize module to match permissions matrix keys
    // Special case: 'pos' -> 'POS', 'hr' -> 'HR' (acronyms are all caps)
    let moduleKey: string;
    const lowerModule = module.toLowerCase();
    if (lowerModule === 'pos') {
      moduleKey = 'POS';
    } else if (lowerModule === 'hr') {
      moduleKey = 'HR';
    } else {
      // Regular capitalization: "sales" -> "Sales"
      moduleKey = module.charAt(0).toUpperCase() + module.slice(1).toLowerCase();
    }

    // Check specific permission (e.g., "Sales-View", "POS-View")
    const rolePermissions = permissions[roleKey as keyof PermissionsMatrix];
    const permissionKey = `${moduleKey}-${action}`;
    
    return rolePermissions[permissionKey] === true;
  };

  const canView = (module: string) => {
    // For viewing, we only need to check if tenant has module access
    // Role-based permissions are checked by hasPermission
    if (!hasModuleAccess(module)) return false;
    return hasPermission(module, 'View');
  };
  
  const canCreate = (module: string) => hasPermission(module, 'Create');
  const canEdit = (module: string) => hasPermission(module, 'Edit');
  const canDelete = (module: string) => hasPermission(module, 'Delete');
  const canExport = (module: string) => hasPermission(module, 'Export');

  return {
    permissions,
    loading,
    hasPermission,
    hasModuleAccess,
    canView,
    canCreate,
    canEdit,
    canDelete,
    canExport,
    reload: loadPermissions,
  };
}
