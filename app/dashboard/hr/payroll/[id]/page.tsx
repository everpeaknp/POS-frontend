"use client";

import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashHeader } from "@/components/dashboard/dash-header";
import { PayrollStatusBadge } from "@/components/hr/PayrollStatusBadge";
import { mockPayrollList, mockEmployees } from "@/lib/mock-data/hr";

export default function PayrollDetailPage({ params }: { params: { id: string } }) {
  const payroll = mockPayrollList.find((p) => p.id === params.id);

  if (!payroll) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Payroll Not Found" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title={payroll.month} subtitle="Payroll details and employee payslips" />
      <div className="flex-1 p-6 space-y-6">
        <Link href="/dashboard/hr/payroll" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" /> Back to Payroll
        </Link>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">Total Employees</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{payroll.employees}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">Gross Salary</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">Rs. {payroll.grossSalary.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">Total Deductions</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">Rs. {payroll.deductions.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">Net Payroll</p>
            <p className="text-2xl font-bold text-green-600 mt-1">Rs. {payroll.netPayroll.toLocaleString()}</p>
          </div>
        </div>

        {/* Status and Actions */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600 font-medium">Status</p>
              <PayrollStatusBadge status={payroll.status} />
            </div>
            <div className="flex gap-3">
              {payroll.status === "draft" && (
                <Button className="bg-[#22C55E] hover:bg-[#16A34A] text-white">Mark as Paid</Button>
              )}
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" /> Export
              </Button>
            </div>
          </div>
        </div>

        {/* Employee Payslips */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Employee Payslips</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Employee", "Gross", "Deductions", "Net Pay", "Status", "Action"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {mockEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-900">{emp.name}</td>
                  <td className="px-4 py-3 text-gray-600">Rs. {Math.round(emp.salary * 1.15).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-600">Rs. {Math.round(emp.salary * 0.15).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-800 font-bold">Rs. {emp.salary.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Paid</span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/hr/payroll/${payroll.id}/slip/${emp.id}`}>
                      <Button variant="ghost" size="sm" className="text-[#22C55E] hover:bg-green-50">View Slip</Button>
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
