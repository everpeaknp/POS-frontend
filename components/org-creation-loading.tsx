"use client";

import { ErpHeader } from "@/components/erp/erp-header";
import { PageLoading } from "@/components/shared/PageLoading";

export function OrgCreationLoading() {
  return (
    <div className="min-h-screen bg-[#F3F4F6] dark:bg-background flex flex-col">
      <ErpHeader />
      <PageLoading message="Getting your organization ready…" className="flex-1 min-h-[50vh]" />
    </div>
  );
}
