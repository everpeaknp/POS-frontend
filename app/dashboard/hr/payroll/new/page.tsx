"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HRPageShell, hrCardClass, hrTableWrapClass } from "@/components/dashboard/HRPageShell";
import { calculatePayroll, processPayroll, PayrollCalculation } from "@/lib/api/hr";
import { BS_YEAR_MAX, BS_YEAR_MIN, getCurrentBsPeriod, NEPALI_MONTHS } from "@/lib/dates";
import toast from "react-hot-toast";

export default function RunPayrollPage() {
  const router = useRouter();
  const defaultPeriod = useMemo(() => getCurrentBsPeriod(), []);
  const [month, setMonth] = useState<string>(defaultPeriod.month);
  const [year, setYear] = useState<number>(defaultPeriod.year);  const [calculated, setCalculated] = useState(false);
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

  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let y = BS_YEAR_MAX; y >= BS_YEAR_MIN; y -= 1) {
      years.push(y);
    }
    return years;
  }, []);

  return (    <HRPageShell title="Run Payroll" subtitle="Calculate and process employee salaries">
      {!calculated ? (
        <div className={`${hrCardClass} p-6 lg:p-8 w-full`}>
            <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Select Period</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-end">
              <div>
                <Label className="text-sm font-medium text-gray-700">Month*</Label>
                <Select value={month} onValueChange={(v) => setMonth(v ?? "")}>
                  <SelectTrigger className="mt-1 h-9 border-gray-200"><SelectValue placeholder="Select month" /></SelectTrigger>
                  <SelectContent>
                    {NEPALI_MONTHS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-foreground">Year (BS)</Label>
                <Select
                  value={String(year)}
                  onValueChange={(v) => setYear(Number(v))}
                  disabled={loading}
                >
                  <SelectTrigger className="mt-1 h-9 border-gray-200 dark:border-border">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>              <div className="sm:col-span-2 lg:col-span-1">
                <Button
                  onClick={handleCalculate}
                  disabled={!month || loading}
                  className="w-full h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white"
                >
                  {loading ? "Calculating..." : "Calculate Payroll"}
                </Button>
              </div>
            </div>
            <div className="flex justify-end pt-6 mt-6 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 w-full">
            <div className={`${hrCardClass} p-6 lg:p-8 w-full`}>
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">
                Payroll Summary — {payrollData?.month} {payrollData?.year}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 font-medium">Total Employees</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{payrollData?.total_employees || 0}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 font-medium">Total Gross</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">Rs. {payrollData?.total_gross.toLocaleString() || 0}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 font-medium">Total Deductions</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">Rs. {payrollData?.total_deductions.toLocaleString() || 0}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 font-medium">Net Payroll</p>
                  <p className="text-2xl font-bold text-[#22C55E] mt-1">Rs. {payrollData?.total_net.toLocaleString() || 0}</p>
                </div>
              </div>
            </div>

            <div className={hrTableWrapClass}>
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">Employee Payroll Details</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {["Employee", "Basic", "Allowances", "Gross", "Deductions", "Net"].map((h) => (
                        <th key={h} className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {payrollData?.payroll_data.map((emp) => (
                      <tr key={emp.employee} className="hover:bg-gray-50/50">
                        <td className="px-6 py-3 font-medium text-gray-900 whitespace-nowrap">{emp.employee_name}</td>
                        <td className="px-6 py-3 text-gray-600 whitespace-nowrap">Rs. {emp.basic_salary.toLocaleString()}</td>
                        <td className="px-6 py-3 text-gray-600 whitespace-nowrap">Rs. {emp.allowances.toLocaleString()}</td>
                        <td className="px-6 py-3 text-gray-800 font-medium whitespace-nowrap">Rs. {emp.gross_salary.toLocaleString()}</td>
                        <td className="px-6 py-3 text-gray-600 whitespace-nowrap">Rs. {emp.deductions.toLocaleString()}</td>
                        <td className="px-6 py-3 text-gray-800 font-bold whitespace-nowrap">Rs. {emp.net_salary.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => { setCalculated(false); setPayrollData(null); }}
                disabled={loading}
              >
                Back
              </Button>
              <Button onClick={handleProcess} disabled={loading} className="bg-[#22C55E] hover:bg-[#16A34A] text-white px-6">
                {loading ? "Processing..." : "Process Payroll"}
              </Button>
            </div>
          </div>
        )}
    </HRPageShell>
  );
}
