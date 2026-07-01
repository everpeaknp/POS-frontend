"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { userApi } from "@/lib/api/user";
import {
  DATE_SYSTEM_STORAGE_KEY,
  type DateCalendarSystem,
  formatDisplayDate,
  formatDisplayDateTime,
} from "@/lib/dates";

interface DateSystemContextValue {
  dateSystem: DateCalendarSystem;
  setDateSystem: (system: DateCalendarSystem) => Promise<void>;
  loading: boolean;
  formatDate: (value: string | Date | null | undefined, fallback?: string) => string;
  formatDateTime: (value: string | Date | null | undefined, fallback?: string) => string;
}

const DateSystemContext = createContext<DateSystemContextValue | undefined>(undefined);

function readStoredDateSystem(): DateCalendarSystem {
  if (typeof window === "undefined") return "AD";
  const stored = localStorage.getItem(DATE_SYSTEM_STORAGE_KEY);
  return stored === "BS" ? "BS" : "AD";
}

function writeStoredDateSystem(system: DateCalendarSystem) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DATE_SYSTEM_STORAGE_KEY, system);
}

export function DateSystemProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [dateSystem, setDateSystemState] = useState<DateCalendarSystem>("AD");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (authLoading) return;

      if (!user) {
        if (!cancelled) {
          setDateSystemState(readStoredDateSystem());
          setLoading(false);
        }
        return;
      }

      try {
        const prefs = await userApi.getAppearancePreferences();
        const system: DateCalendarSystem =
          prefs.date_calendar_system === "BS" ? "BS" : "AD";
        if (!cancelled) {
          setDateSystemState(system);
          writeStoredDateSystem(system);
        }
      } catch {
        if (!cancelled) {
          setDateSystemState(readStoredDateSystem());
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  const setDateSystem = useCallback(
    async (system: DateCalendarSystem) => {
      setDateSystemState(system);
      writeStoredDateSystem(system);

      if (user) {
        try {
          await userApi.updateAppearancePreferences({ date_calendar_system: system });
        } catch (error) {
          console.error("Failed to save date system preference:", error);
          throw error;
        }
      }
    },
    [user]
  );

  const formatDate = useCallback(
    (value: string | Date | null | undefined, fallback?: string) =>
      formatDisplayDate(value, dateSystem, { fallback }),
    [dateSystem]
  );

  const formatDateTime = useCallback(
    (value: string | Date | null | undefined, fallback?: string) =>
      formatDisplayDateTime(value, dateSystem, { fallback }),
    [dateSystem]
  );

  const value = useMemo(
    () => ({
      dateSystem,
      setDateSystem,
      loading,
      formatDate,
      formatDateTime,
    }),
    [dateSystem, setDateSystem, loading, formatDate, formatDateTime]
  );

  return <DateSystemContext.Provider value={value}>{children}</DateSystemContext.Provider>;
}

export function useDateSystem() {
  const context = useContext(DateSystemContext);
  if (!context) {
    throw new Error("useDateSystem must be used within DateSystemProvider");
  }
  return context;
}
