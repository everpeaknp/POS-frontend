"use client";

import { useRouter } from "next/navigation";
import WorkerForm from "@/components/construction/WorkerForm";
import {
  ConstructionPageShell,
  constructionCardClass,
} from "@/components/dashboard/ConstructionPageShell";

export default function NewWorkerPage() {
  const router = useRouter();

  return (
    <ConstructionPageShell
      title="New Worker"
      subtitle="Add a new construction worker to your workforce"
      variant="fullscreen"
    >
      <div className={`${constructionCardClass} p-5 lg:p-6 w-full`}>
        <WorkerForm
          onSuccess={() => router.push("/dashboard/construction/workers")}
          onCancel={() => router.back()}
        />
      </div>
    </ConstructionPageShell>
  );
}
