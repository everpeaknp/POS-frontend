import type { Tenant } from "@/lib/api/tenant";
import type { Organization } from "@/lib/types";
import { getMediaUrl } from "@/lib/utils";

export function mapTenantToOrganization(tenant: Tenant, userId?: number): Organization {
  return {
    id: tenant.id.toString(),
    slug: tenant.slug,
    name: tenant.name,
    subdomain: `${tenant.slug}.khata.app`,
    icon: tenant.name.charAt(0).toUpperCase(),
    logo: getMediaUrl(tenant.logo) || undefined,
    trialDaysLeft: 0,
    status: tenant.is_active ? "active" : "expired",
    user_role: tenant.user_role,
    workspace_name: tenant.workspace_name,
    created_by: tenant.created_by,
    can_delete: tenant.user_role === "super_admin" || tenant.created_by === userId,
    active_modules: tenant.active_modules ?? [],
  };
}
