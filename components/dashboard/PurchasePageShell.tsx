import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { DashHeader } from "@/components/dashboard/dash-header";
import { DashboardShellLoading } from "@/components/dashboard/DashboardShellLoading";
import { Button } from "@/components/ui/button";

interface PurchasePageShellProps {
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
  variant?: "default" | "form" | "fullscreen" | "redirect";
}

export function PurchasePageShell({
  title,
  subtitle,
  backHref = "/dashboard/purchase",
  showBack = false,
  toolbar,
  action,
  children,
  loading,
  loadingMessage,
  error,
  onRetry,
  variant = "default",
}: PurchasePageShellProps) {
  if (loading) {
    return <DashboardShellLoading message={loadingMessage} />;
  }

  const contentClass =
    variant === "fullscreen"
      ? "flex-1 overflow-y-auto p-6"
      : variant === "form"
        ? "flex-1 p-6 max-w-3xl w-full mx-auto space-y-6"
        : variant === "redirect"
          ? "flex-1 p-6 flex items-center justify-center"
          : "flex-1 overflow-y-auto p-6 space-y-4";

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader title={title} subtitle={subtitle} />
      <div className={contentClass}>
        {showBack && backHref && (
          <Link
            href={backHref}
            className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-muted-foreground hover:text-[#22C55E] transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Purchase
          </Link>
        )}

        {(toolbar || action) && (
          <div className={`${purchaseCardClass} p-4 lg:p-5`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              {toolbar ? (
                <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">{toolbar}</div>
              ) : null}
              {action ? <div className="shrink-0">{action}</div> : null}
            </div>
          </div>
        )}

        {action && variant !== "redirect" && !toolbar && (
          <div className="flex justify-end -mt-2 mb-2">{action}</div>
        )}

        {error ? (
          <div className={`${purchaseCardClass} p-12 text-center`}>
            <p className="text-gray-600 dark:text-muted-foreground mb-4">{error}</p>
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

export const purchaseCardClass =
  "bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border shadow-sm";

export const purchaseTableWrapClass = `${purchaseCardClass} overflow-hidden`;

export const purchaseSectionTitleClass =
  "text-sm font-semibold text-gray-700 dark:text-foreground border-b border-gray-100 dark:border-border pb-2";

export const purchaseStatCardClass = `${purchaseCardClass} p-4`;

export const purchaseFilterPillActive = "bg-[#22C55E] text-white";
export const purchaseFilterPillInactive =
  "bg-gray-100 dark:bg-muted text-gray-600 dark:text-muted-foreground hover:bg-gray-200 dark:hover:bg-muted/80";
