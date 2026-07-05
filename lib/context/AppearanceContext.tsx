"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { userApi } from "@/lib/api/user";
import type { AppearancePreferences } from "@/lib/types/user";

type AppearanceContextValue = {
  preferences: AppearancePreferences | null;
  loading: boolean;
  refresh: () => Promise<void>;
  updatePreferences: (data: Partial<AppearancePreferences>) => Promise<void>;
};

const defaultPreferences: AppearancePreferences = {
  theme: "light",
  language: "en-US",
  timezone: "UTC",
  date_calendar_system: "AD",
  compact_mode: false,
  smooth_animations: true,
};

const AppearanceContext = createContext<AppearanceContextValue | undefined>(undefined);

function applyTheme(theme: AppearancePreferences["theme"]) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = theme === "dark" || (theme === "system" && prefersDark);
  root.classList.toggle("dark", isDark);
  root.dataset.compact = "false";
}

function applyCompactMode(compact: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.compact = compact ? "true" : "false";
}

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<AppearancePreferences | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const prefs = await userApi.getAppearancePreferences();
      setPreferences(prefs);
      applyTheme(prefs.theme);
      applyCompactMode(prefs.compact_mode);
    } catch {
      setPreferences(defaultPreferences);
      applyTheme(defaultPreferences.theme);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setLoading(false);
      return;
    }
    refresh();
  }, []);

  const updatePreferences = async (data: Partial<AppearancePreferences>) => {
    const updated = await userApi.updateAppearancePreferences(data);
    setPreferences(updated);
    if (data.theme !== undefined) applyTheme(updated.theme);
    if (data.compact_mode !== undefined) applyCompactMode(updated.compact_mode);
  };

  return (
    <AppearanceContext.Provider value={{ preferences, loading, refresh, updatePreferences }}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (!context) {
    throw new Error("useAppearance must be used within AppearanceProvider");
  }
  return context;
}
