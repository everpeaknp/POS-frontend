"use client";

import { FormattedDate } from "@/components/shared/FormattedDate";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Edit, Trash2, Users, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HRPageShell, hrCardClass } from "@/components/dashboard/HRPageShell";
import toast from "react-hot-toast";
import { getDepartment, getEmployees, deleteDepartment, type Department, type Employee } from "@/lib/api/hr";

export default function DepartmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const unwrappedParams = React.use(params);
  const [department, setDepartment] = useState<Department | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (unwrappedParams.id) {
      loadDepartment();
      loadEmployees();
    }
  }, [unwrappedParams.id]);

  const loadDepartment = async () => {
    try {
      setLoading(true);
      const data = await getDepartment(unwrappedParams.id);
      setDepartment(data);
    } catch (error) {
      console.error('Failed to load department:', error);
      toast.error("Failed to load department");
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const data = await getEmployees({ department: unwrappedParams.id });
      const employeesList = data.results || [];
      setEmployees(employeesList);
    } catch (error) {
      console.error('Failed to load employees:', error);
    }
  };

  const handleDelete = async () => {
    if (!department) return;

    const confirmDelete = () => {
      toast.promise(
        deleteDepartment(unwrappedParams.id),
        {
          loading: 'Deleting department...',
          success: () => {
            router.push('/dashboard/hr/departments');
            return `Department "${department.name}" deleted successfully`;
          },
          error: (err) => err.response?.data?.error || err.response?.data?.message || 'Failed to delete department'
        }
      );
    };

    toast((t) => (
      <div className="flex flex-col gap-4 min-w-[320px] p-2">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-base">Delete this department?</p>
            <p className="text-sm text-gray-600 mt-1">This action cannot be undone.</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              confirmDelete();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    ), {
      duration: Infinity,
      position: 'top-center',
      style: {
        marginTop: '40vh',
        background: 'white',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        borderRadius: '12px',
        padding: '16px',
      },
    });
  };

  if (loading) {
    return (
      <HRPageShell title="Department Details" subtitle="Loading department…" loading />
    );
  }

  if (!department) {
    return (
      <HRPageShell title="Department Not Found" subtitle="The department you're looking for doesn't exist">
        <Link href="/dashboard/hr/departments" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="h-4 w-4" /> Back to Departments
        </Link>
      </HRPageShell>
    );
  }

  return (
    <HRPageShell
      title={department.name}
      subtitle={department.head_name ? `Head: ${department.head_name}` : "No department head assigned"}
      action={
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2"
            onClick={() => router.push(`/dashboard/hr/departments/${unwrappedParams.id}/edit`)}
          >
            <Edit className="h-4 w-4" /> Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      }
    >
      <Link href="/dashboard/hr/departments" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 -mt-2">
        <ChevronLeft className="h-4 w-4" /> Back to Departments
      </Link>

      <div className="space-y-6">
        <div className={`${hrCardClass} p-6`}>
          <div className="flex items-start gap-4 mb-6">
            <div className="w-16 h-16 rounded-lg bg-green-100 flex items-center justify-center">
              <Users className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{department.name}</h2>
              <p className="text-sm text-gray-600 mt-1">
                {department.head_name ? `Head: ${department.head_name}` : "No department head assigned"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gray-100">
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900">{department.employee_count || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Created</p>
              <p className="text-sm text-gray-900"><FormattedDate value={department.created_at} /></p>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Last Updated</p>
              <p className="text-sm text-gray-900"><FormattedDate value={department.updated_at} /></p>
            </div>
          </div>

          {department.description && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-sm text-gray-500 font-medium mb-2">Description</p>
              <p className="text-gray-700">{department.description}</p>
            </div>
          )}
        </div>

        <div className={`${hrCardClass} p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Department Employees</h3>
            <span className="text-sm text-gray-500">{employees.length} employees</span>
          </div>

          {employees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <User className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>No employees in this department</p>
            </div>
          ) : (
            <div className="space-y-3">
              {employees.map((emp) => (
                <Link
                  key={emp.id}
                  href={`/dashboard/hr/employees/${emp.id}`}
                  className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{emp.name}</p>
                      <p className="text-sm text-gray-600">{emp.designation}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{emp.phone}</p>
                    <p className="text-xs text-gray-500">{emp.email}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </HRPageShell>
  );
}
