import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { permissionsApi, PermissionsMatrix } from '@/lib/api/auth';
import { isModuleActive } from '@/lib/modules/catalog';

export interface PermissionCheck {
  module: string;
  action: 'View' | 'Create' | 'Edit' | 'Delete' | 'Export' | 'Approve' | 'Invite' | 'Assign' | 'Configure';
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
  }, [user?.id, user?.tenant?.id, user?.role, user?.tenant?.active_modules?.join(',')]);

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
    return isModuleActive(user.tenant.active_modules, module.toLowerCase());
  };

  const getRoleKey = (): string | null => {
    if (!user?.role) return null;
    if (user.role === 'super_admin') return 'Admin';
    return user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase();
  };

  const toMatrixModuleKey = (module: string): string => {
    const lowerModule = module.toLowerCase();
    if (lowerModule === 'pos') return 'POS';
    if (lowerModule === 'hr') return 'HR';
    return module.charAt(0).toUpperCase() + module.slice(1).toLowerCase();
  };

  const profileModuleAllowed = (module: string, action: string): boolean => {
    if (!user) return false;
    const moduleKey = module.toLowerCase() as keyof NonNullable<typeof user.permissions>['modules'];
    const hasMod = user.permissions?.modules?.[moduleKey];
    if (hasMod) {
      if (action === 'View') return true;
      if (user.role === 'admin') return true;
      if (user.role === 'viewer') return false;
      return user.permissions?.can_edit_data ?? false;
    }
    // Core / enabled modules for admins when profile flags are incomplete
    if (user.role === 'admin' && hasModuleAccess(module)) {
      return true;
    }
    return hasModuleAccess(module) && action === 'View';
  };

  const getRolePermissions = (): Record<string, boolean> | null => {
    if (!permissions) return null;

    const roleKey = getRoleKey();
    if (roleKey && permissions[roleKey as keyof PermissionsMatrix]) {
      return permissions[roleKey as keyof PermissionsMatrix] ?? null;
    }

    // /auth/permissions/me/ returns a single-role slice — use whichever role is present
    const entries = Object.values(permissions).filter(
      (value): value is Record<string, boolean> =>
        Boolean(value) && typeof value === 'object'
    );
    return entries[0] ?? null;
  };

  const hasPermission = (module: string, action: string): boolean => {
    if (!user?.role) return false;
    if (!hasModuleAccess(module)) return false;

    if (user.role === 'admin' || user.role === 'super_admin') {
      return true;
    }

    const rolePermissions = getRolePermissions();
    if (!rolePermissions) {
      return profileModuleAllowed(module, action);
    }

    const permissionKey = `${toMatrixModuleKey(module)}-${action}`;
    const allowed = rolePermissions[permissionKey];
    if (allowed === true) return true;
    if (allowed === false) return false;

    return profileModuleAllowed(module, action);
  };

  const canView = (module: string) => {
    if (!hasModuleAccess(module)) return false;
    if (loading) {
      return profileModuleAllowed(module, 'View');
    }
    return hasPermission(module, 'View');
  };

  const canCreate = (module: string) => hasPermission(module, 'Create');
  const canEdit = (module: string) => hasPermission(module, 'Edit');
  const canDelete = (module: string) => hasPermission(module, 'Delete');
  const canExport = (module: string) => hasPermission(module, 'Export');
  const canInviteUsers = () =>
    hasPermission('settings', 'Edit') || hasPermission('hr', 'Invite');
  const canAssignRoles = () =>
    hasPermission('settings', 'Edit') || hasPermission('hr', 'Assign');
  const canConfigurePermissions = () =>
    hasPermission('settings', 'Edit') || hasPermission('hr', 'Configure');

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
    canInviteUsers,
    canAssignRoles,
    canConfigurePermissions,
    reload: loadPermissions,
  };
}
