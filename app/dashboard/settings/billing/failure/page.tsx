"use client";

import { useRouter } from "next/navigation";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashHeader } from "@/components/dashboard/dash-header";

export default function BillingFailurePage() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Payment" subtitle="eSewa payment was not completed" />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 max-w-md w-full text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-800">Payment cancelled or failed</h2>
          <p className="text-sm text-gray-500 mt-2">
            Your eSewa payment was not completed. No charges were made to your subscription.
          </p>
          <Button
            className="mt-6 bg-[#22C55E] hover:bg-[#16A34A] text-white"
            onClick={() => router.push("/dashboard/settings/billing")}
          >
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}
