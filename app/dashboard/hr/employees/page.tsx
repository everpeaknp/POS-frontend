"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DashHeader } from "@/components/dashboard/dash-header";
import { EmployeeStatusBadge } from "@/components/hr/EmployeeStatusBadge";
import { EmploymentTypeBadge } from "@/components/hr/EmploymentTypeBadge";
import toast from "react-hot-toast";
import { getEmployees, getDepartments, deleteEmployee, type Employee, type Department } from "@/lib/api/hr";

export default function EmployeesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All");
  const [status, setStatus] = useState("All");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [employeesData, departmentsData] = await Promise.all([
        getEmployees(),
        getDepartments()
      ]);
      setEmployees(employeesData.results || employeesData);
      setDepartments(departmentsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    // Show confirmation toast with action buttons
    const confirmDelete = () => {
      toast.promise(
        deleteEmployee(id),
        {
          loading: 'Deleting employee...',
          success: () => {
            loadData();
            return `Employee "${name}" deleted successfully`;
          },
          error: (err) => 'Failed to delete employee'
        }
      );
    };

    // Show custom confirmation toast in center of screen
    toast((t) => (
      <div className="flex flex-col gap-4 min-w-[320px] p-2">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-base">Delete this employee?</p>
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

  const filtered = employees.filter((emp) => {
    const ms = emp.name.toLowerCase().includes(search.toLowerCase()) || 
               String(emp.id).toLowerCase().includes(search.toLowerCase()) || 
               emp.phone.includes(search) ||
               emp.email.toLowerCase().includes(search.toLowerCase());
    const ds = department === "All" || emp.department === department || emp.department_name === department;
    const ss = status === "All" || emp.status === status;
    return ms && ds && ss;
  });

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Employees" subtitle="Loading..." />
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-gray-500">Loading employees...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Employees" subtitle={`${filtered.length} employees`} />
      <div className="flex-1 p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search employees..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 w-52 text-sm border-gray-200 bg-white" />
            </div>
            <Select value={department} onValueChange={(v) => setDepartment(v ?? "All")}>
              <SelectTrigger className="h-9 w-40 text-sm border-gray-200 bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Departments</SelectItem>
                {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(v) => setStatus(v ?? "All")}>
              <SelectTrigger className="h-9 w-40 text-sm border-gray-200 bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["All", "active", "inactive", "terminated"].map((s) => <SelectItem key={s} value={s}>{s === "All" ? "All Status" : s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Link href="/dashboard/hr/employees/new">
            <Button size="sm" className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5">
              <Plus className="h-4 w-4" /> Add Employee
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Name", "ID", "Designation", "Department", "Phone", "Join Date", "Type", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    No employees found
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <Link href={`/dashboard/hr/employees/${emp.id}`} className="hover:text-[#22C55E]">{emp.name}</Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#22C55E] font-medium">{String(emp.id).substring(0, 8)}</td>
                    <td className="px-4 py-3 text-gray-600">{emp.designation}</td>
                    <td className="px-4 py-3 text-gray-600">{emp.department_name || 'N/A'}</td>
                    <td className="px-4 py-3 text-gray-600">{emp.phone}</td>
                    <td className="px-4 py-3 text-gray-600">{new Date(emp.join_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3"><EmploymentTypeBadge type={emp.employment_type} /></td>
                    <td className="px-4 py-3"><EmployeeStatusBadge status={emp.status} /></td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="p-1 rounded hover:bg-gray-100 focus:outline-none">
                          <MoreVertical className="h-4 w-4 text-gray-400" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/hr/employees/${emp.id}`)}>
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/hr/employees/${emp.id}/edit`)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600 focus:text-red-600" 
                            onClick={() => handleDelete(emp.id, emp.name)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
