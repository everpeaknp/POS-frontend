"use client";

import { DashHeader } from "@/components/dashboard/dash-header";
import { PageLoader } from "@/components/shared/PageLoader";
import { cn } from "@/lib/utils";

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
    <div className="relative flex h-full min-h-0 w-full flex-col">
      {!loading && (
        <DashHeader title={title} subtitle={subtitle} showNotifications={false} />
      )}

      {loading ? (
        <div className="absolute inset-0 z-20 flex min-h-0 w-full bg-[#F3F4F6] dark:bg-background">
          <PageLoader message={loadingMessage} className="h-full flex-1" />
        </div>
      ) : null}

      <div
        className={cn(
          "flex min-h-0 w-full flex-col flex-1 p-6",
          loading && "pointer-events-none opacity-0"
        )}
        data-page-tour-root
        aria-hidden={loading}
      >
        {action ? <div className="mb-6 flex justify-end">{action}</div> : null}
        {children}
      </div>
    </div>
  );
}
