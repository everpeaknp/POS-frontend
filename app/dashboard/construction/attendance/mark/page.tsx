"use client";

import Link from "next/link";
import { Suspense } from "react";
import { ChevronLeft } from "lucide-react";
import { AttendanceGrid } from "@/components/construction";
import {
  ConstructionPageShell,
  constructionCardClass,
} from "@/components/dashboard/ConstructionPageShell";

function MarkAttendanceContent() {
  return (
    <>
      <Link
        href="/dashboard/construction/attendance"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 -mt-2"
      >
        <ChevronLeft className="h-4 w-4" /> Back to Attendance
      </Link>

      <div className={`${constructionCardClass} p-6`}>
        <AttendanceGrid />
      </div>
    </>
  );
}

export default function MarkConstructionAttendancePage() {
  return (
    <ConstructionPageShell
      title="Mark Attendance"
      subtitle="Record worker attendance for a construction site"
    >
      <Suspense fallback={null}>
        <MarkAttendanceContent />
      </Suspense>
    </ConstructionPageShell>
  );
}
