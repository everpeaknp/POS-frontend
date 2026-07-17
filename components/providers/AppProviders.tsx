"use client";

import { AuthProvider } from "@/lib/context/AuthContext";
import { DateSystemProvider } from "@/lib/context/DateSystemContext";
import { AppearanceProvider } from "@/lib/context/AppearanceContext";
import { NotificationPreferencesProvider } from "@/lib/context/NotificationPreferencesContext";
import { OnboardingProvider } from "@/lib/context/OnboardingContext";
import { OnboardingHost } from "@/components/onboarding/OnboardingHost";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppearanceProvider>
        <NotificationPreferencesProvider>
          <DateSystemProvider>
            <OnboardingProvider>
              {children}
              <OnboardingHost />
            </OnboardingProvider>
          </DateSystemProvider>
        </NotificationPreferencesProvider>
      </AppearanceProvider>
    </AuthProvider>
  );
}
