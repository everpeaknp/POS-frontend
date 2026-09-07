"use client";

import { DashHeader } from "@/components/dashboard/dash-header";
import { SkeletonDashboard } from "@/components/shared/Skeleton";
import { useDelayedLoading } from "@/lib/hooks/useDelayedLoading";

interface DashboardPageShellProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  /** Shown in the page header top-right (before notifications) */
  headerActions?: React.ReactNode;
  children?: React.ReactNode;
  loading?: boolean;
  loadingMessage?: string;
}

export function DashboardPageShell({
  title,
  subtitle,
  action,
  headerActions,
  children,
  loading,
}: DashboardPageShellProps) {
  const showLoading = useDelayedLoading(!!loading);

  if (showLoading) {
    return (
      <div className="flex flex-col h-full min-h-0" aria-busy="true" aria-live="polite">
        <DashHeader title={title} subtitle={subtitle} actions={headerActions} />
        <div className="flex-1 overflow-auto">
          <SkeletonDashboard />
        </div>
      </div>
    );
  }

  if (loading) {
    // Still loading, but within the flicker-guard window — keep the header
    // usable and render nothing below rather than a stale/empty body.
    return (
      <div className="flex flex-col h-full min-h-0" aria-busy="true">
        <DashHeader title={title} subtitle={subtitle} actions={headerActions} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader title={title} subtitle={subtitle} actions={headerActions} />
      <div data-page-tour-root className="flex-1 p-6 space-y-6">
        {action && (
          <div data-page-tour="primary-action" className="flex justify-end -mt-2">
            {action}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export const dashboardCardClass =
  "bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border shadow-sm";

export const dashboardTableWrapClass = `${dashboardCardClass} overflow-hidden`;

/** Prefer this wrapper for list tables so page help can target them */
export function DashboardTableWrap({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      data-page-tour="table"
      className={className ? `${dashboardTableWrapClass} ${className}` : dashboardTableWrapClass}
    >
      {children}
    </div>
  );
}

export const dashboardStatCardClass = `${dashboardCardClass} p-4`;

export const dashboardFilterPillActive =
  "bg-white dark:bg-card text-gray-900 dark:text-foreground shadow-sm";
export const dashboardFilterPillInactive =
  "text-gray-500 dark:text-muted-foreground hover:text-gray-900 dark:hover:text-foreground";
