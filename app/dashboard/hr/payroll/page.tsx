"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Wallet, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  HRPageShell,
  hrStatCardClass,
  hrTableWrapClass,
} from "@/components/dashboard/HRPageShell";
import { EmptyState } from "@/components/shared/EmptyState";
import { PayrollStatusBadge } from "@/components/hr/PayrollStatusBadge";
import { getPayrolls, Payroll } from "@/lib/api/hr";
import toast from "react-hot-toast";

interface PayrollGroup {
  id: string;
  month: string;
  year: number;
  monthKey: string;
  employees: number;
  grossSalary: number;
  deductions: number;
  netPayroll: number;
  status: "draft" | "processed" | "paid";
}

type StatusFilter = "all" | "draft" | "processed" | "paid";

export default function PayrollPage() {
  const router = useRouter();
  const [month, setMonth] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const fetchPayrolls = async () => {
    setLoading(true);
    try {
      const data = await getPayrolls();
      const records = data.results || [];
      setPayrolls(records);

      const months = Array.from(new Set(records.map((p) => `${p.year}-${p.month}`)));
      setAvailableMonths(months);
    } catch {
      toast.error("Failed to load payroll records");
    } finally {
      setLoading(false);
    }
  };

  const groupedPayrolls: PayrollGroup[] = useMemo(() => {
    const groups: PayrollGroup[] = [];
    const monthGroups = new Map<string, Payroll[]>();

    payrolls.forEach((p) => {
      const key = `${p.year}-${p.month}`;
      if (!monthGroups.has(key)) {
        monthGroups.set(key, []);
      }
      monthGroups.get(key)!.push(p);
    });

    monthGroups.forEach((records, key) => {
      const [year, monthName] = key.split("-");
      const allStatuses = records.map((r) => r.status);
      let groupStatus: "draft" | "processed" | "paid" = "processed";

      if (allStatuses.every((s) => s === "paid")) {
        groupStatus = "paid";
      } else if (allStatuses.every((s) => s === "draft")) {
        groupStatus = "draft";
      }

      groups.push({
        id: key,
        month: monthName,
        year: parseInt(year),
        monthKey: key,
        employees: records.length,
        grossSalary: records.reduce((sum, r) => sum + parseFloat(r.gross_salary.toString()), 0),
        deductions: records.reduce((sum, r) => sum + parseFloat(r.deductions.toString()), 0),
        netPayroll: records.reduce((sum, r) => sum + parseFloat(r.net_salary.toString()), 0),
        status: groupStatus,
      });
    });

    return groups;
  }, [payrolls]);

  const filtered = useMemo(() => {
    return groupedPayrolls.filter((p) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !q ||
        p.month.toLowerCase().includes(q) ||
        String(p.year).includes(q) ||
        p.monthKey.toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (month !== "all" && p.monthKey !== month) return false;
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      return true;
    });
  }, [groupedPayrolls, searchTerm, month, statusFilter]);

  const totalDeductions = filtered.reduce((sum, p) => sum + p.deductions, 0);
  const totalNet = filtered.reduce((sum, p) => sum + p.netPayroll, 0);
  const totalEmployees = filtered.reduce((sum, p) => sum + p.employees, 0);

  const stats = [
    { label: "Total Payroll", value: `Rs. ${totalNet.toLocaleString()}` },
    { label: "Employees Paid", value: totalEmployees },
    { label: "Total Deductions", value: `Rs. ${totalDeductions.toLocaleString()}` },
    { label: "Net Disbursed", value: `Rs. ${totalNet.toLocaleString()}` },
  ];

  if (!loading && payrolls.length === 0) {
    return (
      <HRPageShell title="Payroll" subtitle="Employee salary management">
        <EmptyState
          icon={Wallet}
          title="No payroll records yet"
          description="Run your first payroll to process employee salaries"
          actionLabel="Run Payroll"
          actionHref="/dashboard/hr/payroll/new"
        />
      </HRPageShell>
    );
  }

  return (
    <HRPageShell title="Payroll" subtitle="Employee salary management" loading={loading}>
      <div className="flex gap-3 items-center justify-between flex-wrap">
        <div className="flex gap-3 items-center flex-1 min-w-0 flex-wrap">
          <div className="relative flex-1 max-w-md min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by month or year..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-sm border-gray-200 bg-white"
            />
          </div>
          <Select value={month} onValueChange={(v) => setMonth(v ?? "all")}>
            <SelectTrigger className="h-9 w-44 text-sm border-gray-200 bg-white shrink-0">
              <SelectValue placeholder="All Months" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              {availableMonths.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter((v as StatusFilter) || "all")}
          >
            <SelectTrigger className="h-9 w-40 text-sm border-gray-200 bg-white shrink-0">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="processed">Processed</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Link href="/dashboard/hr/payroll/new" className="shrink-0">
          <Button size="sm" className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5">
            <Plus className="h-4 w-4" /> Run Payroll
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className={hrStatCardClass}>
            <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className={hrTableWrapClass}>
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No payroll records found matching your filters
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Month", "Year", "Employees", "Gross Salary", "Deductions", "Net Payroll", "Status"].map(
                  (h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((payroll) => (
                <tr
                  key={payroll.id}
                  className="hover:bg-gray-50/50 cursor-pointer"
                  onClick={() =>
                    router.push(`/dashboard/hr/payroll/${encodeURIComponent(payroll.monthKey)}`)
                  }
                >
                  <td className="px-4 py-3 font-medium text-gray-900">{payroll.month}</td>
                  <td className="px-4 py-3 text-gray-600">{payroll.year}</td>
                  <td className="px-4 py-3 text-gray-600">{payroll.employees}</td>
                  <td className="px-4 py-3 text-gray-800 font-medium">
                    Rs. {payroll.grossSalary.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    Rs. {payroll.deductions.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-800 font-medium">
                    Rs. {payroll.netPayroll.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <PayrollStatusBadge status={payroll.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </HRPageShell>
  );
}
