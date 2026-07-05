"use client";

import Link from "next/link";
import { XCircle } from "lucide-react";
import { SettingsPageShell } from "@/components/settings/SettingsPageShell";
import { SettingsCard, SettingsCardBody } from "@/components/settings/settings-ui";

export default function BillingFailurePage() {
  return (
    <SettingsPageShell title="Payment" subtitle="eSewa payment status">
      <SettingsCard className="max-w-lg mx-auto">
        <SettingsCardBody className="text-center py-10">
          <XCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
          <h2 className="text-base font-semibold text-gray-900">Payment cancelled or failed</h2>
          <p className="text-sm text-gray-500 mt-1">
            Your eSewa payment was not completed. No charges were made.
          </p>
          <Link
            href="/settings/billing"
            className="mt-6 inline-flex h-9 items-center justify-center rounded-lg bg-[#22C55E] px-4 text-sm font-medium text-white hover:bg-[#16A34A]"
          >
            Try again
          </Link>
        </SettingsCardBody>
      </SettingsCard>
    </SettingsPageShell>
  );
}
