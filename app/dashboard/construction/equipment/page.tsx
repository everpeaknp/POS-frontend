"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, MoreVertical, Wrench } from "lucide-react";
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
import { EmptyState } from "@/components/shared/EmptyState";
import { SkeletonTable } from "@/components/shared/Skeleton";
import { useApi } from "@/lib/hooks/useApi";
import { constructionApi, type Equipment } from "@/lib/api/construction";
import { formatNPR } from "@/lib/utils";
import toast from "react-hot-toast";

function formatStatusLabel(status: string) {
  return status.replace("_", " ");
}

function getOwnershipBadge(type: Equipment["ownership_type"]) {
  return type === "owned"
    ? "bg-green-100 text-green-700"
    : "bg-blue-100 text-blue-700";
}

function getStatusBadge(status: Equipment["status"]) {
  const colors: Record<Equipment["status"], string> = {
    available: "bg-green-100 text-green-700",
    in_use: "bg-yellow-100 text-yellow-700",
    maintenance: "bg-orange-100 text-orange-700",
    retired: "bg-gray-100 text-gray-500",
  };
  return colors[status] || "bg-gray-100 text-gray-600";
}

function getCostLabel(item: Equipment) {
  if (item.ownership_type === "rented" && item.rental_cost_per_day) {
    return `${formatNPR(item.rental_cost_per_day)}/day`;
  }
  if (item.purchase_cost) {
    return formatNPR(item.purchase_cost);
  }
  return "—";
}

export default function EquipmentPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");

  const { data: equipmentData, loading, refetch } = useApi(
    () =>
      constructionApi.equipment.list({
        search: search || undefined,
        status: status === "All" ? undefined : status,
      }),
    { immediate: true, deps: [search, status] }
  );

  const handleView = (id: string) => {
    router.push(`/dashboard/construction/equipment/${id}`);
  };

  const handleEdit = (id: string) => {
    router.push(`/dashboard/construction/equipment/${id}/edit`);
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmDelete = () => {
      toast.promise(constructionApi.equipment.delete(id), {
        loading: "Deleting equipment...",
        success: () => {
          refetch();
          return `Equipment "${name}" deleted successfully`;
        },
        error: (err) =>
          err.response?.data?.detail || err.response?.data?.message || "Failed to delete equipment",
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
              <p className="font-semibold text-gray-900 text-base">Delete {name}?</p>
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

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Equipment" subtitle="Loading..." />
        <div className="flex-1 p-6">
          <SkeletonTable rows={10} />
        </div>
      </div>
    );
  }

  const equipment = equipmentData || [];

  if (equipment.length === 0 && !search && status === "All") {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Equipment" subtitle="Manage equipment inventory and usage" />
        <div className="flex-1 p-6">
          <EmptyState
            icon={Wrench}
            title="No equipment yet"
            description="Add your first equipment item to track inventory and usage"
            actionLabel="Add Equipment"
            actionHref="/dashboard/construction/equipment/new"
          />
        </div>
      </div>
    );
  }

  const filtered = equipment.filter((item) => {
    const query = search.toLowerCase();
    const matchesSearch =
      search === "" ||
      item.name.toLowerCase().includes(query) ||
      item.equipment_type.toLowerCase().includes(query) ||
      (item.registration_number && item.registration_number.toLowerCase().includes(query)) ||
      (item.assigned_site_name && item.assigned_site_name.toLowerCase().includes(query));
    return matchesSearch && (status === "All" || item.status === status);
  });

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Equipment" subtitle={`${filtered.length} items`} />
      <div className="flex-1 p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search equipment..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 w-52 text-sm border-gray-200 bg-white"
              />
            </div>
            <Select value={status} onValueChange={(v) => setStatus(v ?? "All")}>
              <SelectTrigger className="h-9 w-36 text-sm border-gray-200 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["All", "available", "in_use", "maintenance", "retired"].map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s === "All" ? "All Status" : formatStatusLabel(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Link href="/dashboard/construction/equipment/new">
            <Button size="sm" className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5">
              <Plus className="h-4 w-4" /> Add Equipment
            </Button>
          </Link>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <p className="text-gray-500">No equipment found matching your filters</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {[
                    "Equipment",
                    "Type",
                    "Ownership",
                    "Status",
                    "Cost",
                    "Assigned Site",
                    "Registration",
                    "Actions",
                  ].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#22C55E] text-white text-xs font-semibold flex items-center justify-center shrink-0">
                          {item.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <Link
                          href={`/dashboard/construction/equipment/${item.id}`}
                          className="font-medium text-gray-800 hover:text-[#22C55E] hover:underline"
                        >
                          {item.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{item.equipment_type}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getOwnershipBadge(item.ownership_type)}`}
                      >
                        {item.ownership_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusBadge(item.status)}`}
                      >
                        {formatStatusLabel(item.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                      {getCostLabel(item)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-[140px] truncate">
                      {item.assigned_site_name || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{item.registration_number || "—"}</td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="p-1 rounded hover:bg-gray-100 focus:outline-none">
                          <MoreVertical className="h-4 w-4 text-gray-400" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem
                            onClick={() => handleView(item.id)}
                            className="cursor-pointer"
                          >
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEdit(item.id)}
                            className="cursor-pointer"
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600 cursor-pointer"
                            onClick={() => handleDelete(item.id, item.name)}
                          >
                            Delete
                          </DropdownMenuItem>
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
