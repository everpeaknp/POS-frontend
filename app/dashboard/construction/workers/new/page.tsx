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
      showBack
      backHref="/dashboard/construction/workers"
      backLabel="Back to Workers"
    >
      <div className={`${constructionCardClass} p-6 lg:p-8 w-full min-h-full`}>
        <WorkerForm
          onSuccess={() => router.push("/dashboard/construction/workers")}
          onCancel={() => router.back()}
        />
      </div>
    </ConstructionPageShell>
  );
}
