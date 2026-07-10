"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, MoreVertical, HardHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DashHeader } from "@/components/dashboard/dash-header";
import { StatusBadge } from "@/components/sales/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { SkeletonTable } from "@/components/shared/Skeleton";
import { useApi } from "@/lib/hooks/useApi";
import { constructionApi, type Worker } from "@/lib/api/construction";
import { formatNPR } from "@/lib/utils";
import toast from "react-hot-toast";

function getCategoryDisplay(category: string) {
  const categoryMap: Record<string, string> = {
    mason: "Mason",
    laborer: "Laborer",
    carpenter: "Carpenter",
    electrician: "Electrician",
    plumber: "Plumber",
    engineer: "Engineer",
    supervisor: "Supervisor",
    helper: "Helper",
    painter: "Painter",
    welder: "Welder",
    driver: "Driver",
    operator: "Equipment Operator",
    other: "Other",
  };
  return categoryMap[category] || category;
}

function getCategoryColor(category: string) {
  const colors: Record<string, string> = {
    mason: "bg-blue-100 text-blue-800",
    carpenter: "bg-yellow-100 text-yellow-800",
    electrician: "bg-purple-100 text-purple-800",
    plumber: "bg-green-100 text-green-800",
    painter: "bg-pink-100 text-pink-800",
    helper: "bg-gray-100 text-gray-800",
    welder: "bg-orange-100 text-orange-800",
    driver: "bg-indigo-100 text-indigo-800",
    operator: "bg-cyan-100 text-cyan-800",
  };
  return colors[category] || "bg-gray-100 text-gray-800";
}

export default function WorkersPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");

  const { data: workersData, loading, refetch } = useApi(
    () =>
      constructionApi.workers.list({
        search: search || undefined,
        status: status === "All" ? undefined : (status as Worker["status"]),
      }),
    { immediate: true, deps: [search, status] }
  );

  const handleView = (id: string) => {
    router.push(`/dashboard/construction/workers/${id}`);
  };

  const handleEdit = (id: string) => {
    router.push(`/dashboard/construction/workers/${id}/edit`);
  };

  const handleDeactivate = async (id: string, workerName: string) => {
    const confirmDeactivate = () => {
      toast.promise(constructionApi.workers.delete(id), {
        loading: "Deactivating worker...",
        success: () => {
          refetch();
          return `Worker "${workerName}" deactivated successfully`;
        },
        error: (err) =>
          err.response?.data?.detail || err.response?.data?.message || "Failed to deactivate worker",
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
              <p className="font-semibold text-gray-900 text-base">Deactivate {workerName}?</p>
              <p className="text-sm text-gray-600 mt-1">
                Attendance history will be preserved. This worker will no longer appear in active lists.
              </p>
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
                confirmDeactivate();
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              Deactivate
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

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Workers" subtitle="Loading..." />
        <div className="flex-1 p-6">
          <SkeletonTable rows={10} />
        </div>
      </div>
    );
  }

  const workers = workersData || [];

  if (workers.length === 0 && !search && status === "All") {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Workers" subtitle="Manage your construction workforce" />
        <div className="flex-1 p-6">
          <EmptyState
            icon={HardHat}
            title="No workers yet"
            description="Add your first worker to start managing your construction workforce"
            actionLabel="Add Worker"
            actionHref="/dashboard/construction/workers/new"
          />
        </div>
      </div>
    );
  }

  const filtered = workers.filter((worker) => {
    const query = search.toLowerCase();
    const matchesSearch =
      search === "" ||
      worker.name.toLowerCase().includes(query) ||
      (worker.phone && worker.phone.includes(search)) ||
      (worker.id_number && worker.id_number.toLowerCase().includes(query));
    return matchesSearch && (status === "All" || worker.status === status);
  });

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Workers" subtitle={`${filtered.length} workers`} />
      <div className="flex-1 p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search workers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 w-52 text-sm border-gray-200 bg-white"
              />
            </div>
            <Select value={status} onValueChange={(v) => setStatus(v ?? "All")}>
              <SelectTrigger className="h-9 w-32 text-sm border-gray-200 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["All", "active", "inactive"].map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Link href="/dashboard/construction/workers/new">
            <Button size="sm" className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5">
              <Plus className="h-4 w-4" /> Add Worker
            </Button>
          </Link>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <p className="text-gray-500">No workers found matching your filters</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {[
                    "Worker",
                    "Category",
                    "Daily Wage",
                    "Phone",
                    "Assigned Site",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((worker) => (
                  <tr key={worker.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#22C55E] text-white text-xs font-semibold flex items-center justify-center shrink-0">
                          {worker.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div>
                          <Link
                            href={`/dashboard/construction/workers/${worker.id}`}
                            className="font-medium text-gray-800 hover:text-[#22C55E] hover:underline"
                          >
                            {worker.name}
                          </Link>
                          {worker.id_number && (
                            <p className="text-xs text-gray-500">ID: {worker.id_number}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(worker.category)}`}
                      >
                        {getCategoryDisplay(worker.category)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {formatNPR(worker.daily_wage)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{worker.phone || "-"}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[140px] truncate">
                      {worker.assigned_site_name || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={worker.status} />
                    </td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="p-1 rounded hover:bg-gray-100 focus:outline-none">
                          <MoreVertical className="h-4 w-4 text-gray-400" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem
                            onClick={() => handleView(worker.id)}
                            className="cursor-pointer"
                          >
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEdit(worker.id)}
                            className="cursor-pointer"
                          >
                            Edit
                          </DropdownMenuItem>
                          {worker.status === "active" && (
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600 cursor-pointer"
                              onClick={() => handleDeactivate(worker.id, worker.name)}
                            >
                              Deactivate
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
