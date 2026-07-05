"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";
import { HardwarePageShell } from "@/components/dashboard/HardwarePageShell";

export default function HardwareOrderDetailPage() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    if (params.id) {
      router.replace(`/dashboard/sales/orders/${params.id}`);
    }
  }, [router, params.id]);

  return (
    <HardwarePageShell
      title="Order"
      subtitle="Opening order details…"
      variant="redirect"
      loading
    >
      {null}
    </HardwarePageShell>
  );
}
