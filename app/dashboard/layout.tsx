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
      <div className="flex h-screen bg-[#F3F4F6] dark:bg-background overflow-hidden">
        {!railOnTop && <AppIconRail />}
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {railOnTop && <AppIconRail forceHorizontal />}
          <div
            key={pathname}
            className="flex flex-1 min-h-0 flex-col overflow-y-auto scrollbar-green"
          >
            {children}
          </div>
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
    </div>
  );
}
