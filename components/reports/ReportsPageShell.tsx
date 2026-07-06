import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { DashHeader } from "@/components/dashboard/dash-header";
import { PageLoading } from "@/components/shared/PageLoading";
import { Button } from "@/components/ui/button";

export const reportsCardClass =
  "bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border shadow-sm";

export const reportsTableWrapClass = `${reportsCardClass} overflow-hidden`;

interface ReportsPageShellProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  showBack?: boolean;
  toolbar?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
  loading?: boolean;
  loadingMessage?: string;
  error?: string | null;
  onRetry?: () => void;
}

export function ReportsPageShell({
  title,
  subtitle,
  backHref = "/dashboard/reports",
  showBack = false,
  toolbar,
  action,
  children,
  loading,
  loadingMessage,
  error,
  onRetry,
}: ReportsPageShellProps) {
  if (loading) {
    return <PageLoading message={loadingMessage ?? "Loading report…"} />;
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader title={title} subtitle={subtitle} />
      <div className="flex-1 p-6 space-y-4">
        {showBack && backHref && (
          <Link
            href={backHref}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#22C55E] transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Reports
          </Link>
        )}

        {(toolbar || action) && (
          <div className={`${reportsCardClass} p-4 lg:p-5`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              {toolbar ? (
                <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
                  {toolbar}
                </div>
              ) : null}
              {action ? <div className="shrink-0">{action}</div> : null}
            </div>
          </div>
        )}

        {error ? (
          <div className={`${reportsCardClass} p-12 text-center`}>
            <p className="text-gray-600 mb-4">{error}</p>
            {onRetry && (
              <Button
                onClick={onRetry}
                className="bg-[#22C55E] hover:bg-[#16A34A] text-white"
              >
                Try again
              </Button>
            )}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

export function ReportsLoadingState({ label }: { label?: string }) {
  return <PageLoading message={label ?? "Loading report…"} />;
}
