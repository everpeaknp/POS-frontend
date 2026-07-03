"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Building2,
  Clock,
  CalendarOff,
  UserPlus,
  ClipboardCheck,
  Banknote,
  ChevronRight,
  FileText,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { DashHeader } from "@/components/dashboard/dash-header";
import { SkeletonCard } from "@/components/shared/Skeleton";
import { useAuth } from "@/lib/context/AuthContext";
import {
  getHRDashboard,
  getHRReports,
  getLeaveRequests,
  getPayrolls,
  type LeaveRequest,
  type Employee,
  type HRReports,
} from "@/lib/api/hr";
import { formatNPR } from "@/lib/utils";
import toast from "react-hot-toast";

const quickActions = [
  {
    href: "/dashboard/hr/attendance/mark",
    label: "Mark Attendance",
    sub: "Daily check-in",
    icon: ClipboardCheck,
    color: "bg-green-50 text-[#22C55E]",
  },
  {
    href: "/dashboard/hr/leave",
    label: "Approve Leaves",
    sub: "Review requests",
    icon: CalendarOff,
    color: "bg-amber-50 text-amber-600",
  },
  {
    href: "/dashboard/hr/payroll/new",
    label: "Run Payroll",
    sub: "Process salaries",
    icon: Banknote,
    color: "bg-purple-50 text-purple-600",
  },
  {
    href: "/dashboard/hr/employees/new",
    label: "Add Employee",
    sub: "Onboard staff",
    icon: UserPlus,
    color: "bg-blue-50 text-blue-600",
  },
];

