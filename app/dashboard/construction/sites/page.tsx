"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  MoreVertical,
  Building2,
  Pencil,
  Trash2,
  LayoutGrid,
  List,
} from "lucide-react";
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
import { FormattedDate } from "@/components/shared/FormattedDate";
import { EmptyState } from "@/components/shared/EmptyState";
import { SkeletonTable } from "@/components/shared/Skeleton";
import { constructionCardClass } from "@/components/dashboard/ConstructionPageShell";
import { useApi } from "@/lib/hooks/useApi";
import { constructionApi, type Site } from "@/lib/api/construction";
import { formatNPR } from "@/lib/utils";
import toast from "react-hot-toast";

type ViewMode = "grid" | "list";

function getBudgetHealthColor(percentage: number) {
  if (percentage < 80) return "text-green-600 bg-green-50 border-green-200";
  if (percentage < 100) return "text-yellow-600 bg-yellow-50 border-yellow-200";
  return "text-red-600 bg-red-50 border-red-200";
}

function getBudgetHealthLabel(percentage: number) {
  if (percentage < 80) return "Healthy";
  if (percentage < 100) return "Warning";
  return "Over Budget";
}

function getStatusColor(status: string) {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800";
    case "planned":
      return "bg-blue-100 text-blue-800";
    case "on_hold":
      return "bg-yellow-100 text-yellow-800";
    case "completed":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function formatStatusLabel(status: string) {
  return status.replace("_", " ");
}

export default function SitesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const { data: sitesData, loading, refetch } = useApi(
    () =>
      constructionApi.sites.list({
        search: search || undefined,
        status: status === "All" ? undefined : status,
      }),
    { immediate: true, deps: [search, status] }
  );

  const handleView = (id: string) => {
    router.push(`/dashboard/construction/sites/${id}`);
  };

  const handleEdit = (id: string) => {
    router.push(`/dashboard/construction/sites/${id}/edit`);
  };

  const handleDelete = async (id: string, siteName: string) => {
    const confirmDelete = () => {
      toast.promise(constructionApi.sites.delete(id), {
        loading: "Deleting site...",
        success: () => {
          refetch();
          return `Site "${siteName}" deleted successfully`;
        },
        error: (err) =>
          err.response?.data?.detail || err.response?.data?.message || "Failed to delete site",
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
              <p className="font-semibold text-gray-900 text-base">Delete {siteName}?</p>
              <p className="text-sm text-gray-600 mt-1">
                This will permanently remove the site and all associated data.
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
        <DashHeader title="Construction Sites" subtitle="Loading..." />
        <div className="flex-1 p-6">
          <SkeletonTable rows={10} />
        </div>
      </div>
    );
  }

  const sites = sitesData || [];

  if (sites.length === 0 && !search && status === "All") {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Construction Sites" subtitle="Manage construction projects" />
        <div className="flex-1 p-6">
          <EmptyState
            icon={Building2}
            title="No construction sites yet"
            description="Create your first site to track budget, labor, and progress"
            actionLabel="Add Site"
            actionHref="/dashboard/construction/sites/new"
          />
        </div>
      </div>
    );
  }

  const filtered = sites.filter((site) => {
    const query = search.toLowerCase();
    const matchesSearch =
      search === "" ||
      site.name.toLowerCase().includes(query) ||
      site.location.toLowerCase().includes(query) ||
      (site.client_name && site.client_name.toLowerCase().includes(query));
    return matchesSearch && (status === "All" || site.status === status);
  });

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Construction Sites" subtitle={`${filtered.length} sites`} />
      <div className="flex-1 p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search sites..."
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
                {["All", "active", "planned", "on_hold", "completed"].map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s === "All" ? "All Status" : formatStatusLabel(s)}
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
          </div>
          <Link href="/dashboard/construction/sites/new">
            <Button size="sm" className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5">
              <Plus className="h-4 w-4" /> Add Site
            </Button>
          </Link>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <p className="text-gray-500">No sites found matching your filters</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 w-full">
            {filtered.map((site) => (
              <SiteGridCard
                key={site.id}
                site={site}
                onView={() => handleView(site.id)}
                onEdit={() => handleEdit(site.id)}
                onDelete={() => handleDelete(site.id, site.name)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {[
                    "Site",
                    "Status",
                    "Client",
                    "Budget Used",
                    "Allocated",
                    "Actual Spend",
                    "Remaining",
                    "Start Date",
                    "Actions",
                  ].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((site) => (
                  <tr key={site.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#22C55E] text-white text-xs font-semibold flex items-center justify-center shrink-0">
                          {site.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div>
                          <Link
                            href={`/dashboard/construction/sites/${site.id}`}
                            className="font-medium text-gray-800 hover:text-[#22C55E] hover:underline"
                          >
                            {site.name}
                          </Link>
                          <p className="text-xs text-gray-500">{site.location}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(site.status)}`}
                      >
                        {formatStatusLabel(site.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{site.client_name || "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getBudgetHealthColor(
                          site.budget_percentage ?? 0
                        )}`}
                      >
                        {(site.budget_percentage ?? 0).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatNPR(site.allocated_budget)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatNPR(site.actual_spend ?? 0)}
                    </td>
                    <td
                      className={`px-4 py-3 whitespace-nowrap font-medium ${
                        (site.remaining_budget ?? 0) >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {formatNPR(site.remaining_budget ?? 0)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <FormattedDate value={site.start_date} />
                    </td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="p-1 rounded hover:bg-gray-100 focus:outline-none">
                          <MoreVertical className="h-4 w-4 text-gray-400" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem
                            onClick={() => handleView(site.id)}
                            className="cursor-pointer"
                          >
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEdit(site.id)}
                            className="cursor-pointer"
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600 cursor-pointer"
                            onClick={() => handleDelete(site.id, site.name)}
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

function SiteGridCard({
  site,
  onView,
  onEdit,
  onDelete,
}: {
  site: Site;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const budgetPct = site.budget_percentage ?? 0;

  return (
    <div
      className={`${constructionCardClass} hover:shadow-md hover:border-[#22C55E]/20 transition-all cursor-pointer w-full overflow-hidden`}
      onClick={onView}
    >
      <div className="p-5 border-b border-gray-100">
        <div className="flex justify-between items-start gap-3 mb-2">
          <h3 className="text-lg font-semibold text-gray-900 truncate">{site.name}</h3>
          <div className="flex items-center gap-1 shrink-0">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(site.status)}`}
            >
              {formatStatusLabel(site.status)}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-2 text-[#22C55E] hover:bg-green-50 rounded-md transition-colors"
              title="Edit site"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="Delete site"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600">{site.location}</p>
        {site.client_name && (
          <p className="text-sm text-gray-500 mt-1">Client: {site.client_name}</p>
        )}
      </div>

      <div className="p-5 bg-gray-50/80">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Budget Status</span>
          <span
            className={`px-2 py-1 rounded text-xs font-medium border ${getBudgetHealthColor(budgetPct)}`}
          >
            {getBudgetHealthLabel(budgetPct)}
          </span>
        </div>
        <div className="overflow-hidden h-3 mb-4 rounded bg-gray-200">
          <div
            style={{ width: `${Math.min(budgetPct, 100)}%` }}
            className={`h-full transition-all duration-500 ${
              budgetPct < 80 ? "bg-green-500" : budgetPct < 100 ? "bg-yellow-500" : "bg-red-500"
            }`}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">Allocated</p>
            <p className="text-lg font-bold text-gray-900">{formatNPR(site.allocated_budget)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Actual Spend</p>
            <p className="text-lg font-bold text-gray-900">{formatNPR(site.actual_spend ?? 0)}</p>
          </div>
        </div>
      </div>

      <div className="p-5 border-t border-gray-100 bg-gray-50/50">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Manager</p>
            <p className="font-medium text-gray-900">{site.manager_name || "—"}</p>
          </div>
          <div>
            <p className="text-gray-500">Start Date</p>
            <p className="font-medium text-gray-900">
              <FormattedDate value={site.start_date} />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
