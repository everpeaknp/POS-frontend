"use client";

import { useEffect } from "react";
import apiClient from "@/lib/api/client";
import { applyAppearancePreferences, defaultAppearancePreferences } from "@/lib/theme";
import type { AppearancePreferences } from "@/lib/types/user";

type DefaultAppearanceResponse = Pick<
  AppearancePreferences,
  | "theme"
  | "navbar_position"
  | "accent_color"
  | "sidebar_color"
  | "navbar_color"
  | "border_radius"
  | "compact_mode"
  | "smooth_animations"
  | "high_contrast"
>;

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // The cached "khata-appearance" entry is never cleared on logout, so a
    // browser that's ever logged in keeps showing that stale snapshot here
    // forever after — including whatever the accent was *before* an admin
    // later changed the platform default. Only an actually signed-in
    // visitor (e.g. mid-redirect through an /auth page) should keep their
    // own theme; every anonymous visit should reflect the live admin
    // default instead of a leftover local cache.
    const isAuthenticated =
      typeof window !== "undefined" && !!localStorage.getItem("access_token");
    if (isAuthenticated) return;

    let cancelled = false;
    apiClient
      .get<DefaultAppearanceResponse>("/setting/default-appearance/")
      .then(({ data }) => {
        if (cancelled) return;
        applyAppearancePreferences({ ...defaultAppearancePreferences, ...data });
      })
      .catch(() => {
        // No admin-configured defaults reachable — keep the built-in
        // fallback colors already baked into these pages.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return <>{children}</>;
}
