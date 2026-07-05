"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";
import { HardwarePageShell } from "@/components/dashboard/HardwarePageShell";

export default function HardwareProductDetailPage() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    if (params.id) {
      router.replace(`/dashboard/inventory/products/${params.id}`);
    }
  }, [router, params.id]);

  return (
    <HardwarePageShell
      title="Product"
      subtitle="Opening product details…"
      variant="redirect"
      loading
    >
      {null}
    </HardwarePageShell>
  );
}
