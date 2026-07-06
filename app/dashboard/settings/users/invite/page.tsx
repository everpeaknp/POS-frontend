"use client";

import { PageLoading } from "@/components/shared/PageLoading";

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
      <PageLoading message="Opening invite form…" />
    </div>
  );
}
