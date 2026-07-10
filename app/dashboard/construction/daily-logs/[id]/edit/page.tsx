"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import DailyLogForm from "@/components/construction/DailyLogForm";
import {
  ConstructionPageShell,
  constructionCardClass,
} from "@/components/dashboard/ConstructionPageShell";
import { constructionApi, type DailyLog } from "@/lib/api/construction";
import toast from "react-hot-toast";

export default function EditDailyLogPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [log, setLog] = useState<DailyLog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchLog();
  }, [id]);

  const fetchLog = async () => {
    try {
      setLoading(true);
      const logData = await constructionApi.dailyLogs.get(id);
      setLog(logData);

      if (!logData.is_editable) {
        toast.error("This daily log cannot be edited. It was created more than 24 hours ago.");
        router.push(`/dashboard/construction/daily-logs/${id}`);
        return;
      }
    } catch (error: unknown) {
      console.error("Failed to load daily log:", error);
      toast.error("Failed to load daily log");
      router.push("/dashboard/construction/daily-logs");
    } finally {
      setLoading(false);
    }
  };

  if (!loading && !log) {
    return (
      <ConstructionPageShell
        title="Edit Daily Log"
        subtitle="Daily log not found"
        variant="fullscreen"
      >
        <div className={`${constructionCardClass} p-8 text-center w-full min-h-full`}>
          <Link
            href="/dashboard/construction/daily-logs"
            className="text-[#22C55E] hover:text-[#16A34A] font-medium"
          >
            Back to Daily Logs
          </Link>
        </div>
      </ConstructionPageShell>
    );
  }

  return (
    <ConstructionPageShell
      title="Edit Daily Log"
      subtitle="Update daily site activities and progress"
      variant="fullscreen"
      loading={loading}
    >
      {log && (
        <div className={`${constructionCardClass} p-6 lg:p-8 w-full min-h-full`}>
          <DailyLogForm
            logId={id}
            initialData={{
              site: log.site,
              date: log.date,
              work_description: log.work_description,
              progress_notes: log.progress_notes || "",
              weather: log.weather || "",
              other_expenses: log.other_expenses?.toString() || "0",
              other_expenses_description: log.other_expenses_description || "",
            }}
            hoursUntilImmutable={log.hours_until_immutable}
            onSuccess={() => router.push(`/dashboard/construction/daily-logs/${id}`)}
            onCancel={() => router.push(`/dashboard/construction/daily-logs/${id}`)}
          />
        </div>
      )}
    </ConstructionPageShell>
  );
}
