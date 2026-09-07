/**
 * Each workplace type's dedicated dashboard route, so entering the app after
 * onboarding/tour lands directly on it instead of the generic `/dashboard`
 * (which then has to client-redirect there anyway). Mirrors the same
 * account_type/business_type checks as app/dashboard/page.tsx's redirect
 * and nav-items.ts's isKirana — business_type is checked too only for older
 * tenants predating the account_type field.
 *
 * Single source of truth: both OnboardingContext (navigating into the tour)
 * and tour-steps (building each step's target route) must agree, or the
 * tour's routes point at a URL the dashboard immediately redirects away
 * from, breaking every step.
 */
export function getHomeRoute(
  tenant: { account_type?: string | null; business_type?: string | null } | null | undefined
): string {
  const accountType = tenant?.account_type;
  const businessType = tenant?.business_type;
  if (accountType === "personal") return "/dashboard/finance";
  if (accountType === "construction") return "/dashboard/construction";
  if (accountType === "hardware") return "/dashboard/hardware";
  if (accountType === "retail" || businessType === "kirana" || businessType === "retail") {
    return "/dashboard/retail";
  }
  return "/dashboard";
}
