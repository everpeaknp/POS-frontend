'use client';

import { AttendanceGrid } from '@/components/construction';
import { DashHeader } from '@/components/dashboard/dash-header';

export default function AttendancePage() {
  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader
        title="Worker Attendance"
        subtitle="Mark daily attendance for construction workers. Wage calculations are automatic."
      />
      <div className="flex-1 overflow-y-auto p-6 w-full">
        <AttendanceGrid />
      </div>
    </div>
  );
}
