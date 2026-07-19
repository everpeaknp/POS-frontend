"use client";

import { useEffect } from "react";
import { useIsElectron } from "@/lib/desktop/use-is-electron";
import { DesktopTitleBar } from "@/components/desktop/DesktopTitleBar";
import "@/components/desktop/desktop-shell.css";

/**
 * Global desktop chrome for all routes (ERP, settings, auth, dashboard).
 * Web: pass-through. Electron: full-width title bar + constrained app height.
 * Mounts chrome only after hydration to avoid SSR mismatch.
 */
export function DesktopRootChrome({ children }: { children: React.ReactNode }) {
  const desktop = useIsElectron();

  useEffect(() => {
    if (!desktop) return;
    document.documentElement.classList.add("khata-desktop");
    return () => document.documentElement.classList.remove("khata-desktop");
  }, [desktop]);

  if (!desktop) {
    return <>{children}</>;
  }

  return (
    <div className="desktop-root flex flex-col h-screen bg-background">
      <DesktopTitleBar />
      {/* overflow only on body — keep title-bar menus unclipped */}
      <div className="desktop-root-body flex-1 min-h-0 overflow-hidden flex flex-col">
        {children}
      </div>
    </div>
  );
}
