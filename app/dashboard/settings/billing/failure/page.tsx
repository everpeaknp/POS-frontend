"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function DashboardBillingFailurePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/settings/billing/failure");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-[#22C55E]" />
    </div>
  );
}
