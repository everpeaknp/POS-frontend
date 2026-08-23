"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { useDateSystemStore } from "@/lib/stores/dateSystemStore";
import type { DateCalendarSystem } from "@/lib/dates";

interface DateSystemContextValue {
  dateSystem: DateCalendarSystem;
  setDateSystem: (system: DateCalendarSystem) => Promise<void>;
  loading: boolean;
  formatDate: (value: string | Date | null | undefined, fallback?: string) => string;
  formatDateTime: (value: string | Date | null | undefined, fallback?: string) => string;
}

// Legacy hook for backward compatibility - now uses Zustand store
export function useDateSystem(): DateSystemContextValue {
  const { user } = useAuth();
  const { dateSystem, loading, setDateSystem: setStoreSystem, formatDate, formatDateTime } = useDateSystemStore();

  const setDateSystem = async (system: DateCalendarSystem) => {
    await setStoreSystem(system, user?.id);
  };

  return {
    dateSystem,
    setDateSystem,
    loading,
    formatDate,
    formatDateTime,
  };
}

// Provider initializes Zustand store with user preferences
export function DateSystemProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const loadDateSystem = useDateSystemStore((state) => state.loadDateSystem);
  const initialized = useDateSystemStore((state) => state.initialized);

  useEffect(() => {
    if (authLoading) return;
    
    // Load date system from backend when user is available
    if (user?.id && !initialized) {
      loadDateSystem(user.id);
    } else if (!user && !initialized) {
      // Mark as initialized even without user (will use localStorage or default)
      loadDateSystem();
    }
  }, [user?.id, authLoading, initialized, loadDateSystem]);

  return <>{children}</>;
}
