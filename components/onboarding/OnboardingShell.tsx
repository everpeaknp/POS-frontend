"use client";

/**
 * Legacy split-card shell — prefer `OrgWizardShell` for /erp/new and onboarding.
 * Kept so older imports/docs still resolve.
 */
export {
  OrgWizardShell as OnboardingShell,
  ORG_WIZARD_STEPS,
} from "@/components/org-wizard-shell";

export function onboardingProgressIndex(step: number | string): number {
  if (step === "loading" || step === "success") return 3;
  if (typeof step === "number") return Math.min(Math.max(step, 0), 3);
  return 0;
}
