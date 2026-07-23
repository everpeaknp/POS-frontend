"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Minus, Maximize2, Minimize2, X, Search, CircleHelp } from "lucide-react";
import { getDesktopApi, getDesktopPlatform } from "@/lib/desktop";
import { useIsElectron } from "@/lib/desktop/use-is-electron";
import { useDesktopWorkspaceOptional } from "@/lib/context/DesktopWorkspaceContext";
import { titleForPath } from "@/lib/desktop/navigation-catalog";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { UserMenuDropdown } from "@/components/shared/UserMenuDropdown";
import { useAuth } from "@/lib/context/AuthContext";
import { usePageTourOptional } from "@/lib/context/PageTourContext";
import { cn } from "@/lib/utils";

/**
 * Full-width desktop title bar (global — used by DesktopRootChrome).
 * Windows: native titleBarOverlay for min/max/close; bar fills the drag region.
 */
export function DesktopTitleBar() {
  const api = getDesktopApi();
  const ws = useDesktopWorkspaceOptional();
  const { user } = useAuth();
  const pathname = usePathname() || "/";
  const desktop = useIsElectron();
  const pageTour = usePageTourOptional();
  const [maximized, setMaximized] = useState(false);

  const platform = getDesktopPlatform();
  const isMac = platform === "darwin";
  const isWin = platform === "win32";
  const showCustomControls = Boolean(api) && !isMac && !isWin;
  const inDashboard = pathname.startsWith("/dashboard");
  const inSettings = pathname.startsWith("/settings");
  const title = titleForPath(ws?.activeHref || pathname);
  const org = user?.tenant?.name;
  const showWorkspaceSearch = Boolean(ws?.enabled && inDashboard);
  const showPageHelp = (inDashboard || inSettings) && Boolean(pageTour);

  const refreshMax = useCallback(async () => {
    if (!api) return;
    setMaximized(await api.window.isMaximized());
  }, [api]);

  useEffect(() => {
    void refreshMax();
    const t = window.setInterval(() => void refreshMax(), 800);
    return () => window.clearInterval(t);
  }, [refreshMax]);

  if (!desktop) return null;

  return (
    <header
      className="desktop-titlebar shrink-0 flex items-center select-none text-white border-b border-white/10 z-[100] overflow-visible"
      style={
        {
          WebkitAppRegion: "drag",
          height: "env(titlebar-area-height, 40px)",
          minHeight: 40,
          background: "#1E2A3B",
        } as React.CSSProperties
      }
      onDoubleClick={() => {
        if (!isMac && api) void api.window.maximizeToggle().then(refreshMax);
      }}
    >
      <div
        className={`flex items-center gap-2.5 min-w-0 flex-1 h-full ${isMac ? "pl-[78px]" : "pl-3"}`}
      >
        <div className="h-5 w-5 rounded-[5px] bg-[#22C55E] grid place-items-center text-[10px] font-bold text-white shrink-0 shadow-sm">
          K
        </div>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[12px] font-semibold tracking-tight shrink-0">Khata</span>
          {org && inDashboard && (
            <>
              <span className="text-white/25 text-[11px] shrink-0">·</span>
              <span className="text-[11px] text-white/55 truncate max-w-[140px]">{org}</span>
            </>
          )}
          <span className="text-white/25 text-[11px] shrink-0">/</span>
          <span className="text-[11px] text-white/80 truncate">{title}</span>
        </div>
      </div>

      <div
        className="flex items-center gap-0.5 h-full shrink-0"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        {showWorkspaceSearch && (
          <button
            type="button"
            title="Search (Ctrl+K)"
            className="h-7 px-2.5 rounded-md inline-flex items-center gap-1.5 text-[11px] text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            onClick={() => ws?.setSearchOpen(true)}
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">Search</span>
          </button>
        )}

        <div className="desktop-titlebar-actions flex items-center pl-0.5">
          {showPageHelp && (
            <button
              type="button"
              title="Page help"
              aria-label="Page help"
              className={cn(
                "h-7 w-7 rounded-md grid place-items-center transition-colors",
                pageTour?.active
                  ? "text-[#22C55E] bg-white/10"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              )}
              onClick={() => {
                if (pageTour?.active) pageTour.endPageTour();
                else pageTour?.startPageTour();
              }}
            >
              <CircleHelp className="h-3.5 w-3.5" />
            </button>
          )}
          <ThemeToggle />
          <NotificationBell />
          <UserMenuDropdown showUserDetails={false} />
        </div>

        {isWin && (
          <div
            className="shrink-0 h-full"
            style={{
              width:
                "max(138px, calc(100vw - env(titlebar-area-width, 100vw) - env(titlebar-area-x, 0px)))",
            }}
            aria-hidden
          />
        )}

        {showCustomControls && (
          <div className="flex items-stretch h-full">
            <button
              type="button"
              aria-label="Minimize"
              className="w-11 h-full grid place-items-center hover:bg-white/10 transition-colors"
              onClick={() => void api?.window.minimize()}
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-label={maximized ? "Restore" : "Maximize"}
              className="w-11 h-full grid place-items-center hover:bg-white/10 transition-colors"
              onClick={() => void api?.window.maximizeToggle().then(refreshMax)}
            >
              {maximized ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
            </button>
            <button
              type="button"
              aria-label="Close"
              className="w-11 h-full grid place-items-center hover:bg-red-500 transition-colors"
              onClick={() => void api?.window.close()}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
