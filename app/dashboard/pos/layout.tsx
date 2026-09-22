"use client";

import { Suspense } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LanguageProvider } from "@/lib/context/LanguageContext";

export default function POSLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <ProtectedRoute requiredModule="pos" fallbackPath="/dashboard/retail">
        <Suspense fallback={null}>{children}</Suspense>
      </ProtectedRoute>
    </LanguageProvider>
  );
}
