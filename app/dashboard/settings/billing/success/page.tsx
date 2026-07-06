"use client";

import { PageLoading } from "@/components/shared/PageLoading";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function BillingSuccessRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const qs = searchParams.toString();
    router.replace(`/settings/billing/success${qs ? `?${qs}` : ""}`);
  }, [router, searchParams]);

  return (
    <PageLoading fullScreen message="Loading…" />
  );
}

export default function DashboardBillingSuccessPage() {
  return (
    <Suspense
      fallback={
        <PageLoading fullScreen message="Loading…" />
      }
    >
      <BillingSuccessRedirect />
    </Suspense>
  );
}
