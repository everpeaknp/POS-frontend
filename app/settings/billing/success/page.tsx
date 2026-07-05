"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { billingApi } from "@/lib/api/billing";
import toast from "react-hot-toast";
import { SettingsPageShell } from "@/components/settings/SettingsPageShell";
import { SettingsCard, SettingsCardBody } from "@/components/settings/settings-ui";

function BillingSuccessContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verify = async () => {
      const data = searchParams.get("data");
      const transactionUuid =
        searchParams.get("transaction_uuid") || sessionStorage.getItem("khata_billing_txn") || "";

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
      } catch (error: unknown) {
        const err = error as { response?: { data?: { detail?: string } } };
        setStatus("error");
        setMessage(err.response?.data?.detail || "Payment verification failed");
        toast.error(err.response?.data?.detail || "Payment verification failed");
      }
    };

    verify();
  }, [searchParams]);

  return (
    <SettingsCard className="max-w-lg mx-auto">
      <SettingsCardBody className="text-center py-10">
        {status === "loading" && (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-[#22C55E] mx-auto mb-4" />
            <h2 className="text-base font-semibold text-gray-900">Verifying payment...</h2>
            <p className="text-sm text-gray-500 mt-1">Please wait while we confirm your eSewa transaction.</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle className="h-10 w-10 text-[#22C55E] mx-auto mb-4" />
            <h2 className="text-base font-semibold text-gray-900">Payment successful</h2>
            <p className="text-sm text-gray-500 mt-1">{message}</p>
            <Link
              href="/settings/billing"
              className="mt-6 inline-flex h-9 items-center justify-center rounded-lg bg-[#22C55E] px-4 text-sm font-medium text-white hover:bg-[#16A34A]"
            >
              Back to billing
            </Link>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
            <h2 className="text-base font-semibold text-gray-900">Verification failed</h2>
            <p className="text-sm text-gray-500 mt-1">{message}</p>
            <Link
              href="/settings/billing"
              className="mt-6 inline-flex h-9 items-center justify-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back to billing
            </Link>
          </>
        )}
      </SettingsCardBody>
    </SettingsCard>
  );
}

export default function BillingSuccessPage() {
  return (
    <SettingsPageShell title="Payment" subtitle="eSewa payment verification">
      <Suspense
        fallback={
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#22C55E]" />
          </div>
        }
      >
        <BillingSuccessContent />
      </Suspense>
    </SettingsPageShell>
  );
}
