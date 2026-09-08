"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { AppIconRail } from "@/components/layout/AppIconRail";
import { PageLoading } from "@/components/shared/PageLoading";
import { useAuth } from "@/lib/context/AuthContext";
import { useAppearance } from "@/lib/context/AppearanceContext";
import { useIsElectron } from "@/lib/desktop/use-is-electron";
import { DesktopWorkspaceProvider } from "@/lib/context/DesktopWorkspaceContext";
import { DesktopShell } from "@/components/desktop/DesktopShell";
import { DashboardWidgets } from "@/components/dashboard/DashboardWidgets";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, refreshUser } = useAuth();
  const { preferences } = useAppearance();
  const [accessChecked, setAccessChecked] = useState(false);
  // false until mount — matches SSR, then enables desktop shell
  const desktopMode = useIsElectron();
  /** Top mode: horizontal bar above content, to the right of the sidebar. */
  const railOnTop = preferences.navbar_position === "top";

  // Add global print styles for dashboard
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'dashboard-print-styles';
    style.textContent = `
      @media print {
        /* Hide all dashboard chrome elements */
        [data-sidebar],
        [data-app-icon-rail],
        [data-dashboard-widgets],
        .sidebar,
        .app-icon-rail {
          display: none !important;
          visibility: hidden !important;
        }

        /* The dashboard shell is a fixed h-screen flexbox with overflow
           clipping so the app scrolls internally on screen — printing
           needs the opposite: normal document flow so content can flow
           across multiple pages instead of being clipped to one
           screen-height. */
        html, body, .dashboard-print-flow {
          height: auto !important;
          min-height: 0 !important;
          overflow: visible !important;
          display: block !important;
        }

        /* Printed pages should always be light (dark ink-wasting
           backgrounds carried over from the on-screen dark theme are
           never wanted on paper) — the beforeprint/afterprint handlers
           below temporarily drop the .dark class so every dark: variant
           (Tailwind utilities and the CSS custom properties they use)
           reverts to its light value for the duration of the print. */
        html {
          background: #ffffff !important;
          color-scheme: light !important;
        }
      }
    `;
    if (!document.getElementById('dashboard-print-styles')) {
      document.head.appendChild(style);
    }

    // Temporarily disable dark mode for printing — Tailwind's `dark:`
    // variants are gated purely on the `.dark` class on <html>, so this is
    // the only way to revert every dark-mode override (utility classes and
    // CSS custom properties alike) at once, rather than fighting each one.
    let wasDark = false;
    const handleBeforePrint = () => {
      wasDark = document.documentElement.classList.contains('dark');
      document.documentElement.classList.remove('dark');
    };
    const handleAfterPrint = () => {
      if (wasDark) document.documentElement.classList.add('dark');
    };
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      const existingStyle = document.getElementById('dashboard-print-styles');
      if (existingStyle) {
        document.head.removeChild(existingStyle);
      }
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  // Re-fetch profile so a just-disabled membership cannot keep an open dashboard session
  useEffect(() => {
    let cancelled = false;

    const verifyOrgAccess = async () => {
      if (loading) return;
      if (!user) {
        if (!cancelled) setAccessChecked(true);
        return;
      }

      try {
        await refreshUser();
      } catch {
        // AuthContext handles refresh failures
      } finally {
        if (!cancelled) setAccessChecked(true);
      }
    };

    verifyOrgAccess();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  useEffect(() => {
    if (!loading && accessChecked && user && !user.tenant) {
      localStorage.removeItem("active_tenant_slug");
      router.replace("/erp");
    }
  }, [user, loading, accessChecked, router]);

  if (loading || !accessChecked || !user?.tenant) {
    return <PageLoading fullScreen message="Loading dashboard…" />;
  }

  // —— Web layout ——
  // Left: [AppIconRail vertical][Sidebar][content]
  // Top:  [Sidebar][horizontal AppIconRail above content]
  if (!desktopMode) {
    return (
      <div className="dashboard-print-flow flex h-screen bg-[#F3F4F6] dark:bg-background overflow-hidden">
        <div data-app-icon-rail className="print:hidden">
          {!railOnTop && <AppIconRail />}
        </div>
        <div data-sidebar className="print:hidden">
          <Sidebar />
        </div>
        <div className="dashboard-print-flow flex-1 flex flex-col min-h-0 overflow-hidden">
          <div data-app-icon-rail className="print:hidden">
            {railOnTop && <AppIconRail forceHorizontal />}
          </div>
          <div
            key={pathname}
            className="dashboard-print-flow flex flex-1 min-h-0 flex-col overflow-y-auto scrollbar-green"
          >
            {children}
          </div>
        </div>
        <div data-dashboard-widgets className="print:hidden">
          <DashboardWidgets />
        </div>
      </div>
    );
  }

  // —— Electron desktop workspace (height from DesktopRootChrome) ——
  return (
    <div className="h-full min-h-0">
      <DesktopWorkspaceProvider>
        <DesktopShell>
          <div key={pathname} className="flex flex-1 min-h-0 flex-col">
            {children}
          </div>
        </DesktopShell>
      </DesktopWorkspaceProvider>
      <div data-dashboard-widgets className="print:hidden">
        <DashboardWidgets />
      </div>
    </div>
  );
}
