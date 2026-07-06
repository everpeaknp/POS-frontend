"use client";

import { PageLoading } from "@/components/shared/PageLoading";

export function OrgCreationLoading() {
  return (
    <PageLoading
      fullScreen
      message="Getting your organization ready…"
    />
  );
}
