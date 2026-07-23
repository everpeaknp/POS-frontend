"use client";

import { AppIconRail } from "@/components/layout/AppIconRail";
import { useAppearance } from "@/lib/context/AppearanceContext";
import { ErpNavProvider } from "@/lib/context/ErpNavContext";
import { useIsElectron } from "@/lib/desktop/use-is-electron";

/**
 * ERP shell — AppIconRail follows appearance.navbar_position (left / top).
 */
export function ErpShell({ children }: { children: React.ReactNode }) {
  const desktop = useIsElectron();
  const { preferences } = useAppearance();
  const railOnTop = !desktop && preferences.navbar_position === "top";

  const body = desktop ? (
    <div className="erp-layout flex flex-col h-full min-h-0 bg-[#F3F4F6] dark:bg-background">
      <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-y-auto">
        {children}
      </div>
    </div>
  ) : railOnTop ? (
    <div className="erp-layout flex flex-col h-screen overflow-hidden bg-[#F3F4F6] dark:bg-background">
      <AppIconRail forceHorizontal />
      <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-y-auto">
        {children}
      </div>
    </div>
  ) : (
    <div className="erp-layout flex h-screen overflow-hidden bg-[#F3F4F6] dark:bg-background">
      <AppIconRail />
      <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-y-auto">
        {children}
      </div>
    </div>
  );

  return <ErpNavProvider>{body}</ErpNavProvider>;
}
