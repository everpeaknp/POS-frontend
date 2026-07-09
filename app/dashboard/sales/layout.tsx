"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function SalesLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredModule="sales" fallbackPath="/dashboard">
      {children}
    </ProtectedRoute>
  );
}
