import { Suspense } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function InventoryLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredModule="inventory" fallbackPath="/dashboard">
      <Suspense fallback={null}>{children}</Suspense>
    </ProtectedRoute>
  );
}
