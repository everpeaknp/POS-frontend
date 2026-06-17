"use client";

import Link from "next/link";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashHeader } from "@/components/dashboard/dash-header";
import { mockEmployees, mockPayrollList } from "@/lib/mock-data/hr";

export default function PayslipPage({ params }: { params: { id: string; employeeId: string } }) {
  const payroll = mockPayrollList.find((p) => p.id === params.id);
  const employee = mockEmployees.find((e) => e.id === params.employeeId);

  if (!payroll || !employee) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Payslip Not Found" />
      </div>
    );
  }

  const gross = Math.round(employee.salary * 1.15);
  const deductions = Math.round(employee.salary * 0.15);
  const net = employee.salary;

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title={`Payslip - ${employee.name}`} subtitle={payroll.month} />
      <div className="flex-1 p-6 space-y-6">
        <Link href={`/dashboard/hr/payroll/${payroll.id}`} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" /> Back to Payroll
        </Link>

        {/* Payslip */}
        <div className="max-w-3xl bg-white rounded-xl border border-gray-100 shadow-sm p-8">
          {/* Header */}
          <div className="text-center mb-8 pb-8 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">SALARY SLIP</h1>
            <p className="text-sm text-gray-600 mt-2">Month: {payroll.month}</p>
          </div>

          {/* Employee Info */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <p className="text-xs text-gray-600 font-medium">Employee Name</p>
              <p className="text-sm font-bold text-gray-900 mt-1">{employee.name}</p>
              <p className="text-xs text-gray-600 font-medium mt-3">Designation</p>
              <p className="text-sm font-bold text-gray-900 mt-1">{employee.designation}</p>
              <p className="text-xs text-gray-600 font-medium mt-3">Department</p>
              <p className="text-sm font-bold text-gray-900 mt-1">{employee.department}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Employee ID</p>
              <p className="text-sm font-bold text-gray-900 mt-1">{employee.id}</p>
              <p className="text-xs text-gray-600 font-medium mt-3">Join Date</p>
              <p className="text-sm font-bold text-gray-900 mt-1">{employee.joinDate}</p>
              <p className="text-xs text-gray-600 font-medium mt-3">PAN</p>
              <p className="text-sm font-bold text-gray-900 mt-1">-</p>
            </div>
          </div>

          {/* Earnings */}
          <div className="mb-8">
            <h3 className="text-sm font-bold text-gray-900 mb-3">EARNINGS</h3>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="py-2 text-gray-600">Basic Salary</td>
                  <td className="py-2 text-right font-medium text-gray-900">Rs. {employee.salary.toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="py-2 text-gray-600">House Rent Allowance</td>
                  <td className="py-2 text-right font-medium text-gray-900">Rs. {Math.round(employee.salary * 0.1).toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="py-2 text-gray-600">Travel Allowance</td>
                  <td className="py-2 text-right font-medium text-gray-900">Rs. {Math.round(employee.salary * 0.03).toLocaleString()}</td>
                </tr>
                <tr className="bg-gray-50 font-bold">
                  <td className="py-2 text-gray-900">Total Earnings</td>
                  <td className="py-2 text-right text-gray-900">Rs. {gross.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Deductions */}
          <div className="mb-8">
            <h3 className="text-sm font-bold text-gray-900 mb-3">DEDUCTIONS</h3>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="py-2 text-gray-600">PF (Employee 10%)</td>
                  <td className="py-2 text-right font-medium text-gray-900">Rs. {Math.round(employee.salary * 0.1).toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="py-2 text-gray-600">Income Tax</td>
                  <td className="py-2 text-right font-medium text-gray-900">Rs. {Math.round(employee.salary * 0.05).toLocaleString()}</td>
                </tr>
                <tr className="bg-gray-50 font-bold">
                  <td className="py-2 text-gray-900">Total Deductions</td>
                  <td className="py-2 text-right text-gray-900">Rs. {deductions.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Net Pay */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-gray-900">NET PAY</span>
              <span className="text-2xl font-bold text-green-600">Rs. {net.toLocaleString()}</span>
            </div>
            <p className="text-xs text-gray-600 mt-2">Amount in Words: Forty Four Thousand Seven Hundred Rupees Only</p>
          </div>

          {/* Attendance */}
          <div className="mb-8 pb-8 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-900 mb-3">ATTENDANCE</h3>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Working Days</p>
                <p className="font-bold text-gray-900">26</p>
              </div>
              <div>
                <p className="text-gray-600">Present</p>
                <p className="font-bold text-gray-900">25</p>
              </div>
              <div>
                <p className="text-gray-600">Absent</p>
                <p className="font-bold text-gray-900">1</p>
              </div>
              <div>
                <p className="text-gray-600">Late</p>
                <p className="font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-8 text-center text-xs">
            <div>
              <div className="h-12 border-t border-gray-400 mb-1" />
              <p className="font-medium text-gray-900">Employee Signature</p>
            </div>
            <div>
              <div className="h-12 border-t border-gray-400 mb-1" />
              <p className="font-medium text-gray-900">HR Manager</p>
            </div>
            <div>
              <div className="h-12 border-t border-gray-400 mb-1" />
              <p className="font-medium text-gray-900">Authorized Signatory</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button className="bg-[#22C55E] hover:bg-[#16A34A] text-white gap-2">
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> Download PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
