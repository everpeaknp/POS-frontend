"use client";

import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { UserMenuDropdown } from "@/components/shared/UserMenuDropdown";

interface DashHeaderProps {
  title: string;
  subtitle?: string;
}

export function DashHeader({ title, subtitle }: DashHeaderProps) {
  return (
    <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      <div>
        <h1 className="text-lg font-bold text-foreground">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell />
        <UserMenuDropdown />
      </div>
    </header>
  );
}
