import type { Tenant } from "@/lib/api/tenant";

/**
 * Determines if a tenant is a personal account based on active modules.
 * Personal accounts have the personal_finance module and typically don't have
 * business modules like sales, purchase, etc.
 */
export function isPersonalAccount(tenant: Tenant | null | undefined): boolean {
  if (!tenant) return false;
  const modules = tenant.active_modules || [];
  return modules.includes("personal_finance");
}

/**
 * Gets the account type for display purposes
 */
export function getAccountType(tenant: Tenant | null | undefined): "personal" | "organization" {
  return isPersonalAccount(tenant) ? "personal" : "organization";
}
