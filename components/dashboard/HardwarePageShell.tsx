import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { DashHeader } from "@/components/dashboard/dash-header";
import { DashboardShellLoading } from "@/components/dashboard/DashboardShellLoading";
import { Button } from "@/components/ui/button";

interface HardwarePageShellProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  showBack?: boolean;
  backLabel?: string;
  toolbar?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
  loading?: boolean;
  loadingMessage?: string;
  error?: string | null;
  onRetry?: () => void;
  variant?: "default" | "form" | "fullscreen" | "redirect";
}

export function HardwarePageShell({
  title,
  subtitle,
  backHref = "/dashboard/hardware",
  showBack = false,
  backLabel = "Back to Hardware",
  toolbar,
  action,
  children,
  loading,
  loadingMessage,
  error,
  onRetry,
  variant = "default",
}: HardwarePageShellProps) {
  if (loading) {
    return <DashboardShellLoading message={loadingMessage} />;
  }

  const contentClass =
    variant === "fullscreen"
      ? "flex-1 overflow-y-auto p-6 w-full"
      : variant === "form"
        ? "flex-1 p-6 max-w-3xl w-full mx-auto space-y-6"
        : variant === "redirect"
          ? "flex-1 p-6 flex items-center justify-center"
          : "flex-1 overflow-y-auto p-6 space-y-4 w-full";

  return (
    <div className="flex flex-col h-full min-h-0 w-full">
      <DashHeader title={title} subtitle={subtitle} />
      <div className={contentClass}>
        {showBack && backHref && (
          <Link
            href={backHref}
            className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-muted-foreground hover:text-[#22C55E] transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            {backLabel}
          </Link>
        )}

        {(toolbar || action) && variant !== "redirect" && (
          <div className={`${hardwareCardClass} p-4 lg:p-5`}>
            <div
              className={`flex flex-wrap items-center gap-3 w-full ${
                toolbar ? "justify-between" : "justify-end"
              }`}
            >
              {toolbar ? (
                <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">{toolbar}</div>
              ) : null}
              {action ? <div className="shrink-0">{action}</div> : null}
            </div>
          </div>
        )}

        {error ? (
          <div className={`${hardwareCardClass} p-12 text-center`}>
            <p className="text-gray-600 dark:text-muted-foreground mb-4">{error}</p>
            {onRetry && (
              <Button onClick={onRetry} className="bg-[#22C55E] hover:bg-[#16A34A] text-white">
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

export const hardwareCardClass =
  "bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border shadow-sm";

export const hardwareTableWrapClass = `${hardwareCardClass} overflow-hidden`;

export const hardwareInputClass =
  "w-full h-9 pl-10 pr-4 text-sm border border-gray-200 dark:border-border rounded-lg bg-white dark:bg-card focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent";

export const hardwareStatCardClass = `${hardwareCardClass} p-4`;

export const hardwareFilterPillActive = "bg-[#22C55E] text-white";
export const hardwareFilterPillInactive =
  "bg-gray-100 dark:bg-muted text-gray-700 dark:text-muted-foreground hover:bg-gray-200 dark:hover:bg-muted/80";
