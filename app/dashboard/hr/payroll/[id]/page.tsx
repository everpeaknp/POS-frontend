"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { HRPageShell, hrCardClass, hrStatCardClass, hrTableWrapClass } from "@/components/dashboard/HRPageShell";
import { PayrollStatusBadge } from "@/components/hr/PayrollStatusBadge";
import { getPayrolls, type Payroll } from "@/lib/api/hr";
import toast from "react-hot-toast";

export default function PayrollDetailPage() {
  const params = useParams<{ id: string }>();
  const monthKey = decodeURIComponent(params.id);
  const [records, setRecords] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const dashIdx = monthKey.indexOf("-");
        const year = monthKey.slice(0, dashIdx);
        const month = monthKey.slice(dashIdx + 1);
        const data = await getPayrolls({ year: Number(year), month });
        setRecords(data.results || []);
      } catch {
        toast.error("Failed to load payroll records");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [monthKey]);

  const dashIdx = monthKey.indexOf("-");
  const year = monthKey.slice(0, dashIdx);
  const month = monthKey.slice(dashIdx + 1);
  const gross = records.reduce((s, r) => s + Number(r.gross_salary), 0);
  const deductions = records.reduce((s, r) => s + Number(r.deductions), 0);
  const net = records.reduce((s, r) => s + Number(r.net_salary), 0);
  const status = records.every((r) => r.status === "paid")
    ? "paid"
    : records.every((r) => r.status === "draft")
      ? "draft"
      : "processed";

  if (loading) {
    return (
      <HRPageShell title="Payroll" subtitle="Loading payroll batch…" loading />
    );
  }

  return (
    <HRPageShell title={`${month} ${year}`} subtitle="Payroll batch details">
      <Link href="/dashboard/hr/payroll" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 -mt-2">
        <ChevronLeft className="h-4 w-4" /> Back to Payroll
      </Link>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={hrStatCardClass}>
            <p className="text-xs text-gray-500 font-medium">Total Employees</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{records.length}</p>
          </div>
          <div className={hrStatCardClass}>
            <p className="text-xs text-gray-500 font-medium">Gross Salary</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">Rs. {gross.toLocaleString()}</p>
          </div>
          <div className={hrStatCardClass}>
            <p className="text-xs text-gray-500 font-medium">Total Deductions</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">Rs. {deductions.toLocaleString()}</p>
          </div>
          <div className={hrStatCardClass}>
            <p className="text-xs text-gray-500 font-medium">Net Payroll</p>
            <p className="text-2xl font-bold text-green-600 mt-1">Rs. {net.toLocaleString()}</p>
          </div>
        </div>

        <div className={`${hrCardClass} p-6 flex items-center justify-between`}>
          <PayrollStatusBadge status={status} />
        </div>

        <div className={hrTableWrapClass}>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Employee", "Department", "Gross", "Deductions", "Net", "Status", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-900">{r.employee_name}</td>
                  <td className="px-4 py-3 text-gray-600">{r.department_name}</td>
                  <td className="px-4 py-3">Rs. {Number(r.gross_salary).toLocaleString()}</td>
                  <td className="px-4 py-3">Rs. {Number(r.deductions).toLocaleString()}</td>
                  <td className="px-4 py-3 font-medium">Rs. {Number(r.net_salary).toLocaleString()}</td>
                  <td className="px-4 py-3"><PayrollStatusBadge status={r.status} /></td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/hr/payroll/${encodeURIComponent(monthKey)}/slip/${r.id}`}
                      className="text-[#22C55E] hover:underline text-xs font-medium"
                    >
                      View slip
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </HRPageShell>
  );
}
