/** Whether the user can manage organization settings (members, profile, etc.). */
export function isTenantOrgAdmin(tenantUserRole?: string | null): boolean {
  if (!tenantUserRole) return false;
  const role = tenantUserRole.toLowerCase();
  return role === 'admin' || role === 'super_admin';
}