function leaveStatusClass(status: string) {
  switch (status) {
    case "pending":
      return "bg-amber-100 text-amber-700";
    case "approved":
      return "bg-green-100 text-green-700";
    case "rejected":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function HRDashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<Awaited<ReturnType<typeof getHRDashboard>> | null>(null);
  const [reports, setReports] = useState<HRReports | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [payrollTotal, setPayrollTotal] = useState(0);

  const workspaceName =
    user?.tenant?.workspace_name || user?.tenant?.name || "Workspace";
  const subtitle = `${workspaceName} · Employee and payroll management`;

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardData, reportsData, leavesData, payrollsData] = await Promise.all([
        getHRDashboard(),
        getHRReports(),
        getLeaveRequests(),
        getPayrolls(),
      ]);
      setDashboard(dashboardData);
      setReports(reportsData);
      const leaves = leavesData.results || [];
      setLeaveRequests(leaves);

      const payrolls = payrollsData.results || [];
      const now = new Date();
      const currentMonth = now.toLocaleString("en-US", { month: "long" });
      const currentYear = now.getFullYear();
      const monthTotal = payrolls
        .filter((p) => p.month === currentMonth && p.year === currentYear)
        .reduce((sum, p) => sum + (p.net_salary ?? 0), 0);
      setPayrollTotal(monthTotal);
    } catch (error) {
      console.error("Failed to fetch HR dashboard data:", error);
      toast.error("Failed to load HR overview");
    } finally {
      setLoading(false);
    }
  };

  const pendingLeaves = useMemo(
    () => leaveRequests.filter((l) => l.status === "pending").length,
    [leaveRequests]
  );

  const recentLeaves = useMemo(
    () =>
      [...leaveRequests]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5),
    [leaveRequests]
  );

  const recentEmployees: Employee[] = dashboard?.recent_employees ?? [];

  const departmentChartData = useMemo(
    () =>
      (reports?.department_data ?? []).map((d) => ({
        name: d.name.length > 12 ? `${d.name.slice(0, 12)}…` : d.name,
        count: d.employee_count,
      })),
    [reports]
  );

  const attendanceChartData = useMemo(
    () =>
      (reports?.attendance_trend ?? []).map((d) => ({
        date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        rate: d.rate,
      })),
    [reports]
  );

  const stats = dashboard
    ? [
        {
          label: "Total Employees",
          value: dashboard.stats.total_employees.toString(),
          sub: `${dashboard.stats.active_employees} active`,
          icon: Users,
          color: "bg-blue-50 text-blue-600",
        },
        {
          label: "Active Employees",
          value: dashboard.stats.active_employees.toString(),
          sub: `${dashboard.stats.inactive_employees} inactive`,
          icon: Clock,
          color: "bg-green-50 text-[#22C55E]",
        },
        {
          label: "On Leave Today",
          value: (reports?.summary.on_leave ?? 0).toString(),
          sub: `${pendingLeaves} pending approval`,
          icon: CalendarOff,
          color: "bg-amber-50 text-amber-600",
        },
        {
          label: "Avg. Basic Salary",
          value: formatNPR(dashboard.stats.average_salary),
          sub: `Total: ${formatNPR(dashboard.stats.total_salary)}`,
          icon: Banknote,
          color: "bg-purple-50 text-purple-600",
        },
      ]
    : [];

  const summaryCards = [
    {
      label: "Total Departments",
      value: (dashboard?.departments?.length ?? 0).toString(),
      highlight: false,
    },
    {
      label: "Pending Leaves",
      value: pendingLeaves.toString(),
      highlight: pendingLeaves > 0,
    },
    {
      label: "Payroll This Month",
      value: formatNPR(payrollTotal),
      highlight: false,
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="HR" subtitle={subtitle} />
        <div className="flex-1 p-6 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="HR" subtitle={subtitle} />
      <div className="flex-1 p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-500">{s.label}</p>
                <div className={`p-2 rounded-lg ${s.color}`}>
                  <s.icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
              <p
                className={`text-xs mt-0.5 ${
                  s.label === "On Leave Today" && pendingLeaves > 0
                    ? "text-amber-600"
                    : "text-gray-400"
                }`}
              >
                {s.sub}
              </p>
            </div>
          ))}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className={`rounded-xl border p-4 shadow-sm ${
                card.highlight
                  ? "bg-amber-50 border-amber-100"
                  : "bg-white border-gray-100"
              }`}
            >
              <p
                className={`text-xs font-medium ${
                  card.highlight ? "text-amber-600" : "text-gray-500"
                }`}
              >
                {card.label}
              </p>
              <p
                className={`text-2xl font-bold mt-1 ${
                  card.highlight ? "text-amber-900" : "text-gray-900"
                }`}
              >
                {card.value}
              </p>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:border-[#22C55E]/30 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-lg ${action.color} group-hover:scale-105 transition-transform`}
                  >
                    <action.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{action.label}</p>
                    <p className="text-xs text-gray-500">{action.sub}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              Employees by Department
            </h3>
            {departmentChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={departmentChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Employees" fill="#22C55E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex flex-col items-center justify-center text-gray-400 text-sm">
                <Building2 className="h-8 w-8 mb-2 text-gray-300" />
                No department data yet
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              Attendance Trend (Last 7 Days)
            </h3>
            {attendanceChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={attendanceChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                  <Tooltip formatter={(v) => [`${v}%`, "Attendance"]} />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    name="Attendance"
                    stroke="#22C55E"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">
                No attendance data yet
              </div>
            )}
          </div>
        </div>

        {/* Recent leave requests */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-700">Recent Leave Requests</h3>
            <Link
              href="/dashboard/hr/leave"
              className="text-xs text-[#22C55E] hover:text-[#16A34A] font-medium inline-flex items-center gap-1"
            >
              View all
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {recentLeaves.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">
              <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              No leave requests yet
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Employee", "Type", "From", "To", "Days", "Status"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-medium text-gray-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentLeaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {leave.employee_name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{leave.leave_type_name}</td>
                    <td className="px-4 py-3 text-gray-600">{leave.start_date}</td>
                    <td className="px-4 py-3 text-gray-600">{leave.end_date}</td>
                    <td className="px-4 py-3 text-gray-600">{leave.days_requested} days</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${leaveStatusClass(leave.status)}`}
                      >
                        {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent joinings */}
        {recentEmployees.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-gray-700">Recent Joinings</h3>
              <Link
                href="/dashboard/hr/employees"
                className="text-xs text-[#22C55E] hover:text-[#16A34A] font-medium inline-flex items-center gap-1"
              >
                View all
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Name", "Department", "Designation", "Join Date"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-medium text-gray-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-900">{emp.name}</td>
                    <td className="px-4 py-3 text-gray-600">{emp.department_name}</td>
                    <td className="px-4 py-3 text-gray-600">{emp.designation}</td>
                    <td className="px-4 py-3 text-gray-600">{emp.join_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
