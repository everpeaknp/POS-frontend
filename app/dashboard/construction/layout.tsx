import { Suspense } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function ConstructionLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredModule="construction" fallbackPath="/dashboard">
      <Suspense fallback={null}>{children}</Suspense>
    </ProtectedRoute>
  );
}
