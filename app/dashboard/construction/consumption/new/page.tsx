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
      <div className={`${constructionCardClass} p-5 lg:p-6 w-full`}>
        <ConsumptionForm
          onSuccess={() => router.push("/dashboard/construction/material-consumption")}
          onCancel={() => router.back()}
        />
      </div>
    </ConstructionPageShell>
  );
}
