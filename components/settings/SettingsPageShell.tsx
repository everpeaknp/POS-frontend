"use client";

import { DashHeader } from "@/components/dashboard/dash-header";
import { PageLoader } from "@/components/shared/PageLoader";

interface SettingsPageShellProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  loading?: boolean;
  loadingMessage?: string;
}

export function SettingsPageShell({
  title,
  subtitle,
  children,
  action,
  loading = false,
  loadingMessage,
}: SettingsPageShellProps) {
  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      {!loading && <DashHeader title={title} subtitle={subtitle} />}
      <div
        className={
          loading
            ? "flex flex-1 min-h-0 w-full"
            : "flex-1 p-6 w-full"
        }
      >
        {loading ? (
          <PageLoader message={loadingMessage} className="h-full flex-1" />
        ) : (
          <>
            {action && <div className="flex justify-end mb-6">{action}</div>}
            {children}
          </>
        )}
      </div>
    </div>
  );
}
