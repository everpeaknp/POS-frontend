import { PageLoader } from "@/components/shared/PageLoader";

interface PageLoadingProps {
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

/** Centered full-area page loading state — use across dashboard, settings, ERP, and auth. */
export function PageLoading({
  message = "Loading…",
  fullScreen = false,
  className,
}: PageLoadingProps) {
  if (fullScreen) {
    return <PageLoader message={message} fullScreen />;
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col flex-1">
      <PageLoader message={message} className={className ?? "h-full flex-1"} />
    </div>
  );
}
