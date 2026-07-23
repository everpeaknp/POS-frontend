"use client";

import { AuthProvider } from "@/lib/context/AuthContext";
import { DateSystemProvider } from "@/lib/context/DateSystemContext";
import { AppearanceProvider } from "@/lib/context/AppearanceContext";
import { NotificationPreferencesProvider } from "@/lib/context/NotificationPreferencesContext";
import { OnboardingProvider } from "@/lib/context/OnboardingContext";
import { PageTourProvider } from "@/lib/context/PageTourContext";
import { OnboardingHost } from "@/components/onboarding/OnboardingHost";
import { DesktopOfflineBootstrap } from "@/components/desktop/DesktopOfflineBootstrap";
import { DesktopSecurityBootstrap } from "@/components/desktop/DesktopSecurityBootstrap";
import { DesktopRootChrome } from "@/components/desktop/DesktopRootChrome";
import { TopbarContentProvider } from "@/lib/context/TopbarContentContext";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppearanceProvider>
        <NotificationPreferencesProvider>
          <DateSystemProvider>
            <OnboardingProvider>
              <PageTourProvider>
                <TopbarContentProvider>
                  <DesktopRootChrome>
                    {children}
                    <OnboardingHost />
                    <DesktopOfflineBootstrap />
                    <DesktopSecurityBootstrap />
                  </DesktopRootChrome>
                </TopbarContentProvider>
              </PageTourProvider>
            </OnboardingProvider>
          </DateSystemProvider>
        </NotificationPreferencesProvider>
      </AppearanceProvider>
    </AuthProvider>
  );
}
