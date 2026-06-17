"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DashHeader } from "@/components/dashboard/dash-header";
import { mockEmployees } from "@/lib/mock-data/hr";

export default function EmployeeAttendanceDetailPage({ params }: { params: { employeeId: string } }) {
  const employee = mockEmployees.find((e) => e.id === params.employeeId);

  if (!employee) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Employee Not Found" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title={`${employee.name} - Attendance`} subtitle="Monthly attendance record" />
      <div className="flex-1 p-6 space-y-6">
        <Link href="/dashboard/hr/attendance" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" /> Back to Attendance
        </Link>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Present Days", value: "22", color: "green" },
            { label: "Absent Days", value: "2", color: "red" },
            { label: "Late Days", value: "1", color: "amber" },
            { label: "Leave Days", value: "1", color: "blue" },
          ].map((stat) => (
            <div key={stat.label} className={`bg-${stat.color}-50 rounded-xl border border-${stat.color}-100 p-4`}>
              <p className={`text-xs text-${stat.color}-600 font-medium`}>{stat.label}</p>
              <p className={`text-2xl font-bold text-${stat.color}-900 mt-1`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Attendance Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Attendance Details</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Date", "Day", "Check-in", "Check-out", "Hours", "Status", "Remarks"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[1, 2, 3, 4, 5].map((day) => (
                <tr key={day} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-gray-600">2082-01-0{day}</td>
                  <td className="px-4 py-3 text-gray-600">Mon</td>
                  <td className="px-4 py-3 text-gray-600">09:00</td>
                  <td className="px-4 py-3 text-gray-600">17:30</td>
                  <td className="px-4 py-3 text-gray-600">8.5 hrs</td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Present</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">-</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
