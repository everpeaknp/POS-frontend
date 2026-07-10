"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import EquipmentForm from "@/components/construction/EquipmentForm";
import {
  ConstructionPageShell,
  constructionCardClass,
} from "@/components/dashboard/ConstructionPageShell";
import { constructionApi, type Equipment } from "@/lib/api/construction";
import toast from "react-hot-toast";

export default function EditEquipmentPage() {
  const router = useRouter();
  const params = useParams();
  const equipmentId = params.id as string;

  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (equipmentId) fetchEquipment();
  }, [equipmentId]);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const equipmentData = await constructionApi.equipment.get(equipmentId);
      setEquipment(equipmentData);
    } catch (error: unknown) {
      console.error("Failed to load equipment:", error);
      toast.error("Failed to load equipment details");
      router.push("/dashboard/construction/equipment");
    } finally {
      setLoading(false);
    }
  };

  if (!loading && !equipment) {
    return (
      <ConstructionPageShell
        title="Edit Equipment"
        subtitle="Equipment not found"
        variant="fullscreen"
      >
        <div className={`${constructionCardClass} p-8 text-center w-full`}>
          <Link
            href="/dashboard/construction/equipment"
            className="text-[#22C55E] hover:text-[#16A34A] font-medium"
          >
            Back to Equipment
          </Link>
        </div>
      </ConstructionPageShell>
    );
  }

  return (
    <ConstructionPageShell
      title="Edit Equipment"
      subtitle="Update equipment information"
      variant="fullscreen"
      loading={loading}
    >
      {equipment && (
        <div className={`${constructionCardClass} p-5 lg:p-6 w-full`}>
          <EquipmentForm
            equipmentId={equipmentId}
            initialData={{
              name: equipment.name,
              equipment_type: equipment.equipment_type,
              ownership_type: equipment.ownership_type,
              registration_number: equipment.registration_number || "",
              rental_cost_per_day: equipment.rental_cost_per_day?.toString() || "",
              assigned_site: equipment.assigned_site || "",
              status: equipment.status,
              notes: equipment.notes || "",
            }}
            onSuccess={() => router.push(`/dashboard/construction/equipment/${equipmentId}`)}
            onCancel={() => router.push(`/dashboard/construction/equipment/${equipmentId}`)}
          />
        </div>
      )}
    </ConstructionPageShell>
  );
}
