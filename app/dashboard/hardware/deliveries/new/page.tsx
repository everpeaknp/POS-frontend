"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Delivery creation is now a popup on the list page — redirect old links there. */
export default function NewDeliveryRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/hardware/deliveries?new=1");
  }, [router]);

  return null;
}
