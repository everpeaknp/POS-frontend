"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { userApi } from "@/lib/api/user";
import type { NotificationPreferences } from "@/lib/types/user";
import { AUTH_LOGIN_EVENT } from "@/lib/theme";

export const defaultNotificationPreferences: NotificationPreferences = {
  email_order_updates: true,
  email_payment_reminders: true,
  email_inventory_alerts: true,
  email_team_activity: true,
  push_desktop: false,
  push_mobile: false,
  push_sound: false,
  login_alerts: true,
  security_log_exports: false,
};

const CACHE_KEY = "khata-notification-preferences";

type NotificationPreferencesContextValue = {
  preferences: NotificationPreferences;
  loading: boolean;
  savingKey: keyof NotificationPreferences | null;
  refresh: () => Promise<void>;
  updatePreferences: (
    data: Partial<NotificationPreferences>
  ) => Promise<NotificationPreferences>;
};

const NotificationPreferencesContext = createContext<
  NotificationPreferencesContextValue | undefined
>(undefined);

function readCachedOrDefault(): NotificationPreferences {
  if (typeof window === "undefined") return defaultNotificationPreferences;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return defaultNotificationPreferences;
    return { ...defaultNotificationPreferences, ...JSON.parse(raw) };
  } catch {
    return defaultNotificationPreferences;
  }
}

function cacheNotificationPreferences(prefs: NotificationPreferences) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CACHE_KEY, JSON.stringify(prefs));
}

export function NotificationPreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    defaultNotificationPreferences
  );
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<keyof NotificationPreferences | null>(null);

  const refresh = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setPreferences(readCachedOrDefault());
      setLoading(false);
      return;
    }

    try {
      const prefs = await userApi.getNotificationPreferences();
      setPreferences(prefs);
      cacheNotificationPreferences(prefs);
    } catch (error) {
      setPreferences(readCachedOrDefault());
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPreferences(readCachedOrDefault());
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onAuthLogin = () => {
      void refresh();
    };
    window.addEventListener(AUTH_LOGIN_EVENT, onAuthLogin);
    return () => window.removeEventListener(AUTH_LOGIN_EVENT, onAuthLogin);
  }, [refresh]);

  const updatePreferences = async (data: Partial<NotificationPreferences>) => {
    const previous = preferences;
    const optimistic = { ...preferences, ...data };
    const changedKey = Object.keys(data)[0] as keyof NotificationPreferences | undefined;

    setPreferences(optimistic);
    cacheNotificationPreferences(optimistic);
    if (changedKey) setSavingKey(changedKey);

    try {
      const updated = await userApi.updateNotificationPreferences(data);
      setPreferences(updated);
      cacheNotificationPreferences(updated);
      return updated;
    } catch (error) {
      setPreferences(previous);
      cacheNotificationPreferences(previous);
      throw error;
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <NotificationPreferencesContext.Provider
      value={{ preferences, loading, savingKey, refresh, updatePreferences }}
    >
      {children}
    </NotificationPreferencesContext.Provider>
  );
}

export function useNotificationPreferences() {
  const context = useContext(NotificationPreferencesContext);
  if (!context) {
    throw new Error(
      "useNotificationPreferences must be used within NotificationPreferencesProvider"
    );
  }
  return context;
}
