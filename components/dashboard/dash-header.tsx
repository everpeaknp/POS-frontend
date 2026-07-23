"use client";

import { CircleHelp } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAppearance } from "@/lib/context/AppearanceContext";
import { usePageTourOptional } from "@/lib/context/PageTourContext";
import { useRegisterTopbar } from "@/lib/context/TopbarContentContext";
import { useIsElectron } from "@/lib/desktop/use-is-electron";
import { cn } from "@/lib/utils";

interface DashHeaderProps {
  title: React.ReactNode;
  subtitle?: string;
  actions?: React.ReactNode;
  /** @deprecated Desktop notifications live in DesktopTitleBar only */
  showNotifications?: boolean;
}

/**
 * Page header for dashboard modules.
 * Top mode (web): title/actions merge into AppIconRail — no second bar.
 * Left mode / Electron: standalone header bar (no notification bell — title bar has it).
 */
export function DashHeader({
  title,
  subtitle,
  actions,
}: DashHeaderProps) {
  const pathname = usePathname();
  const desktop = useIsElectron();
  const { preferences } = useAppearance();
  const pageTour = usePageTourOptional();
  const mergeIntoAppBar =
    !desktop && preferences.navbar_position === "top";

  useRegisterTopbar({ title, subtitle, actions }, mergeIntoAppBar);

  // Left app-bar mode: page help sits on the secondary horizontal header (right side)
  const showPageHelp =
    !mergeIntoAppBar &&
    !desktop &&
    (pathname.startsWith("/dashboard") || pathname.startsWith("/settings")) &&
    Boolean(pageTour);

  if (mergeIntoAppBar) {
    return null;
  }

  return (
    <header
      data-tour="topbar"
      className="bg-card border-b border-border px-6 flex items-center justify-between sticky top-0 z-10 shadow-sm gap-4 h-14 min-h-14 max-h-14 overflow-hidden shrink-0"
    >
      <div
        data-tour="topbar-title"
        data-page-tour="title"
        className="min-w-0 flex-1"
      >
        <h1 className="text-base font-medium text-foreground tracking-tight flex items-baseline gap-x-2 whitespace-nowrap">
          <span className="truncate">{title}</span>
          {subtitle && (
            <span className="text-xs font-normal text-muted-foreground truncate">
              {subtitle}
            </span>
          )}
        </h1>
      </div>

      <div data-tour="topbar-actions" className="flex items-center gap-2 shrink-0 h-9">
        {actions ? (
          <div
            data-tour="topbar-page-actions"
            data-page-tour="header-actions"
            className="flex items-center h-9"
          >
            {actions}
          </div>
        ) : null}
        {showPageHelp && (
          <button
            type="button"
            data-tour="topbar-page-help"
            title="Page help"
            aria-label="Page help"
            onClick={() => {
              if (pageTour?.active) pageTour.endPageTour();
              else pageTour?.startPageTour();
            }}
            className={cn(
              "h-9 w-9 rounded-lg grid place-items-center transition-colors shrink-0",
              pageTour?.active
                ? "bg-[#22C55E]/15 text-[#22C55E] ring-1 ring-[#22C55E]/40"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <CircleHelp className="h-[18px] w-[18px]" strokeWidth={2} />
          </button>
        )}
      </div>
    </header>
  );
}
