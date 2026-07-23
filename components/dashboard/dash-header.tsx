"use client";

import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { useAppearance } from "@/lib/context/AppearanceContext";
import { useRegisterTopbar } from "@/lib/context/TopbarContentContext";
import { useIsElectron } from "@/lib/desktop/use-is-electron";

interface DashHeaderProps {
  title: React.ReactNode;
  subtitle?: string;
  actions?: React.ReactNode;
  showNotifications?: boolean;
}

/**
 * Page header for dashboard modules.
 * Top mode (web): title/actions merge into AppIconRail — no second bar.
 * Left mode / Electron: standalone header bar.
 */
export function DashHeader({
  title,
  subtitle,
  actions,
  showNotifications = true,
}: DashHeaderProps) {
  const desktop = useIsElectron();
  const { preferences } = useAppearance();
  const mergeIntoAppBar =
    !desktop && preferences.navbar_position === "top";

  useRegisterTopbar({ title, subtitle, actions }, mergeIntoAppBar);

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
        {desktop && showNotifications && (
          <div data-tour="topbar-notifications">
            <NotificationBell />
          </div>
        )}
      </div>
    </header>
  );
}
