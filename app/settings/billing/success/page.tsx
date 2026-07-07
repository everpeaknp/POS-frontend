"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, XCircle } from "lucide-react";
import { billingApi } from "@/lib/api/billing";
import toast from "react-hot-toast";
import { SettingsPageShell } from "@/components/settings/SettingsPageShell";
import { SettingsCard, SettingsCardBody } from "@/components/settings/settings-ui";

function BillingSuccessContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const verifyStarted = useRef(false);

  useEffect(() => {
    if (verifyStarted.current) return;
    verifyStarted.current = true;

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
    <SettingsPageShell
      title="Payment"
      subtitle="eSewa payment verification"
      loading={status === "loading"}
      loadingMessage="Verifying payment…"
    >
      <SettingsCard className="max-w-lg mx-auto">
        <SettingsCardBody className="text-center py-10">
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
    </SettingsPageShell>
  );
}

export default function BillingSuccessPage() {
  return (
    <Suspense
      fallback={
        <SettingsPageShell
          title="Payment"
          subtitle="eSewa payment verification"
          loading
          loadingMessage="Verifying payment…"
        />
      }
    >
      <BillingSuccessContent />
    </Suspense>
  );
}
