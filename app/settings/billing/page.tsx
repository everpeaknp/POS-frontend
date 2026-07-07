"use client";

import { useState } from "react";
import { BillingPanel } from "@/components/settings/BillingPanel";
import { SettingsPageShell } from "@/components/settings/SettingsPageShell";

export default function BillingPage() {
  const [loading, setLoading] = useState(true);

  return (
    <SettingsPageShell
      title="Billing & Subscription"
      subtitle="Manage your account subscription and payment history"
      loading={loading}
      loadingMessage="Loading billing information…"
    >
      <BillingPanel onLoadingChange={setLoading} />
    </SettingsPageShell>
  );
}
