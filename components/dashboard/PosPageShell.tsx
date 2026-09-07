"use client";

import { DashHeader } from "@/components/dashboard/dash-header";
import { SkeletonListPage } from "@/components/shared/Skeleton";
import { useDelayedLoading } from "@/lib/hooks/useDelayedLoading";

interface PosPageShellProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
  loading?: boolean;
  loadingMessage?: string;
  variant?: "default" | "fullscreen" | "redirect";
}

export function PosPageShell({
  title,
  subtitle,
  action,
  children,
  loading,
  variant = "default",
}: PosPageShellProps) {
  const showSkeleton = useDelayedLoading(!!loading);
  if (loading) {
    return (
      <div className="flex flex-col h-full min-h-0" aria-busy="true">
        <DashHeader title={title} subtitle={subtitle} />
        {showSkeleton && <SkeletonListPage />}
      </div>
    );
  }

  const contentClass =
    variant === "fullscreen"
      ? "flex-1 overflow-y-auto p-6"
      : variant === "redirect"
        ? "flex-1 p-6 flex items-center justify-center"
        : "flex-1 p-6 space-y-4";

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader title={title} subtitle={subtitle} />
      <div className={contentClass}>
        {action && variant !== "redirect" && (
          <div className="flex justify-end -mt-2 mb-2">{action}</div>
        )}
        {children}
      </div>
    </div>
  );
}

export const posCardClass =
  "bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border shadow-sm";

export const posTableWrapClass = `${posCardClass} overflow-hidden`;
