"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/** Ticket detail moved under account Support — keep old URLs working. */
export default function TicketDetailRedirectPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/settings/support/${params.id}`);
  }, [params.id, router]);

  return null;
}
