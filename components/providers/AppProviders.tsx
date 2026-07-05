"use client";

import { AuthProvider } from "@/lib/context/AuthContext";
import { DateSystemProvider } from "@/lib/context/DateSystemContext";
import { AppearanceProvider } from "@/lib/context/AppearanceContext";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppearanceProvider>
        <DateSystemProvider>{children}</DateSystemProvider>
      </AppearanceProvider>
    </AuthProvider>
  );
}
