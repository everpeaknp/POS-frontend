"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewHardwarePaymentPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/hardware/payments?new=1");
  }, [router]);

  return null;
}
