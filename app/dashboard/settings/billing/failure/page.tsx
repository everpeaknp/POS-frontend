"use client";

import { PageLoading } from "@/components/shared/PageLoading";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardBillingFailurePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/settings/billing/failure");
  }, [router]);

  return (
    <PageLoading fullScreen message="Loading…" />
  );
}
