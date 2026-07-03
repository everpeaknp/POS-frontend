"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { DashHeader } from "@/components/dashboard/dash-header";
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
        const data = await getPayrolls();
        const all = data.results || [];
        const filtered = all.filter((p) => `${p.year}-${p.month}` === monthKey);
        setRecords(filtered);
      } catch {
        toast.error("Failed to load payroll records");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [monthKey]);

  const [year, month] = monthKey.split("-");
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
      <div className="flex flex-col min-h-full">
        <DashHeader title="Payroll" subtitle="Loading..." />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title={`${month} ${year}`} subtitle="Payroll batch details" />
      <div className="flex-1 p-6 space-y-6">
        <Link href="/dashboard/hr/payroll" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" /> Back to Payroll
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">Total Employees</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{records.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">Gross Salary</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">Rs. {gross.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">Total Deductions</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">Rs. {deductions.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">Net Payroll</p>
            <p className="text-2xl font-bold text-green-600 mt-1">Rs. {net.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex items-center justify-between">
          <PayrollStatusBadge status={status} />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
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
    </div>
  );
}
