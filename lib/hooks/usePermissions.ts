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
    if (!user) {
      setPermissions(null);
      setLoading(false);
      return;
    }

    loadPermissions();
  }, [user?.id, user?.tenant?.id, user?.role]);

  const loadPermissions = async () => {
    if (!user) {
      setPermissions(null);
      setLoading(false);
      return;
    }

    // No org selected yet — skip API call
    if (!user.tenant) {
      setPermissions(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await permissionsApi.getMyPermissions();
      setPermissions(data);
    } catch (error: unknown) {
      const err = error as { response?: { status?: number } };
      if (err?.response?.status === 403 || err?.response?.status === 401 || err?.response?.status === 400) {
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

    const normalizedModule = module.toLowerCase();
    const activeModules = user.tenant.active_modules || [];

    return activeModules.some(m => m.toLowerCase() === normalizedModule);
  };

  const getRoleKey = (): string | null => {
    if (!user?.role) return null;
    return user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase();
  };

  const hasPermission = (module: string, action: string): boolean => {
    if (!user?.role) return false;
    if (!hasModuleAccess(module)) return false;

    const roleKey = getRoleKey();
    if (!roleKey) return false;

    // Use profile module flags as fallback when matrix is unavailable
    if (!permissions || !(roleKey in permissions)) {
      const moduleKey = module.toLowerCase() as keyof NonNullable<typeof user.permissions>['modules'];
      const hasMod = user.permissions?.modules?.[moduleKey];
      if (!hasMod) return false;
      if (action === 'View') return true;
      if (user.role === 'admin') return true;
      if (user.role === 'viewer') return false;
      return user.permissions?.can_edit_data ?? false;
    }

    let moduleKey: string;
    const lowerModule = module.toLowerCase();
    if (lowerModule === 'pos') {
      moduleKey = 'POS';
    } else if (lowerModule === 'hr') {
      moduleKey = 'HR';
    } else {
      moduleKey = module.charAt(0).toUpperCase() + module.slice(1).toLowerCase();
    }

    const rolePermissions = permissions[roleKey as keyof PermissionsMatrix];
    if (!rolePermissions) return false;

    const permissionKey = `${moduleKey}-${action}`;
    return rolePermissions[permissionKey] === true;
  };

  const canView = (module: string) => {
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
