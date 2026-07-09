"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Suspense } from "react";

export default function PurchaseLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredModule="purchase" fallbackPath="/dashboard">
      <Suspense fallback={null}>{children}</Suspense>
    </ProtectedRoute>
  );
}
