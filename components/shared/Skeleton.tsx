import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      role="presentation"
      aria-hidden="true"
      className={cn(
        "motion-safe:animate-pulse rounded-md bg-gray-200 dark:bg-muted",
        className
      )}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border p-5 shadow-sm">
      <div className="space-y-3">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="space-y-2">
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonSiteCard() {
  return (
    <div className="border border-gray-100 dark:border-border rounded-lg p-4 bg-gray-50 dark:bg-muted/30">
      <div className="flex justify-between items-start mb-3">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
      <Skeleton className="h-2 w-full mt-3 rounded-full" />
    </div>
  );
}

/** Generic list/table page approximation for the module PageShells (Sales, Purchase, Inventory, HR, Hardware, Construction, Accounting, POS). */
export function SkeletonListPage({ rows = 6 }: { rows?: number }) {
  return (
    <div className="p-6 space-y-4" aria-hidden="true">
      <div className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border p-4 lg:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Skeleton className="h-9 w-48 rounded-lg" />
            <Skeleton className="h-9 w-32 rounded-lg" />
          </div>
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>
      <SkeletonTable rows={rows} />
    </div>
  );
}

/** Approximates DashboardPageShell's module-card grid + section layout while data loads. */
export function SkeletonDashboard() {
  return (
    <div className="p-6 space-y-6" aria-hidden="true">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border overflow-hidden">
            <div className="border-b border-gray-100 dark:border-border px-4 py-3.5 flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="px-4 py-4 grid grid-cols-2 gap-x-4 gap-y-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="space-y-1.5">
                  <Skeleton className="h-3 w-14" />
                  <Skeleton className="h-5 w-16" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-border flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="p-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-gray-100 dark:border-border p-3 space-y-1.5">
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
