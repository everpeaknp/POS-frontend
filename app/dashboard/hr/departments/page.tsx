"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Users, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  HRPageShell,
  hrCardClass,
} from "@/components/dashboard/HRPageShell";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/EmptyState";
import toast from "react-hot-toast";
import { getDepartments, deleteDepartment, type Department } from "@/lib/api/hr";

const DEPARTMENT_COLORS = [
  'blue', 'green', 'purple', 'orange', 'pink', 'indigo', 'teal', 'red'
];

export default function DepartmentsPage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const data = await getDepartments();
      setDepartments(data);
    } catch (error) {
      console.error('Failed to load departments:', error);
      toast.error("Failed to load departments");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmDelete = () => {
      toast.promise(
        deleteDepartment(id),
        {
          loading: 'Deleting department...',
          success: () => {
            loadDepartments();
            return `Department "${name}" deleted successfully`;
          },
          error: (err) => err.response?.data?.message || 'Failed to delete department'
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
      <HRPageShell
        title="Departments"
        subtitle="Loading..."
        loading
      />
    );
  }

  if (departments.length === 0) {
    return (
      <HRPageShell title="Departments" subtitle="Manage your departments">
        <EmptyState
            icon={Users}
            title="No departments yet"
            description="Create your first department to organize your employees"
            actionLabel="Add Department"
            actionHref="/dashboard/hr/departments/new"
          />
      </HRPageShell>
    );
  }

  return (
    <HRPageShell
      title="Departments"
      subtitle={`${departments.length} departments`}
      action={
        <Link href="/dashboard/hr/departments/new">
          <Button size="sm" className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5">
            <Plus className="h-4 w-4" /> Add Department
          </Button>
        </Link>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept, index) => {
            const color = DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length];
            return (
              <div key={dept.id} className={`${hrCardClass} p-6 hover:shadow-md transition-shadow relative group`}>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="p-1 rounded hover:bg-gray-100 focus:outline-none">
                      <MoreVertical className="h-4 w-4 text-gray-400" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/hr/departments/${dept.id}`)}>
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/hr/departments/${dept.id}/edit`)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600 focus:text-red-600"
                        onClick={() => handleDelete(dept.id, dept.name)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <Link href={`/dashboard/hr/departments/${dept.id}`}>
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-lg bg-${color}-100 flex items-center justify-center`}>
                      <Users className={`w-6 h-6 text-${color}-600`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{dept.name}</h3>
                      <p className="text-sm text-gray-600">{dept.head_name || "No Head"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Employees</p>
                      <p className="text-lg font-bold text-gray-900">{dept.employee_count || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Status</p>
                      <p className="text-lg font-bold text-green-600">Active</p>
                    </div>
                  </div>
                </Link>

                <div className="flex gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 h-8 text-xs"
                    onClick={() => router.push(`/dashboard/hr/departments/${dept.id}`)}
                  >
                    View
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 h-8 text-xs"
                    onClick={() => router.push(`/dashboard/hr/departments/${dept.id}/edit`)}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            );
          })}
      </div>
    </HRPageShell>
  );
}
