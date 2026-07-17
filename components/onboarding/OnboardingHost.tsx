"use client";

import { useOnboarding } from "@/lib/context/OnboardingContext";
import { OnboardingOverlay } from "@/components/onboarding/OnboardingOverlay";
import { ProductTour } from "@/components/onboarding/ProductTour";

/**
 * Additive host — renders overlays on top of existing routes.
 * Does not replace pages, layouts, sidebar, or dashboard content.
 */
export function OnboardingHost() {
  const { phase } = useOnboarding();

  return (
    <>
      {phase === "overlay" && <OnboardingOverlay />}
      {phase === "tour" && <ProductTour />}
    </>
  );
}
