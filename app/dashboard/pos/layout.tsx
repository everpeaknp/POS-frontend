import { Suspense } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function POSLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredModule="pos" fallbackPath="/dashboard">
      <Suspense fallback={null}>{children}</Suspense>
    </ProtectedRoute>
  );
}
