"use client";

import { KhataLogo } from "@/components/khata-logo";
import { KhataSpinner } from "@/components/shared/KhataSpinner";

interface KhataLoadingProps {
  message?: string;
  fullScreen?: boolean;
}

export function KhataLoading({ message = "Loading…", fullScreen = true }: KhataLoadingProps) {
  if (!fullScreen) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-6">
        <KhataLogo size="lg" />
        <div className="flex flex-col items-center gap-3">
          <KhataSpinner size="lg" variant="brand" />
          <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: '#f3f4f6' }}>
      <div className="flex flex-col items-center gap-8">
        <KhataLogo size="lg" />
        <div className="flex flex-col items-center gap-4">
          <KhataSpinner size="xl" variant="brand" />
          <p className="text-base text-muted-foreground animate-pulse font-medium">{message}</p>
        </div>
      </div>
    </div>
  );
}
