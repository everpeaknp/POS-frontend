import { Suspense } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function HardwareLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredModule="hardware" fallbackPath="/dashboard">
      <Suspense fallback={null}>{children}</Suspense>
    </ProtectedRoute>
  );
}
