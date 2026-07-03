"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashHeader } from "@/components/dashboard/dash-header";
import { billingApi } from "@/lib/api/billing";
import toast from "react-hot-toast";

function BillingSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verify = async () => {
      const data = searchParams.get("data");
      const transactionUuid =
        searchParams.get("transaction_uuid") ||
        sessionStorage.getItem("khata_billing_txn") ||
        "";

      if (!transactionUuid) {
        setStatus("error");
        setMessage("Missing payment reference. Please contact support.");
        return;
      }

      try {
        const result = await billingApi.verify(transactionUuid, data || undefined);
        sessionStorage.removeItem("khata_billing_txn");
        setStatus("success");
        setMessage(result.message || "Subscription activated successfully");
        toast.success(result.message || "Payment successful");
      } catch (error: any) {
        setStatus("error");
        setMessage(error.response?.data?.detail || "Payment verification failed");
        toast.error(error.response?.data?.detail || "Payment verification failed");
      }
    };

    verify();
  }, [searchParams]);

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Payment" subtitle="Processing your eSewa payment" />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 max-w-md w-full text-center">
          {status === "loading" && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-[#22C55E] mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-800">Verifying payment...</h2>
              <p className="text-sm text-gray-500 mt-2">Please wait while we confirm your eSewa transaction.</p>
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle className="h-12 w-12 text-[#22C55E] mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-800">Payment successful</h2>
              <p className="text-sm text-gray-500 mt-2">{message}</p>
              <Button
                className="mt-6 bg-[#22C55E] hover:bg-[#16A34A] text-white"
                onClick={() => router.push("/dashboard/settings/billing")}
              >
                Back to Billing
              </Button>
            </>
          )}
          {status === "error" && (
            <>
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-800">Payment verification failed</h2>
              <p className="text-sm text-gray-500 mt-2">{message}</p>
              <Button
                variant="outline"
                className="mt-6"
                onClick={() => router.push("/dashboard/settings/billing")}
              >
                Back to Billing
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BillingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-full">
        <DashHeader title="Payment" subtitle="Processing your eSewa payment" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#22C55E]" />
        </div>
      </div>
    }>
      <BillingSuccessContent />
    </Suspense>
  );
}
