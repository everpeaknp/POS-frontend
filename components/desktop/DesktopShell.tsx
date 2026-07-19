"use client";

import { useRef } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { DesktopStatusBar } from "@/components/desktop/DesktopStatusBar";
import { DesktopCommandOverlay } from "@/components/desktop/DesktopCommandOverlay";
import { DesktopHotkeys } from "@/components/desktop/DesktopHotkeys";
import { DesktopQuickActions } from "@/components/desktop/DesktopQuickActions";
import { DesktopDiagnosticsPanel } from "@/components/desktop/DesktopDiagnosticsPanel";
import { useDesktopWorkspace } from "@/lib/context/DesktopWorkspaceContext";
import "@/components/desktop/desktop-shell.css";

/**
 * Premium desktop workspace chrome.
 * Wraps existing Sidebar + page children — does not rewrite modules.
 */
export function DesktopShell({ children }: { children: React.ReactNode }) {
  const {
    enabled,
    sidebarWidth,
    sidebarCollapsed,
    setSidebarWidth,
  } = useDesktopWorkspace();
  const dragging = useRef(false);

  if (!enabled) {
    // Should not mount on web; parent gates this. Fallback = pass-through.
    return <>{children}</>;
  }

  const width = sidebarCollapsed ? 72 : sidebarWidth;

  return (
    <div className="desktop-shell flex flex-col h-full overflow-hidden bg-[#F3F4F6] dark:bg-background">
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div
          className="relative shrink-0 h-full transition-[width] duration-200 ease-out"
          style={{ width }}
          data-desktop-sidebar
          data-collapsed={sidebarCollapsed ? "true" : "false"}
        >
          <Sidebar forceDesktop compact={sidebarCollapsed} />
          {!sidebarCollapsed && (
            <div
              role="separator"
              aria-orientation="vertical"
              className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-[#22C55E]/40 z-20"
              onMouseDown={(e) => {
                e.preventDefault();
                dragging.current = true;
                const startX = e.clientX;
                const startW = sidebarWidth;
                const onMove = (ev: MouseEvent) => {
                  if (!dragging.current) return;
                  setSidebarWidth(startW + (ev.clientX - startX));
                };
                const onUp = () => {
                  dragging.current = false;
                  window.removeEventListener("mousemove", onMove);
                  window.removeEventListener("mouseup", onUp);
                };
                window.addEventListener("mousemove", onMove);
                window.addEventListener("mouseup", onUp);
              }}
            />
          )}
        </div>

        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden bg-[#F3F4F6] dark:bg-background">
          <div className="flex-1 min-h-0 min-w-0 overflow-y-auto scrollbar-green">{children}</div>
        </div>
      </div>

      <DesktopStatusBar />
      <DesktopHotkeys />
      <DesktopCommandOverlay mode="palette" />
      <DesktopCommandOverlay mode="search" />
      <DesktopQuickActions />
      <DesktopDiagnosticsPanel />
    </div>
  );
}
