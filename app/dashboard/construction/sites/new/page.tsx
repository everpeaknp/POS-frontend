"use client";

import { useRouter } from "next/navigation";
import SiteForm from "@/components/construction/SiteForm";
import {
  ConstructionPageShell,
  constructionCardClass,
} from "@/components/dashboard/ConstructionPageShell";

export default function NewSitePage() {
  const router = useRouter();

  return (
    <ConstructionPageShell
      title="New Construction Site"
      subtitle="Create a new construction project with budget allocation"
      variant="fullscreen"
      showBack
      backHref="/dashboard/construction/sites"
      backLabel="Back to Sites"
    >
      <div className={`${constructionCardClass} p-6 lg:p-8 w-full min-h-full`}>
        <SiteForm
          onSuccess={() => router.push("/dashboard/construction/sites")}
          onCancel={() => router.back()}
        />
      </div>
    </ConstructionPageShell>
  );
}
