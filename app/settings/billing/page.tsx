"use client";

import { BillingPanel } from "@/components/settings/BillingPanel";
import { SettingsPageShell } from "@/components/settings/SettingsPageShell";

export default function BillingPage() {
  return (
    <SettingsPageShell
      title="Billing & Subscription"
      subtitle="Organization plan and payment history"
    >
      <BillingPanel />
    </SettingsPageShell>
  );
}
