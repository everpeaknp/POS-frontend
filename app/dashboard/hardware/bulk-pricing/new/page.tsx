"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewHardwareBulkPricingPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/hardware/bulk-pricing?new=1");
  }, [router]);

  return null;
}
