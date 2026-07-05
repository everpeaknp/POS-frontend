"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { HardwarePageShell } from "@/components/dashboard/HardwarePageShell";

export default function NewHardwareCustomerPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/sales/customers/new");
  }, [router]);

  return (
    <HardwarePageShell
      title="New Customer"
      subtitle="Opening customer form…"
      variant="redirect"
      loading
    >
      {null}
    </HardwarePageShell>
  );
}
