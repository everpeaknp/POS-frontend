"use client";

import { cn } from "@/lib/utils";

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
        <div className="relative mx-auto mb-5 h-16 w-16">
          <div className="absolute inset-0 rounded-full border-[3px] border-[#22C55E]/15" />
          <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-[#22C55E] animate-spin" />
          <div className="absolute inset-[14px] rounded-full bg-[#22C55E]/10 animate-pulse" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">{message}</p>
        <div className="mt-4 flex justify-center gap-1.5">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="h-1.5 w-1.5 rounded-full bg-[#22C55E] animate-bounce"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
