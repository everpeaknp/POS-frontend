"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashHeader } from "@/components/dashboard/dash-header";
import { calculatePayroll, processPayroll, PayrollCalculation } from "@/lib/api/hr";
import toast from "react-hot-toast";

export default function RunPayrollPage() {
  const router = useRouter();
  const [month, setMonth] = useState<string>("");
  const [year] = useState<number>(2081);
  const [calculated, setCalculated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [payrollData, setPayrollData] = useState<PayrollCalculation | null>(null);

  const handleCalculate = async () => {
    if (!month) return;
    
    setLoading(true);
    try {
      const data = await calculatePayroll(month, year);
      setPayrollData(data);
      setCalculated(true);
      toast.success("Payroll calculated successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to calculate payroll");
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async () => {
    if (!payrollData) return;
    
    setLoading(true);
    try {
      await processPayroll({
        month: payrollData.month,
        year: payrollData.year,
        payroll_data: payrollData.payroll_data
      });
      toast.success("Payroll processed successfully");
      router.push("/dashboard/hr/payroll");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to process payroll");
    } finally {
      setLoading(false);
    }
  };

  const nepaliMonths = [
    "Shrawan", "Bhadra", "Ashwin", "Kartik", "Mangsir", "Poush",
    "Magh", "Falgun", "Chaitra", "Baishakh", "Jyeshtha", "Ashadh"
  ];

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Run Payroll" subtitle="Calculate and process employee salaries" />
      <div className="flex-1 p-6 space-y-6">
        <Link href="/dashboard/hr/payroll" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" /> Back to Payroll
        </Link>

        {!calculated ? (
          <div className="max-w-2xl bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Select Period</h3>
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-700">Month*</label>
                <Select value={month} onValueChange={(v) => setMonth(v ?? "")}>
                  <SelectTrigger className="mt-2 h-9 border-gray-200"><SelectValue placeholder="Select month" /></SelectTrigger>
                  <SelectContent>
                    {nepaliMonths.map((m, i) => <SelectItem key={i} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleCalculate} disabled={!month || loading} className="bg-[#22C55E] hover:bg-[#16A34A] text-white w-full">
                {loading ? "Calculating..." : "Calculate Payroll"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payroll Summary - {payrollData?.month} {payrollData?.year}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-600 font-medium">Total Employees</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{payrollData?.total_employees || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium">Total Gross</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">Rs. {payrollData?.total_gross.toLocaleString() || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium">Total Deductions</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">Rs. {payrollData?.total_deductions.toLocaleString() || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium">Net Payroll</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">Rs. {payrollData?.total_net.toLocaleString() || 0}</p>
                </div>
              </div>
            </div>

            {/* Payroll Details */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">Employee Payroll Details</h3>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["Employee", "Basic", "Allowances", "Gross", "Deductions", "Net"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {payrollData?.payroll_data.map((emp) => (
                    <tr key={emp.employee} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-900">{emp.employee_name}</td>
                      <td className="px-4 py-3 text-gray-600">Rs. {emp.basic_salary.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-600">Rs. {emp.allowances.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-800 font-medium">Rs. {emp.gross_salary.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-600">Rs. {emp.deductions.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-800 font-bold">Rs. {emp.net_salary.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button onClick={handleProcess} disabled={loading} className="bg-[#22C55E] hover:bg-[#16A34A] text-white">
                {loading ? "Processing..." : "Process Payroll"}
              </Button>
              <Button variant="outline" onClick={() => { setCalculated(false); setPayrollData(null); }} disabled={loading}>
                Back
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
