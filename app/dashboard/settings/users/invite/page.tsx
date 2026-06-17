"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashHeader } from "@/components/dashboard/dash-header";

export default function InviteUserRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/settings/users?invite=1");
  }, [router]);

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Users & Roles" subtitle="Opening invite form..." />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#22C55E]" />
      </div>
    </div>
  );
}
