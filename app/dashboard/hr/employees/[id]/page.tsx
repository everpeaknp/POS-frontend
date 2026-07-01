"use client";

import { FormattedDate } from "@/components/shared/FormattedDate";
import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashHeader } from "@/components/dashboard/dash-header";
import { EmployeeStatusBadge } from "@/components/hr/EmployeeStatusBadge";
import { EmploymentTypeBadge } from "@/components/hr/EmploymentTypeBadge";
import toast from "react-hot-toast";
import { getEmployee, type Employee } from "@/lib/api/hr";

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmployee();
  }, [id]);

  const loadEmployee = async () => {
    try {
      setLoading(true);
      const data = await getEmployee(id);
      setEmployee(data);
    } catch (error) {
      console.error('Failed to load employee:', error);
      toast.error("Failed to load employee details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Loading..." />
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-gray-500">Loading employee details...</div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Employee Not Found" />
        <div className="flex-1 p-6">
          <Link href="/dashboard/hr/employees" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" /> Back to Employees
          </Link>
          <div className="mt-8 text-center text-gray-500">
            Employee not found
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title={employee.name} subtitle={employee.designation} />
      <div className="flex-1 p-6 space-y-6">
        <Link href="/dashboard/hr/employees" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" /> Back to Employees
        </Link>

        {/* Header Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-[#22C55E] flex items-center justify-center text-white font-bold text-xl">
                {employee.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-900">{employee.name}</h2>
                <p className="text-sm text-gray-600">{employee.designation}</p>
                <p className="text-sm text-gray-600">{employee.department_name || 'N/A'}</p>
                <div className="mt-2"><EmployeeStatusBadge status={employee.status} /></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Employee ID</span>
                <span className="text-sm font-mono font-medium text-gray-900">{employee.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Phone</span>
                <span className="text-sm font-medium text-gray-900">{employee.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Email</span>
                <span className="text-sm font-medium text-gray-900">{employee.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Join Date</span>
                <span className="text-sm font-medium text-gray-900"><FormattedDate value={employee.join_date} /></span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Employment Type</span>
                <EmploymentTypeBadge type={employee.employment_type} />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Link href={`/dashboard/hr/employees/${id}/edit`}>
            <Button className="bg-[#22C55E] hover:bg-[#16A34A] text-white">Edit</Button>
          </Link>
          <Button variant="outline">Mark Attendance</Button>
          <Button variant="outline">Apply Leave</Button>
          <Button variant="outline">View Payslips</Button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="leave">Leave</TabsTrigger>
              <TabsTrigger value="payroll">Payroll</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 font-medium">Basic Salary</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">Rs. {Number(employee.basic_salary).toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 font-medium">Gross Salary</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">Rs. {Number(employee.gross_salary).toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 font-medium">PF (Employee)</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">Rs. {Number(employee.pf_employee).toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 font-medium">PF (Employer)</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">Rs. {Number(employee.pf_employer).toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 font-medium">Department</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{employee.department_name || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 font-medium">Date of Birth</p>
                  <p className="text-xl font-bold text-gray-900 mt-1"><FormattedDate value={employee.dob} /></p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="attendance" className="space-y-4 mt-4">
              <p className="text-sm text-gray-600">Attendance records will appear here.</p>
            </TabsContent>

            <TabsContent value="leave" className="space-y-4 mt-4">
              <p className="text-sm text-gray-600">Leave history will appear here.</p>
            </TabsContent>

            <TabsContent value="payroll" className="space-y-4 mt-4">
              <p className="text-sm text-gray-600">Payslip history will appear here.</p>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4 mt-4">
              <p className="text-sm text-gray-600">Documents will appear here.</p>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
