"use client";

import { useRouter } from "next/navigation";
import DailyLogForm from "@/components/construction/DailyLogForm";
import {
  ConstructionPageShell,
  constructionCardClass,
} from "@/components/dashboard/ConstructionPageShell";

export default function NewDailyLogPage() {
  const router = useRouter();

  return (
    <ConstructionPageShell
      title="New Daily Log"
      subtitle="Record daily site activities and progress"
      variant="fullscreen"
    >
      <div className={`${constructionCardClass} p-6 lg:p-8 w-full min-h-full`}>
        <DailyLogForm
          onSuccess={() => router.push("/dashboard/construction/daily-logs")}
          onCancel={() => router.back()}
        />
      </div>
    </ConstructionPageShell>
  );
}
