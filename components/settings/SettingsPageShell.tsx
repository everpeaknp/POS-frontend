"use client";

import { DashHeader } from "@/components/dashboard/dash-header";

interface SettingsPageShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

export function SettingsPageShell({
  title,
  subtitle,
  children,
  action,
}: SettingsPageShellProps) {
  return (
    <div className="flex flex-col min-h-full w-full">
      <DashHeader title={title} subtitle={subtitle} />
      <div className="flex-1 p-6 w-full">
        {action && <div className="flex justify-end mb-6">{action}</div>}
        {children}
      </div>
    </div>
  );
}
