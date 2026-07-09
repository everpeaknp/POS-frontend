import { Suspense } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function HRLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredModule="hr" fallbackPath="/dashboard">
      <Suspense fallback={null}>{children}</Suspense>
    </ProtectedRoute>
  );
}
