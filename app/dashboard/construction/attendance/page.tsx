"use client";

import { AttendanceGrid } from "@/components/construction";
import {
  ConstructionPageShell,
  constructionCardClass,
} from "@/components/dashboard/ConstructionPageShell";

export default function AttendancePage() {
  return (
    <ConstructionPageShell
      title="Worker Attendance"
      subtitle="Mark daily attendance for construction workers. Wage calculations are automatic."
    >
      <div className={`${constructionCardClass} p-4 lg:p-6`}>
        <AttendanceGrid />
      </div>
    </ConstructionPageShell>
  );
}
