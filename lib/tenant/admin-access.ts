/** Whether the user can manage organization settings (modules, profile, etc.). */
export function isTenantOrgAdmin(
  tenantUserRole?: string | null,
  accountRole?: string | null
): boolean {
  const roles = [tenantUserRole, accountRole]
    .filter((role): role is string => Boolean(role))
    .map((role) => role.toLowerCase());

  return roles.some((role) => role === "admin" || role === "super_admin");
}
