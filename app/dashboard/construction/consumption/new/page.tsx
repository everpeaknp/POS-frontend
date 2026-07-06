"use client";

import { useRouter } from "next/navigation";
import { ConsumptionForm } from "@/components/construction";
import {
  ConstructionPageShell,
  constructionCardClass,
} from "@/components/dashboard/ConstructionPageShell";

export default function NewMaterialConsumptionPage() {
  const router = useRouter();

  return (
    <ConstructionPageShell
      title="Log Material Consumption"
      subtitle="Record materials used at construction sites. Stock will be automatically deducted."
      variant="fullscreen"
    >
      <div className={`${constructionCardClass} p-6 lg:p-8 w-full min-h-full`}>
        <ConsumptionForm
          onSuccess={() => router.push("/dashboard/construction/material-consumption")}
          onCancel={() => router.back()}
        />
      </div>
    </ConstructionPageShell>
  );
}
