"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  BarChart3,
  Briefcase,
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
import {
  HRPageShell,
  hrCardClass,
  hrStatCardClass,
  hrTableWrapClass,
} from "@/components/dashboard/HRPageShell";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/context/AuthContext";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { tenantApi } from "@/lib/api/tenant";
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
import { getCurrentBsPeriod } from "@/lib/dates";
import toast from "react-hot-toast";

const quickActions = [
  {
    href: "/dashboard/hr/attendance/mark",
    label: "Mark Attendance",
    sub: "Daily check-in",
    icon: ClipboardCheck,
    color: "bg-green-50 text-[#22C55E] dark:bg-green-500/10 dark:text-green-400",
  },
  {
    href: "/dashboard/hr/leave",
    label: "Approve Leaves",
    sub: "Review requests",
    icon: CalendarOff,
    color: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  },
  {
    href: "/dashboard/hr/payroll/new",
    label: "Run Payroll",
    sub: "Process salaries",
    icon: Banknote,
    color: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
  },
  {
    href: "/dashboard/hr/employees/new",
    label: "Add Employee",
    sub: "Onboard staff",
    icon: UserPlus,
    color: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  },
];

const moduleLinks = [
  {
    href: "/dashboard/hr/employees",
    label: "Employees",
    sub: "Manage staff records",
    icon: Users,
    color: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  },
  {
    href: "/dashboard/hr/departments",
    label: "Departments",
    sub: "Org structure",
    icon: Building2,
    color: "bg-green-50 text-[#22C55E] dark:bg-green-500/10 dark:text-green-400",
  },
  {
    href: "/dashboard/hr/attendance",
    label: "Attendance",
    sub: "Daily records",
    icon: ClipboardCheck,
    color: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
  },
  {
    href: "/dashboard/hr/leave",
    label: "Leave Management",
    sub: "Requests & balances",
    icon: CalendarOff,
    color: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  },
  {
    href: "/dashboard/hr/payroll",
    label: "Payroll",
    sub: "Salary processing",
    icon: Banknote,
    color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  },
  {
    href: "/dashboard/hr/reports",
    label: "HR Reports",
    sub: "Analytics & exports",
    icon: BarChart3,
    color: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
  },
];

function leaveStatusClass(status: string) {
  switch (status) {
    case "pending":
      return "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400";
    case "approved":
      return "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400";
    case "rejected":
      return "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-muted dark:text-muted-foreground";
  }
}

function buildDashboardFromReports(reports: HRReports) {
  return {
    stats: {
      total_employees: reports.summary.total_employees,
      active_employees: reports.summary.active_employees,
      inactive_employees: 0,
      terminated_employees: 0,
      total_salary: 0,
      average_salary: reports.summary.avg_salary,
    },
    departments: reports.department_data.map((d) => ({
      id: d.name,
      name: d.name,
      emp_count: d.employee_count,
    })),
    employment_types: reports.employment_type_data,
    recent_employees: [],
  };
}

