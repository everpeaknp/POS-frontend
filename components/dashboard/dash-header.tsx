"use client";

import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { UserMenuDropdown } from "@/components/shared/UserMenuDropdown";

interface DashHeaderProps {
  title: React.ReactNode;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function DashHeader({ title, subtitle, actions }: DashHeaderProps) {
  return (
    <header
      data-tour="topbar"
      className="bg-card border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm gap-4"
    >
      <div data-tour="topbar-title" className="min-w-0">
        <h1 className="text-lg font-medium text-foreground tracking-tight flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          {title}
        </h1>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>

      <div data-tour="topbar-actions" className="flex items-center gap-2 shrink-0">
        {actions ? <div data-tour="topbar-page-actions">{actions}</div> : null}
        <div data-tour="topbar-notifications">
          <NotificationBell />
        </div>
        <div data-tour="topbar-user">
          <UserMenuDropdown />
        </div>
      </div>
    </header>
  );
}
