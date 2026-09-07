"use client";

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useState } from "react";
import { userApi } from "@/lib/api/user";
import type { AppearancePreferences } from "@/lib/types/user";
import {
  APPEARANCE_STORAGE_KEY,
  AUTH_LOGIN_EVENT,
  applyAppearancePreferences,
  applyCachedAppearancePreferences,
  cacheAppearancePreferences,
  defaultAppearancePreferences,
  resolveIsDark,
} from "@/lib/theme";

type AppearanceContextValue = {
  preferences: AppearancePreferences;
  loading: boolean;
  isDark: boolean;
  refresh: () => Promise<void>;
  updatePreferences: (data: Partial<AppearancePreferences>) => Promise<void>;
};

const AppearanceContext = createContext<AppearanceContextValue | undefined>(undefined);

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<AppearancePreferences>(defaultAppearancePreferences);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);

  const syncResolvedTheme = useCallback((prefs: AppearancePreferences) => {
    applyAppearancePreferences(prefs);
    setIsDark(resolveIsDark(prefs.theme));
  }, []);

  const refresh = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      applyCachedAppearancePreferences();
      setPreferences(readCachedOrDefault());
      setIsDark(resolveIsDark(readCachedOrDefault().theme));
      setLoading(false);
      return;
    }

    try {
      const prefs = await userApi.getAppearancePreferences();
      setPreferences(prefs);
      cacheAppearancePreferences(prefs);
      syncResolvedTheme(prefs);
    } catch {
      const cached = readCachedOrDefault();
      setPreferences(cached);
      syncResolvedTheme(cached);
    } finally {
      setLoading(false);
    }
  }, [syncResolvedTheme]);

  // useLayoutEffect (not useEffect) so the cached preferences replace the
  // hardcoded default BEFORE the browser paints — otherwise layout that
  // depends on this state (e.g. ErpShell's horizontal/vertical nav, which
  // differs per user) always paints the default position first and visibly
  // flips once this ran, even though the cached value was available
  // synchronously. Safe for SSR/hydration: this never runs on the server, so
  // the server-rendered HTML and the client's first hydration pass both still
  // use the same default — this only moves the *correction* earlier within
  // the client-only timeline, before paint instead of after it.
  useLayoutEffect(() => {
    const cached = readCachedOrDefault();
    setPreferences(cached);
    applyCachedAppearancePreferences();
    setIsDark(resolveIsDark(cached.theme));
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onAuthLogin = () => {
      void refresh();
    };
    window.addEventListener(AUTH_LOGIN_EVENT, onAuthLogin);
    return () => window.removeEventListener(AUTH_LOGIN_EVENT, onAuthLogin);
  }, [refresh]);

  // The `storage` event fires in *other* same-origin browsing contexts
  // (other tabs, or an <iframe> like the appearance settings' live preview)
  // when localStorage changes here — lets those windows pick up a new
  // theme/accent pick instantly without needing their own save round-trip.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== APPEARANCE_STORAGE_KEY) return;
      const next = readCachedOrDefault();
      setPreferences(next);
      syncResolvedTheme(next);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [syncResolvedTheme]);

  useEffect(() => {
    if (preferences.theme !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      syncResolvedTheme(preferences);
    };

    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [preferences, syncResolvedTheme]);

  const updatePreferences = async (data: Partial<AppearancePreferences>) => {
    const previous = preferences;
    const optimistic = { ...preferences, ...data };
    setPreferences(optimistic);
    cacheAppearancePreferences(optimistic);
    syncResolvedTheme(optimistic);

    try {
      const updated = await userApi.updateAppearancePreferences(data);
      setPreferences(updated);
      cacheAppearancePreferences(updated);
      syncResolvedTheme(updated);
    } catch (error) {
      setPreferences(previous);
      cacheAppearancePreferences(previous);
      syncResolvedTheme(previous);
      throw error;
    }
  };

  return (
    <AppearanceContext.Provider value={{ preferences, loading, isDark, refresh, updatePreferences }}>
      {children}
    </AppearanceContext.Provider>
  );
}

function readCachedOrDefault(): AppearancePreferences {
  if (typeof window === "undefined") return defaultAppearancePreferences;
  try {
    const raw = localStorage.getItem("khata-appearance");
    if (!raw) return defaultAppearancePreferences;
    return { ...defaultAppearancePreferences, ...JSON.parse(raw) };
  } catch {
    return defaultAppearancePreferences;
  }
}

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (!context) {
    throw new Error("useAppearance must be used within AppearanceProvider");
  }
  return context;
}
