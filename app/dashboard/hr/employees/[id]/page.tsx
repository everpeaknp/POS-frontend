"use client";

import { FormattedDate } from "@/components/shared/FormattedDate";
import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Calendar,
  ClipboardCheck,
  Edit,
  FileText,
  Mail,
  Phone,
  User,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  HRPageShell,
  hrCardClass,
  hrStatCardClass,
} from "@/components/dashboard/HRPageShell";
import { EmployeeStatusBadge } from "@/components/hr/EmployeeStatusBadge";
import { EmploymentTypeBadge } from "@/components/hr/EmploymentTypeBadge";
import toast from "react-hot-toast";
import { getEmployee, type Employee } from "@/lib/api/hr";
import { formatNPR } from "@/lib/utils";

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 min-w-0">
      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gray-50 dark:bg-muted flex items-center justify-center">
        <Icon className="h-4 w-4 text-gray-500 dark:text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 dark:text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-gray-900 dark:text-foreground mt-0.5 break-words">
          {value}
        </p>
      </div>
    </div>
  );
}

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadEmployee();
  }, [id]);

  const loadEmployee = async () => {
    try {
      setLoading(true);
      const data = await getEmployee(id);
      setEmployee(data);
    } catch (error) {
      console.error("Failed to load employee:", error);
      toast.error("Failed to load employee details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <HRPageShell title="Employee" subtitle="Loading employee details…" loading />;
  }

  if (!employee) {
    return (
      <HRPageShell
        title="Employee Not Found"
        subtitle="This employee could not be loaded"
      >
        <div className={`${hrCardClass} p-8 text-center`}>
          <p className="text-gray-600 dark:text-muted-foreground mb-4">
            The employee you are looking for does not exist.
          </p>
          <Link href="/dashboard/hr/employees">
            <Button className="bg-[#22C55E] hover:bg-[#16A34A] text-white">View all employees</Button>
          </Link>
        </div>
      </HRPageShell>
    );
  }

  const initials = employee.name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <HRPageShell
      title={
        <>
          {employee.name}
          <span className="text-muted-foreground font-normal font-mono text-sm">
            ID {employee.id}
          </span>
        </>
      }
    >
      <div className="space-y-6">
        <div className={`${hrCardClass} p-6 relative`}>
          <Link
            href={`/dashboard/hr/employees/${id}/edit`}
            className="absolute top-4 right-4 z-10"
          >
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 bg-white dark:bg-card border-gray-200 dark:border-border shadow-sm hover:bg-[#22C55E] hover:text-white hover:border-[#22C55E]"
            >
              <Edit className="h-3.5 w-3.5" />
              Edit
            </Button>
          </Link>

          <div className="flex items-start gap-4 min-w-0 pr-20">
            <div className="w-16 h-16 rounded-full bg-[#22C55E] flex items-center justify-center text-white font-bold text-xl shrink-0 ring-4 ring-[#22C55E]/10">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-foreground flex items-center gap-1.5">
                <User className="h-4 w-4 shrink-0 text-gray-500 dark:text-muted-foreground" />
                <span className="truncate">{employee.name}</span>
              </p>
              {employee.designation ? (
                <p className="text-sm text-gray-500 dark:text-muted-foreground mt-1">
                  {employee.designation}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <DetailItem icon={Phone} label="Phone" value={employee.phone || "—"} />
            <DetailItem icon={Mail} label="Email" value={employee.email || "—"} />
            <DetailItem icon={User} label="Gender" value={employee.gender} />
            <DetailItem icon={Calendar} label="Join date" value={<FormattedDate value={employee.join_date} />} />
            <DetailItem
              icon={User}
              label="Status"
              value={
                <EmployeeStatusBadge
                  status={employee.status as "active" | "inactive" | "on_leave" | "terminated"}
                />
              }
            />
            <DetailItem icon={User} label="Employment type" value={<EmploymentTypeBadge type={employee.employment_type} />} />
          </div>
        </div>

        {/* Quick actions */}
        <div className={`${hrCardClass} p-4`}>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/hr/attendance/mark">
              <Button variant="outline" size="sm" className="h-9 gap-2">
                <ClipboardCheck className="h-4 w-4" />
                Mark attendance
              </Button>
            </Link>
            <Link href={`/dashboard/hr/leave/requests/new?employee=${id}`}>
              <Button variant="outline" size="sm" className="h-9 gap-2">
                <FileText className="h-4 w-4" />
                Apply leave
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2"
              onClick={() => setActiveTab("payroll")}
            >
              <Wallet className="h-4 w-4" />
              View payslips
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className={`${hrCardClass} p-4 sm:p-6`}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="flex w-full h-auto flex-wrap overflow-x-auto justify-start gap-1 p-1 bg-gray-100/80 dark:bg-muted/50">
              <TabsTrigger value="overview" className="shrink-0">
                Overview
              </TabsTrigger>
              <TabsTrigger value="attendance" className="shrink-0">
                Attendance
              </TabsTrigger>
              <TabsTrigger value="leave" className="shrink-0">
                Leave
              </TabsTrigger>
              <TabsTrigger value="payroll" className="shrink-0">
                Payroll
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className={hrStatCardClass}>
                  <p className="text-xs text-gray-500 dark:text-muted-foreground font-medium">Basic salary</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-foreground mt-1">
                    {formatNPR(employee.basic_salary)}
                  </p>
                </div>
                <div className={hrStatCardClass}>
                  <p className="text-xs text-gray-500 dark:text-muted-foreground font-medium">Gross salary</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-foreground mt-1">
                    {formatNPR(employee.gross_salary ?? employee.basic_salary)}
                  </p>
                </div>
                <div className={hrStatCardClass}>
                  <p className="text-xs text-gray-500 dark:text-muted-foreground font-medium">PF (employee)</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-foreground mt-1">
                    {formatNPR(employee.pf_employee ?? 0)}
                  </p>
                </div>
                <div className={hrStatCardClass}>
                  <p className="text-xs text-gray-500 dark:text-muted-foreground font-medium">PF (employer)</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-foreground mt-1">
                    {formatNPR(employee.pf_employer ?? 0)}
                  </p>
                </div>
                <div className={hrStatCardClass}>
                  <p className="text-xs text-gray-500 dark:text-muted-foreground font-medium">Department</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-foreground mt-1">
                    {employee.department_name || "—"}
                  </p>
                </div>
                <div className={hrStatCardClass}>
                  <p className="text-xs text-gray-500 dark:text-muted-foreground font-medium">Date of birth</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-foreground mt-1">
                    <FormattedDate value={employee.dob} />
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="attendance" className="mt-6">
              <p className="text-sm text-gray-600 dark:text-muted-foreground">
                Attendance history for this employee.{" "}
                <Link href="/dashboard/hr/attendance/mark" className="text-[#22C55E] hover:underline">
                  Mark attendance
                </Link>
              </p>
            </TabsContent>

            <TabsContent value="leave" className="mt-6">
              <p className="text-sm text-gray-600 dark:text-muted-foreground">
                Leave requests for this employee.{" "}
                <Link
                  href={`/dashboard/hr/leave/requests/new?employee=${id}`}
                  className="text-[#22C55E] hover:underline"
                >
                  Apply leave
                </Link>
              </p>
            </TabsContent>

            <TabsContent value="payroll" className="mt-6">
              <p className="text-sm text-gray-600 dark:text-muted-foreground">
                Payslip history for this employee.{" "}
                <Link href="/dashboard/hr/payroll" className="text-[#22C55E] hover:underline">
                  View payroll
                </Link>
              </p>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </HRPageShell>
  );
}