export default function HRDashboardPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const { hasModuleAccess, canView } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [enablingModule, setEnablingModule] = useState(false);
  const [dashboard, setDashboard] = useState<Awaited<ReturnType<typeof getHRDashboard>> | null>(null);
  const [reports, setReports] = useState<HRReports | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [payrollTotal, setPayrollTotal] = useState(0);

  const workspaceName =
    user?.tenant?.workspace_name || user?.tenant?.name || "Workspace";
  const subtitle = `${workspaceName} · Employee and payroll management`;
  const hrModuleActive = hasModuleAccess("hr");
  const canEnableHr = user?.role === "admin" && !!user?.tenant?.slug;

  useEffect(() => {
    if (!hrModuleActive) {
      setLoading(false);
      return;
    }
    fetchDashboardData();
  }, [hrModuleActive]);

  const handleEnableHrModule = async () => {
    if (!user?.tenant?.slug) return;

    try {
      setEnablingModule(true);
      await tenantApi.activateModule(user.tenant.slug, "hr");
      await refreshUser();
      toast.success("HR & Payroll module enabled");
    } catch (error) {
      console.error("Failed to enable HR module:", error);
      toast.error("Failed to enable HR module");
    } finally {
      setEnablingModule(false);
    }
  };

  const fetchDashboardData = async () => {
    if (!canView("hr")) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [dashboardResult, reportsResult, leavesResult, payrollsResult] =
        await Promise.allSettled([
          getHRDashboard(),
          getHRReports(),
          getLeaveRequests(),
          getPayrolls(),
        ]);

      if (dashboardResult.status === "fulfilled") {
        setDashboard(dashboardResult.value);
      } else if (reportsResult.status === "fulfilled") {
        setDashboard(buildDashboardFromReports(reportsResult.value));
      }

      if (reportsResult.status === "fulfilled") {
        setReports(reportsResult.value);
      }

      if (leavesResult.status === "fulfilled") {
        setLeaveRequests(leavesResult.value.results || []);
      }

      if (payrollsResult.status === "fulfilled") {
        const payrolls = payrollsResult.value.results || [];
        const bsPeriod = getCurrentBsPeriod();
        const monthTotal = payrolls
          .filter((p) => p.month === bsPeriod.month && p.year === bsPeriod.year)
          .reduce((sum, p) => sum + (p.net_salary ?? 0), 0);
        setPayrollTotal(monthTotal);
      }

      const allFailed =
        dashboardResult.status === "rejected" &&
        reportsResult.status === "rejected" &&
        leavesResult.status === "rejected" &&
        payrollsResult.status === "rejected";

      if (allFailed) {
        toast.error("Failed to load HR overview");
      }
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

  const employmentChartData = useMemo(
    () =>
      (reports?.employment_type_data ?? []).map((d) => ({
        name: d.employment_type.replace(/_/g, " "),
        count: d.count,
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
          color: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
        },
        {
          label: "Departments",
          value: (dashboard.departments?.length ?? 0).toString(),
          sub: `${dashboard.stats.inactive_employees} inactive`,
          icon: Building2,
          color: "bg-green-50 text-[#22C55E] dark:bg-green-500/10 dark:text-green-400",
        },
        {
          label: "On Leave Today",
          value: (reports?.summary.on_leave ?? 0).toString(),
          sub:
            pendingLeaves > 0
              ? `${pendingLeaves} pending approval`
              : "No pending requests",
          icon: CalendarOff,
          color: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
          highlight: pendingLeaves > 0,
        },
        {
          label: "Payroll This Month",
          value: formatNPR(payrollTotal),
          sub: `Avg: ${formatNPR(dashboard.stats.average_salary)}`,
          icon: Banknote,
          color: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
        },
      ]
    : [];

  if (!hrModuleActive) {
    return (
      <HRPageShell title="HR" subtitle={subtitle}>
        <div className={`${hrCardClass} max-w-xl mx-auto p-8 text-center`}>
          <Users className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">HR & Payroll is not enabled</h2>
          <p className="text-sm text-muted-foreground mt-2">
            This organization has not activated the HR module yet. Enable it to manage employees,
            attendance, leave, and payroll.
          </p>
          {canEnableHr ? (
            <Button
              className="mt-6 bg-[#22C55E] hover:bg-[#16A34A] text-white"
              onClick={handleEnableHrModule}
              disabled={enablingModule}
            >
              {enablingModule ? "Enabling..." : "Enable HR & Payroll"}
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground mt-6">
              Contact your organization admin to enable this module.
            </p>
          )}
        </div>
      </HRPageShell>
    );
  }

  if (loading) {
    return (
      <HRPageShell title="HR" subtitle={subtitle} loading />
    );
  }

  return (
    <HRPageShell title="HR" subtitle={subtitle}>
      <div className="space-y-6 w-full">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className={hrStatCardClass}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-500 dark:text-muted-foreground">{s.label}</p>
                <div className={`p-2 rounded-lg ${s.color}`}>
                  <s.icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-foreground">{s.value}</p>
              <p
                className={`text-xs mt-0.5 ${
                  "highlight" in s && s.highlight
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-gray-400 dark:text-muted-foreground"
                }`}
              >
                {s.sub}
              </p>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-foreground mb-3">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className={`${hrCardClass} p-4 hover:border-[#22C55E]/30 hover:shadow-md transition-all group`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-lg ${action.color} group-hover:scale-105 transition-transform`}
                  >
                    <action.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-foreground text-sm">
                      {action.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-muted-foreground">{action.sub}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Charts + module navigation */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          <div className="xl:col-span-8 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className={`${hrCardClass} p-5`}>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-foreground mb-4">
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
                  <div className="h-[220px] flex flex-col items-center justify-center text-gray-400 dark:text-muted-foreground text-sm">
                    <Building2 className="h-8 w-8 mb-2 text-gray-300 dark:text-muted-foreground/50" />
                    No department data yet
                  </div>
                )}
              </div>

              <div className={`${hrCardClass} p-5`}>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-foreground mb-4">
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
                  <div className="h-[220px] flex flex-col items-center justify-center text-gray-400 dark:text-muted-foreground text-sm">
                    <Clock className="h-8 w-8 mb-2 text-gray-300 dark:text-muted-foreground/50" />
                    No attendance data yet
                  </div>
                )}
              </div>
            </div>

            {employmentChartData.length > 0 && (
              <div className={`${hrCardClass} p-5`}>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-foreground mb-4">
                  Employment Types
                </h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={employmentChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      width={100}
                    />
                    <Tooltip />
                    <Bar dataKey="count" name="Employees" fill="#6366F1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className={`${hrCardClass} p-5 xl:col-span-4`}>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-foreground mb-4">
              Module Navigation
            </h3>
            <div className="space-y-2">
              {moduleLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-50 dark:border-border hover:bg-gray-50 dark:hover:bg-muted/40 hover:border-gray-100 dark:hover:border-border transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg shrink-0 ${link.color}`}>
                      <link.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-foreground">
                        {link.label}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-muted-foreground truncate">
                        {link.sub}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 dark:text-muted-foreground group-hover:text-gray-500 dark:group-hover:text-foreground transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent leave requests */}
        <div className={hrTableWrapClass}>
          <div className="px-5 py-4 border-b border-gray-100 dark:border-border flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-foreground">
              Recent Leave Requests
            </h3>
            <Link
              href="/dashboard/hr/leave"
              className="text-xs text-[#22C55E] hover:text-[#16A34A] font-medium inline-flex items-center gap-1"
            >
              View all
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {recentLeaves.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No leave requests"
              description="Leave requests from employees will appear here for review."
              actionLabel="Go to Leave"
              actionHref="/dashboard/hr/leave"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-muted border-b border-gray-100 dark:border-border">
                  <tr>
                    {["Employee", "Type", "From", "To", "Days", "Status"].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-muted-foreground uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-border">
                  {recentLeaves.map((leave) => (
                    <tr
                      key={leave.id}
                      className="hover:bg-gray-50/50 dark:hover:bg-muted/30 cursor-pointer"
                      onClick={() => router.push(`/dashboard/hr/leave/requests/${leave.id}`)}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-foreground">
                        {leave.employee_name}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground">
                        {leave.leave_type_name}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground">
                        {leave.start_date}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground">
                        {leave.end_date}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground">
                        {leave.days_requested} days
                      </td>
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
            </div>
          )}
        </div>

        {/* Recent joinings */}
        {recentEmployees.length > 0 && (
          <div className={hrTableWrapClass}>
            <div className="px-5 py-4 border-b border-gray-100 dark:border-border flex justify-between items-center">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-foreground">
                Recent Joinings
              </h3>
              <Link
                href="/dashboard/hr/employees"
                className="text-xs text-[#22C55E] hover:text-[#16A34A] font-medium inline-flex items-center gap-1"
              >
                View all
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-muted border-b border-gray-100 dark:border-border">
                  <tr>
                    {["Name", "Department", "Designation", "Join Date"].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-muted-foreground uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-border">
                  {recentEmployees.map((emp) => (
                    <tr
                      key={emp.id}
                      className="hover:bg-gray-50/50 dark:hover:bg-muted/30 cursor-pointer"
                      onClick={() => router.push(`/dashboard/hr/employees/${emp.id}`)}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-foreground">
                        {emp.name}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground">
                        {emp.department_name}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Briefcase className="h-3.5 w-3.5 text-gray-400" />
                          {emp.designation}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground">
                        {emp.join_date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </HRPageShell>
  );
}
