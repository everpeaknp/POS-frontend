"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  HRPageShell,
  hrCardClass,
  hrStatCardClass,
  hrTableWrapClass,
} from "@/components/dashboard/HRPageShell";
import { EmptyState } from "@/components/shared/EmptyState";
import { getAttendance, getAttendanceStats, getEmployees, type Attendance, type Employee } from "@/lib/api/hr";
import toast from "react-hot-toast";

interface AttendanceStats {
  working_days: number;
  avg_attendance: number;
  late_arrivals: number;
  absences: number;
}

export default function AttendancePage() {
  const [month, setMonth] = useState<string>(getCurrentMonth());
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceData, setAttendanceData] = useState<{ [key: string]: Attendance[] }>({});
  const [loading, setLoading] = useState(true);

  function getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  function getMonthOptions() {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      options.push({ value, label });
    }
    return options;
  }

  function getDaysInMonth(yearMonth: string) {
    const [year, monthNum] = yearMonth.split('-').map(Number);
    return new Date(year, monthNum, 0).getDate();
  }

  useEffect(() => {
    loadData();
  }, [month]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const statsData = await getAttendanceStats(month);
      setStats(statsData);

      const empData = await getEmployees({ status: 'active' });
      const empList = empData.results || [];
      setEmployees(empList);

      const [year, monthNum] = month.split('-').map(Number);
      const startDate = `${year}-${String(monthNum).padStart(2, '0')}-01`;
      const endDay = getDaysInMonth(month);
      const endDate = `${year}-${String(monthNum).padStart(2, '0')}-${endDay}`;

      const attData = await getAttendance({
        date__gte: startDate,
        date__lte: endDate
      });

      const grouped: { [key: string]: Attendance[] } = {};
      (attData.results || []).forEach((record) => {
        if (!grouped[record.employee]) {
          grouped[record.employee] = [];
        }
        grouped[record.employee].push(record);
      });
      setAttendanceData(grouped);
    } catch (error) {
      console.error('Failed to load attendance data:', error);
      toast.error("Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceForDay = (employeeId: string, day: number) => {
    const records = attendanceData[employeeId] || [];
    const [year, monthNum] = month.split('-').map(Number);
    const dateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return records.find(r => r.date === dateStr);
  };

  const getStatusDisplay = (status: string) => {
    const map: { [key: string]: { label: string; color: string } } = {
      present: { label: 'P', color: 'bg-green-100 text-green-700' },
      absent: { label: 'A', color: 'bg-red-100 text-red-700' },
      late: { label: 'L', color: 'bg-amber-100 text-amber-700' },
      'half-day': { label: 'H', color: 'bg-gray-100 text-gray-700' },
      leave: { label: 'L', color: 'bg-blue-100 text-blue-700' }
    };
    return map[status] || { label: '-', color: 'bg-gray-50 text-gray-400' };
  };

  const getPresentCount = (employeeId: string) => {
    const records = attendanceData[employeeId] || [];
    return records.filter(r => r.status === 'present').length;
  };

  const daysInMonth = getDaysInMonth(month);
  const days = Array.from({ length: Math.min(daysInMonth, 31) }, (_, i) => i + 1);

  if (!loading && employees.length === 0) {
    return (
      <HRPageShell title="Attendance" subtitle="Employee attendance tracking">
        <EmptyState
            icon={Users}
            title="No employees to track"
            description="Add employees first, then mark daily attendance for your team"
            actionLabel="Add Employee"
            actionHref="/dashboard/hr/employees/new"
          />
      </HRPageShell>
    );
  }

  return (
    <HRPageShell
      title="Attendance"
      subtitle="Employee attendance tracking"
      loading={loading}
      toolbar={
        <Select value={month} onValueChange={(v) => v && setMonth(v)}>
          <SelectTrigger className="h-9 w-48 text-sm border-gray-200 bg-white"><SelectValue /></SelectTrigger>
          <SelectContent>
            {getMonthOptions().map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
      action={
        <Link href="/dashboard/hr/attendance/mark">
          <Button size="sm" className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5">
            <Plus className="h-4 w-4" /> Mark Attendance
          </Button>
        </Link>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={hrStatCardClass}>
          <p className="text-xs text-gray-500 font-medium">Working Days</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.working_days || 0}</p>
        </div>
        <div className={hrStatCardClass}>
          <p className="text-xs text-gray-500 font-medium">Avg Attendance</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.avg_attendance || 0}%</p>
        </div>
        <div className={hrStatCardClass}>
          <p className="text-xs text-gray-500 font-medium">Late Arrivals</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.late_arrivals || 0}</p>
        </div>
        <div className={hrStatCardClass}>
          <p className="text-xs text-gray-500 font-medium">Absences</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.absences || 0}</p>
        </div>
      </div>

      <div className={`${hrTableWrapClass} overflow-x-auto`}>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 sticky left-0 bg-gray-50 z-10">Employee</th>
                {days.map((day) => (
                  <th key={day} className="text-center px-2 py-3 text-xs font-medium text-gray-500 min-w-10">{day}</th>
                ))}
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">Present</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-900 sticky left-0 bg-white hover:bg-gray-50/50 z-10">
                    <div className="flex flex-col">
                      <span className="hover:text-[#22C55E]">{emp.name}</span>
                      <span className="text-xs text-gray-500">{emp.department_name}</span>
                    </div>
                  </td>
                  {days.map((day) => {
                    const attendance = getAttendanceForDay(emp.id, day);
                    const display = attendance ? getStatusDisplay(attendance.status) : { label: '-', color: 'bg-gray-50 text-gray-400' };
                    return (
                      <td key={day} className="text-center px-2 py-3">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded text-xs font-medium ${display.color}`}>
                          {display.label}
                        </span>
                      </td>
                    );
                  })}
                  <td className="text-center px-4 py-3 font-medium text-gray-900">{getPresentCount(emp.id)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
    </HRPageShell>
  );
}
