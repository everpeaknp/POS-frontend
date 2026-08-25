"use client";

import { useState, useEffect } from "react";
import { QuickActionButton } from "@/components/quick-actions/QuickActionButton";
import { SmartSearchBar } from "@/components/smart-search/SmartSearchBar";
import QuickAddBar from "@/components/quick-add/QuickAddBar";
import { useAppearance } from "@/lib/context/AppearanceContext";

/**
 * Mount point for all dashboard widgets (floating buttons, search, etc.)
 * This is a client component that only renders on the client
 * Placed in dashboard layout so it's available on all dashboard pages
 */
export function DashboardWidgets() {
  const { preferences } = useAppearance();
  const [mounted, setMounted] = useState(false);

  // Hydration safety
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const language = (preferences.language as "en" | "ne") || "en";

  return (
    <>
      {/* Quick Action Button (bottom-right) */}
      <QuickActionButton language={language} />

      {/* Smart Search Bar (triggered via Cmd+K or search icon) */}
      <SmartSearchBar language={language} />

      {/* Quick Add Transaction Bar (floating icon opens dialog) */}
      <QuickAddBar />
    </>
  );
}
