"use client";

import { useRouter } from "next/navigation";
import EquipmentForm from "@/components/construction/EquipmentForm";
import {
  ConstructionPageShell,
  constructionCardClass,
} from "@/components/dashboard/ConstructionPageShell";

export default function NewEquipmentPage() {
  const router = useRouter();

  return (
    <ConstructionPageShell
      title="New Equipment"
      subtitle="Add new construction equipment to your inventory"
      variant="fullscreen"
    >
      <div className={`${constructionCardClass} p-5 lg:p-6 w-full`}>
        <EquipmentForm
          onSuccess={() => router.push("/dashboard/construction/equipment")}
          onCancel={() => router.back()}
        />
      </div>
    </ConstructionPageShell>
  );
}
