"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";
import { HardwarePageShell } from "@/components/dashboard/HardwarePageShell";

export default function HardwareCustomerDetailPage() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    if (params.id) {
      router.replace(`/dashboard/sales/customers/${params.id}`);
    }
  }, [router, params.id]);

  return (
    <HardwarePageShell
      title="Customer"
      subtitle="Opening customer details…"
      variant="redirect"
      loading
    >
      {null}
    </HardwarePageShell>
  );
}
