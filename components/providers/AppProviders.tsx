"use client";

import { AuthProvider } from "@/lib/context/AuthContext";
import { DateSystemProvider } from "@/lib/context/DateSystemContext";
import { AppearanceProvider } from "@/lib/context/AppearanceContext";
import { NotificationPreferencesProvider } from "@/lib/context/NotificationPreferencesContext";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppearanceProvider>
        <NotificationPreferencesProvider>
          <DateSystemProvider>{children}</DateSystemProvider>
        </NotificationPreferencesProvider>
      </AppearanceProvider>
    </AuthProvider>
  );
}
