import { Suspense } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredModule="reports" fallbackPath="/dashboard">
      <Suspense fallback={null}>{children}</Suspense>
    </ProtectedRoute>
  );
}
