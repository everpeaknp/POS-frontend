import { DashHeader } from "@/components/dashboard/dash-header";
import { DashboardShellLoading } from "@/components/dashboard/DashboardShellLoading";

interface DashboardPageShellProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
  loading?: boolean;
  loadingMessage?: string;
}

export function DashboardPageShell({
  title,
  subtitle,
  action,
  children,
  loading,
  loadingMessage,
}: DashboardPageShellProps) {
  if (loading) {
    return <DashboardShellLoading message={loadingMessage} />;
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader title={title} subtitle={subtitle} />
      <div className="flex-1 p-6 space-y-6">
        {action && <div className="flex justify-end -mt-2">{action}</div>}
        {children}
      </div>
    </div>
  );
}

export const dashboardCardClass =
  "bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border shadow-sm";

export const dashboardTableWrapClass = `${dashboardCardClass} overflow-hidden`;

export const dashboardStatCardClass = `${dashboardCardClass} p-4`;

export const dashboardFilterPillActive =
  "bg-white dark:bg-card text-gray-900 dark:text-foreground shadow-sm";
export const dashboardFilterPillInactive =
  "text-gray-500 dark:text-muted-foreground hover:text-gray-900 dark:hover:text-foreground";
