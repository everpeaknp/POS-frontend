"use client";

import { cn } from "@/lib/utils";
import { KhataSpinner } from "@/components/shared/KhataSpinner";

interface PageLoaderProps {
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

export function PageLoader({
  message = "Loading…",
  fullScreen = false,
  className,
}: PageLoaderProps) {
  return (
    <div
      className={cn(
        "flex w-full items-center justify-center",
        fullScreen
          ? "h-screen bg-[#F3F4F6] dark:bg-background"
          : "min-h-full flex-1",
        className
      )}
    >
      <div className="text-center">
        <KhataSpinner size="xl" variant="brand" />
        <p className="mt-5 text-sm font-medium text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
