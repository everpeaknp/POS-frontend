"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { DashHeader } from "@/components/dashboard/dash-header";
import { getPayroll, type Payroll } from "@/lib/api/hr";
import toast from "react-hot-toast";

export default function PayslipPage() {
  const params = useParams<{ id: string; employeeId: string }>();
  const monthKey = decodeURIComponent(params.id);
  const payrollId = params.employeeId;
  const [record, setRecord] = useState<Payroll | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getPayroll(payrollId);
        setRecord(data);
      } catch {
        toast.error("Failed to load payslip");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [payrollId]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Payslip" subtitle="Loading..." />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Payslip Not Found" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title={`Payslip - ${record.employee_name}`} subtitle={`${record.month} ${record.year}`} />
      <div className="flex-1 p-6 space-y-6">
        <Link
          href={`/dashboard/hr/payroll/${encodeURIComponent(monthKey)}`}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Payroll
        </Link>

        <div className="max-w-3xl bg-white rounded-xl border border-gray-100 shadow-sm p-8">
          <div className="text-center mb-8 pb-8 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">SALARY SLIP</h1>
            <p className="text-sm text-gray-600 mt-2">{record.month} {record.year}</p>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <p className="text-xs text-gray-600 font-medium">Employee</p>
              <p className="text-sm font-bold text-gray-900 mt-1">{record.employee_name}</p>
              <p className="text-xs text-gray-600 font-medium mt-3">Department</p>
              <p className="text-sm font-bold text-gray-900 mt-1">{record.department_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Status</p>
              <p className="text-sm font-bold text-gray-900 mt-1 capitalize">{record.status}</p>
              {record.processed_date && (
                <>
                  <p className="text-xs text-gray-600 font-medium mt-3">Processed</p>
                  <p className="text-sm font-bold text-gray-900 mt-1">
                    {new Date(record.processed_date).toLocaleDateString()}
                  </p>
                </>
              )}
            </div>
          </div>

          <table className="w-full text-sm mb-8">
            <tbody className="divide-y divide-gray-200">
              <tr><td className="py-2 text-gray-600">Basic Salary</td><td className="py-2 text-right font-medium">Rs. {Number(record.basic_salary).toLocaleString()}</td></tr>
              <tr><td className="py-2 text-gray-600">Allowances</td><td className="py-2 text-right font-medium">Rs. {Number(record.allowances).toLocaleString()}</td></tr>
              <tr className="bg-gray-50 font-bold"><td className="py-2">Gross Salary</td><td className="py-2 text-right">Rs. {Number(record.gross_salary).toLocaleString()}</td></tr>
              <tr><td className="py-2 text-gray-600">Deductions</td><td className="py-2 text-right font-medium text-red-600">Rs. {Number(record.deductions).toLocaleString()}</td></tr>
            </tbody>
          </table>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-gray-900">NET PAY</span>
              <span className="text-2xl font-bold text-green-600">Rs. {Number(record.net_salary).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
