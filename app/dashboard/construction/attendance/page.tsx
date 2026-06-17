import { AttendanceGrid } from '@/components/construction';

export default function AttendancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Worker Attendance</h1>
        <p className="mt-2 text-gray-600">
          Mark daily attendance for construction workers. Wage calculations are automatic.
        </p>
      </div>

      <AttendanceGrid />
    </div>
  );
}
