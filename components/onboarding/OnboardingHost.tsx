"use client";

import { useOnboarding } from "@/lib/context/OnboardingContext";
import { usePageTourOptional } from "@/lib/context/PageTourContext";
import { OnboardingOverlay } from "@/components/onboarding/OnboardingOverlay";
import { ProductTour } from "@/components/onboarding/ProductTour";
import { PageTour } from "@/components/onboarding/PageTour";

/**
 * Additive host — renders overlays on top of existing routes.
 * Does not replace pages, layouts, sidebar, or dashboard content.
 */
export function OnboardingHost() {
  const { phase } = useOnboarding();
  const pageTour = usePageTourOptional();

  return (
    <>
      {phase === "overlay" && <OnboardingOverlay />}
      {phase === "tour" && <ProductTour />}
      {pageTour?.active && <PageTour />}
    </>
  );
}
