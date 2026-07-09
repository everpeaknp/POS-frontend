"use client";

import { FormattedDate } from "@/components/shared/FormattedDate";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Users, MoreVertical, Search, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  HRPageShell,
  hrCardClass,
  hrTableWrapClass,
} from "@/components/dashboard/HRPageShell";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/EmptyState";
import toast from "react-hot-toast";
import { getDepartments, deleteDepartment, type Department } from "@/lib/api/hr";

const DEPARTMENT_COLOR_CLASSES = [
  { bg: "bg-blue-100", text: "text-blue-600" },
  { bg: "bg-green-100", text: "text-green-600" },
  { bg: "bg-purple-100", text: "text-purple-600" },
  { bg: "bg-orange-100", text: "text-orange-600" },
  { bg: "bg-pink-100", text: "text-pink-600" },
  { bg: "bg-indigo-100", text: "text-indigo-600" },
  { bg: "bg-teal-100", text: "text-teal-600" },
  { bg: "bg-red-100", text: "text-red-600" },
];

type ViewMode = "grid" | "list";

function AddDepartmentFab() {
  return (
    <Link
      href="/dashboard/hr/departments/new"
      className="fixed bottom-8 right-8 w-14 h-14 bg-[#22C55E] hover:bg-[#16A34A] text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-green-300 z-50"
      aria-label="Add department"
    >
      <Plus className="h-6 w-6" />
    </Link>
  );
}

function DepartmentActions({
  onView,
  onEdit,
  onDelete,
}: {
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="p-1 rounded hover:bg-gray-100 focus:outline-none">
        <MoreVertical className="h-4 w-4 text-gray-400" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuItem onClick={onView}>View</DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
        <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={onDelete}>
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function DepartmentsPage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [headFilter, setHeadFilter] = useState("All");
  const [staffFilter, setStaffFilter] = useState("All");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const data = await getDepartments();
      setDepartments(data);
    } catch (error) {
      console.error("Failed to load departments:", error);
      toast.error("Failed to load departments");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmDelete = () => {
      toast.promise(deleteDepartment(id), {
        loading: "Deleting department...",
        success: () => {
          loadDepartments();
          return `Department "${name}" deleted successfully`;
        },
        error: (err) =>
          err.response?.data?.error || err.response?.data?.message || "Failed to delete department",
      });
    };

    toast(
      (t) => (
        <div className="flex flex-col gap-4 min-w-[320px] p-2">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
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
      ),
      {
        duration: Infinity,
        position: "top-center",
        style: {
          marginTop: "40vh",
          background: "white",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          borderRadius: "12px",
          padding: "16px",
        },
      }
    );
  };

  const filtered = departments.filter((dept) => {
    const query = search.toLowerCase();
    const matchesSearch =
      dept.name.toLowerCase().includes(query) ||
      String(dept.id).toLowerCase().includes(query) ||
      (dept.head_name || "").toLowerCase().includes(query) ||
      (dept.description || "").toLowerCase().includes(query);

    const matchesHead =
      headFilter === "All" ||
      (headFilter === "With Head" && Boolean(dept.head_name)) ||
      (headFilter === "No Head" && !dept.head_name);

    const count = dept.employee_count || 0;
    const matchesStaff =
      staffFilter === "All" ||
      (staffFilter === "Empty" && count === 0) ||
      (staffFilter === "Has Employees" && count > 0);

    return matchesSearch && matchesHead && matchesStaff;
  });

  const hasActiveFilters = search || headFilter !== "All" || staffFilter !== "All";

  if (!loading && departments.length === 0 && !hasActiveFilters) {
    return (
      <>
        <HRPageShell title="Departments" subtitle="Manage your departments">
          <EmptyState
            icon={Users}
            title="No departments yet"
            description="Create your first department to organize your employees"
          />
        </HRPageShell>
        <AddDepartmentFab />
      </>
    );
  }

  return (
    <>
      <HRPageShell
        title="Departments"
        subtitle={loading ? "Loading..." : `${filtered.length} departments`}
        loading={loading}
        toolbar={
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search departments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 w-52 text-sm border-gray-200 bg-white"
              />
            </div>
            <Select value={headFilter} onValueChange={(v) => setHeadFilter(v ?? "All")}>
              <SelectTrigger className="h-9 w-40 text-sm border-gray-200 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["All", "With Head", "No Head"].map((option) => (
                  <SelectItem key={option} value={option}>
                    {option === "All" ? "All Heads" : option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={staffFilter} onValueChange={(v) => setStaffFilter(v ?? "All")}>
              <SelectTrigger className="h-9 w-44 text-sm border-gray-200 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["All", "Empty", "Has Employees"].map((option) => (
                  <SelectItem key={option} value={option}>
                    {option === "All" ? "All Sizes" : option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center rounded-lg border border-gray-200 bg-white p-0.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 ${viewMode === "grid" ? "bg-gray-100 text-gray-900" : "text-gray-500"}`}
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 ${viewMode === "list" ? "bg-gray-100 text-gray-900" : "text-gray-500"}`}
                onClick={() => setViewMode("list")}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </>
        }
      >
        {filtered.length === 0 ? (
          <div className={`${hrCardClass} p-12 text-center`}>
            <p className="text-gray-600 dark:text-muted-foreground">
              No departments found matching your filters
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((dept, index) => {
              const color = DEPARTMENT_COLOR_CLASSES[index % DEPARTMENT_COLOR_CLASSES.length];
              return (
                <div
                  key={dept.id}
                  className={`${hrCardClass} p-6 hover:shadow-md transition-shadow relative group`}
                >
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DepartmentActions
                      onView={() => router.push(`/dashboard/hr/departments/${dept.id}`)}
                      onEdit={() => router.push(`/dashboard/hr/departments/${dept.id}/edit`)}
                      onDelete={() => handleDelete(dept.id, dept.name)}
                    />
                  </div>

                  <Link href={`/dashboard/hr/departments/${dept.id}`}>
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-12 h-12 rounded-lg ${color.bg} flex items-center justify-center`}>
                        <Users className={`w-6 h-6 ${color.text}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{dept.name}</h3>
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
        ) : (
          <div className={hrTableWrapClass}>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Name", "Head", "Employees", "Created", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((dept) => (
                  <tr key={dept.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <Link
                        href={`/dashboard/hr/departments/${dept.id}`}
                        className="hover:text-[#22C55E]"
                      >
                        {dept.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{dept.head_name || "No Head"}</td>
                    <td className="px-4 py-3 text-gray-600">{dept.employee_count || 0}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <FormattedDate value={dept.created_at} />
                    </td>
                    <td className="px-4 py-3">
                      <DepartmentActions
                        onView={() => router.push(`/dashboard/hr/departments/${dept.id}`)}
                        onEdit={() => router.push(`/dashboard/hr/departments/${dept.id}/edit`)}
                        onDelete={() => handleDelete(dept.id, dept.name)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </HRPageShell>
      <AddDepartmentFab />
    </>
  );
}
