"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { HardwarePageShell } from "@/components/dashboard/HardwarePageShell";

export default function NewHardwareOrderPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/sales/orders/new");
  }, [router]);

  return (
    <HardwarePageShell
      title="New Order"
      subtitle="Opening order form…"
      variant="redirect"
      loading
    >
      {null}
    </HardwarePageShell>
  );
}
