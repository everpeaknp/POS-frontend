"use client";

import Link from "next/link";
import { Users, Building2, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashHeader } from "@/components/dashboard/dash-header";
import { mockEmployees, mockDepartments, mockLeaveRequests, mockPayrollList } from "@/lib/mock-data/hr";

export default function HRDashboardPage() {
  const activeEmployees = mockEmployees.filter((e) => e.status === "active").length;
  const onLeaveToday = mockEmployees.filter((e) => e.status === "on_leave").length;
  const pendingLeaves = mockLeaveRequests.filter((l) => l.status === "pending").length;
  const totalPayroll = mockPayrollList.reduce((sum, p) => sum + p.netPayroll, 0);

  const stats = [
    { label: "Total Employees", value: mockEmployees.length, icon: Users, color: "text-blue-600" },
    { label: "Present Today", value: activeEmployees, icon: Clock, color: "text-green-600" },
    { label: "On Leave Today", value: onLeaveToday, icon: TrendingUp, color: "text-amber-600" },
    { label: "New Joinings", value: "2", icon: Users, color: "text-purple-600" },
  ];

  const summaryCards = [
    { label: "Total Departments", value: mockDepartments.length },
    { label: "Pending Leaves", value: pendingLeaves, highlight: true },
    { label: "Payroll This Month", value: `Rs. ${totalPayroll.toLocaleString()}` },
  ];

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="HR Dashboard" subtitle="Employee and payroll management" />
      <div className="flex-1 p-6 space-y-6">
        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color} opacity-20`} />
              </div>
            </div>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {summaryCards.map((card) => (
            <div key={card.label} className={`rounded-xl border p-4 shadow-sm ${card.highlight ? "bg-amber-50 border-amber-100" : "bg-white border-gray-100"}`}>
              <p className={`text-xs font-medium ${card.highlight ? "text-amber-600" : "text-gray-500"}`}>{card.label}</p>
              <p className={`text-2xl font-bold mt-1 ${card.highlight ? "text-amber-900" : "text-gray-900"}`}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Recent Leave Requests */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-900">Recent Leave Requests</h3>
            <Link href="/dashboard/hr/leave">
              <Button variant="ghost" size="sm" className="text-[#22C55E] hover:bg-green-50">View All</Button>
            </Link>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Employee", "Type", "From", "To", "Days", "Status"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {mockLeaveRequests.slice(0, 3).map((leave) => (
                <tr key={leave.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-900">{leave.employee}</td>
                  <td className="px-4 py-3 text-gray-600">{leave.type}</td>
                  <td className="px-4 py-3 text-gray-600">{leave.from}</td>
                  <td className="px-4 py-3 text-gray-600">{leave.to}</td>
                  <td className="px-4 py-3 text-gray-600">{leave.days} days</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${leave.status === "pending" ? "bg-amber-100 text-amber-700" : leave.status === "approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/hr/attendance/mark">
            <Button className="bg-[#22C55E] hover:bg-[#16A34A] text-white">Mark Attendance</Button>
          </Link>
          <Link href="/dashboard/hr/leave">
            <Button variant="outline">Approve Leaves</Button>
          </Link>
          <Link href="/dashboard/hr/payroll/new">
            <Button variant="outline">Run Payroll</Button>
          </Link>
          <Link href="/dashboard/hr/employees/new">
            <Button variant="outline">Add Employee</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
