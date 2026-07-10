"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import WorkerForm from "@/components/construction/WorkerForm";
import {
  ConstructionPageShell,
  constructionCardClass,
} from "@/components/dashboard/ConstructionPageShell";
import { constructionApi, Worker } from "@/lib/api/construction";
import toast from "react-hot-toast";

export default function EditWorkerPage() {
  const router = useRouter();
  const params = useParams();
  const workerId = params.id as string;

  const [worker, setWorker] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (workerId) fetchWorker();
  }, [workerId]);

  const fetchWorker = async () => {
    try {
      setLoading(true);
      const workerData = await constructionApi.workers.get(workerId);
      setWorker(workerData);
    } catch (error: unknown) {
      console.error("Failed to fetch worker:", error);
      toast.error("Failed to load worker details");
      router.push("/dashboard/construction/workers");
    } finally {
      setLoading(false);
    }
  };

  if (!loading && !worker) {
    return (
      <ConstructionPageShell
        title="Edit Worker"
        subtitle="Worker not found"
        variant="fullscreen"
      >
        <div className={`${constructionCardClass} p-8 text-center w-full`}>
          <Link
            href="/dashboard/construction/workers"
            className="text-[#22C55E] hover:text-[#16A34A] font-medium"
          >
            Back to Workers
          </Link>
        </div>
      </ConstructionPageShell>
    );
  }

  return (
    <ConstructionPageShell
      title="Edit Worker"
      subtitle={worker ? `Update details for ${worker.name}` : "Loading worker..."}
      variant="fullscreen"
      loading={loading}
    >
      {worker && (
        <div className={`${constructionCardClass} p-5 lg:p-6 w-full`}>
          <WorkerForm
            workerId={workerId}
            initialData={{
              name: worker.name,
              phone: worker.phone || "",
              address: worker.address || "",
              category: worker.category,
              daily_wage: worker.daily_wage.toString(),
              assigned_site: worker.assigned_site || "",
              status: worker.status,
              id_number: worker.id_number || "",
              emergency_contact: worker.emergency_contact || "",
            }}
            onSuccess={() => router.push(`/dashboard/construction/workers/${workerId}`)}
            onCancel={() => router.push(`/dashboard/construction/workers/${workerId}`)}
          />
        </div>
      )}
    </ConstructionPageShell>
  );
}
