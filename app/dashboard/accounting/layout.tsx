import { Suspense } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function AccountingLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredModule="accounting" fallbackPath="/dashboard">
      <Suspense fallback={null}>{children}</Suspense>
    </ProtectedRoute>
  );
}
