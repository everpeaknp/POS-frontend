"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { HardwarePageShell } from "@/components/dashboard/HardwarePageShell";

export default function NewHardwareProductPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/inventory/products/new");
  }, [router]);

  return (
    <HardwarePageShell
      title="New Product"
      subtitle="Opening product form…"
      variant="redirect"
      loading
    >
      {null}
    </HardwarePageShell>
  );
}
