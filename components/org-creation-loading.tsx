"use client";

import { ErpHeader } from "@/components/erp/erp-header";
import { PageLoading } from "@/components/shared/PageLoading";
import type { AccountType } from "@/components/account-type-selection";
import { getCreationCopy } from "@/lib/onboarding/creation-copy";

export function OrgCreationLoading({ accountType }: { accountType?: AccountType | null }) {
  return (
    <div className="min-h-screen bg-[#F3F4F6] dark:bg-background flex flex-col">
      <ErpHeader />
      <PageLoading message={getCreationCopy(accountType).loadingMessage} className="flex-1 min-h-[50vh]" />
    </div>
  );
}
