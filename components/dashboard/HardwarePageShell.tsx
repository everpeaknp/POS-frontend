import { DashHeader } from "@/components/dashboard/dash-header";
import { SkeletonTable } from "@/components/shared/Skeleton";
import { Loader2 } from "lucide-react";

interface HardwarePageShellProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  loading?: boolean;
  /** Narrow centered column for forms */
  variant?: "default" | "form" | "redirect";
}

export function HardwarePageShell({
  title,
  subtitle,
  action,
  children,
  loading,
  variant = "default",
}: HardwarePageShellProps) {
  const contentClass =
    variant === "form"
      ? "flex-1 p-6 max-w-3xl w-full mx-auto space-y-6"
      : variant === "redirect"
        ? "flex-1 p-6 flex items-center justify-center"
        : "flex-1 p-6 space-y-4";

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title={title} subtitle={subtitle} />
      <div className={contentClass}>
        {action && variant !== "redirect" && (
          <div className="flex justify-end -mt-2 mb-2">{action}</div>
        )}
        {loading ? (
          variant === "redirect" ? (
            <Loader2 className="h-8 w-8 animate-spin text-[#22C55E]" />
          ) : (
            <SkeletonTable rows={8} />
          )
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
