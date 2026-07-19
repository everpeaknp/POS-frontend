"use client";

import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { UserMenuDropdown } from "@/components/shared/UserMenuDropdown";
import { useIsElectron } from "@/lib/desktop/use-is-electron";

interface DashHeaderProps {
  title: React.ReactNode;
  subtitle?: string;
  actions?: React.ReactNode;
}

/**
 * Page header for dashboard modules.
 * On Electron, bell/user live in DesktopTitleBar — keep this bar for title + page actions only.
 */
export function DashHeader({ title, subtitle, actions }: DashHeaderProps) {
  const desktop = useIsElectron();

  return (
    <header
      data-tour="topbar"
      className={`bg-card border-b border-border px-6 flex items-center justify-between sticky top-0 z-10 shadow-sm gap-4 ${
        desktop ? "py-3 min-h-[52px]" : "py-4"
      }`}
    >
      <div data-tour="topbar-title" className="min-w-0">
        <h1 className="text-lg font-medium text-foreground tracking-tight flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          {title}
        </h1>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>

      <div data-tour="topbar-actions" className="flex items-center gap-2 shrink-0">
        {actions ? <div data-tour="topbar-page-actions">{actions}</div> : null}
        {!desktop && (
          <>
            <div data-tour="topbar-theme">
              <ThemeToggle />
            </div>
            <div data-tour="topbar-notifications">
              <NotificationBell />
            </div>
            <div data-tour="topbar-user">
              <UserMenuDropdown />
            </div>
          </>
        )}
      </div>
    </header>
  );
}
