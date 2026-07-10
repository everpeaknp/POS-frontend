"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, MoreVertical, Package } from "lucide-react";
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
import { useApi } from "@/lib/hooks/useApi";
import { constructionApi } from "@/lib/api/construction";
import { formatNPR } from "@/lib/utils";
import toast from "react-hot-toast";

export default function MaterialConsumptionPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [siteFilter, setSiteFilter] = useState("All");

  const { data: sitesData } = useApi(() => constructionApi.sites.list(), { deps: [] });
  const sites = sitesData || [];

  const { data: consumptionsData, loading, refetch } = useApi(
    () =>
      constructionApi.materialConsumption.list({
        search: search || undefined,
        site: siteFilter === "All" ? undefined : siteFilter,
      }),
    { immediate: true, deps: [search, siteFilter] }
  );

  const handleDelete = async (id: string, productName: string) => {
    const confirmDelete = () => {
      toast.promise(constructionApi.materialConsumption.delete(id), {
        loading: "Deleting consumption record...",
        success: () => {
          refetch();
          return `Consumption record for ${productName} deleted successfully`;
        },
        error: (err) =>
          err.response?.data?.detail || err.response?.data?.message || "Failed to delete record",
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
              <p className="font-semibold text-gray-900 text-base">Delete this record?</p>
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
        <DashHeader title="Material Consumption" subtitle="Loading..." />
        <div className="flex-1 p-6">
          <SkeletonTable rows={10} />
        </div>
      </div>
    );
  }

  const consumptions = consumptionsData || [];

  if (consumptions.length === 0 && !search && siteFilter === "All") {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Material Consumption" subtitle="Track material usage across sites" />
        <div className="flex-1 p-6">
          <EmptyState
            icon={Package}
            title="No consumption records yet"
            description="Log material usage to track costs across your construction sites"
            actionLabel="Log Consumption"
            actionHref="/dashboard/construction/consumption/new"
          />
        </div>
      </div>
    );
  }

  const filtered = consumptions.filter((item) => {
    const query = search.toLowerCase();
    return (
      search === "" ||
      (item.product_name && item.product_name.toLowerCase().includes(query)) ||
      (item.product_sku && item.product_sku.toLowerCase().includes(query)) ||
      (item.notes && item.notes.toLowerCase().includes(query)) ||
      (item.site_name && item.site_name.toLowerCase().includes(query))
    );
  });

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Material Consumption" subtitle={`${filtered.length} records`} />
      <div className="flex-1 p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 w-52 text-sm border-gray-200 bg-white"
              />
            </div>
            <Select value={siteFilter} onValueChange={(v) => setSiteFilter(v ?? "All")}>
              <SelectTrigger className="h-9 w-40 text-sm border-gray-200 bg-white">
                <SelectValue placeholder="All Sites" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Sites</SelectItem>
                {sites.map((site) => (
                  <SelectItem key={site.id} value={String(site.id)}>
                    {site.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Link href="/dashboard/construction/consumption/new">
            <Button size="sm" className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5">
              <Plus className="h-4 w-4" /> Log Consumption
            </Button>
          </Link>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <p className="text-gray-500">No consumption records found matching your filters</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {[
                    "Product",
                    "Site",
                    "Date",
                    "Quantity",
                    "Unit Cost",
                    "Total",
                    "Notes",
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
                          {(item.product_name || "P")
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{item.product_name || "—"}</p>
                          {item.product_sku && (
                            <p className="text-xs text-gray-500">{item.product_sku}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-[140px] truncate">
                      {item.site_name || item.site}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      <FormattedDate value={item.created_at} />
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {Number(item.quantity).toFixed(2)} {item.product_unit || ""}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {formatNPR(Number(item.unit_cost))}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                      {formatNPR(Number(item.total_cost))}
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-[160px] truncate" title={item.notes || ""}>
                      {item.notes || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="p-1 rounded hover:bg-gray-100 focus:outline-none">
                          <MoreVertical className="h-4 w-4 text-gray-400" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          {item.daily_log && (
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/dashboard/construction/daily-logs/${item.daily_log}`)
                              }
                              className="cursor-pointer"
                            >
                              View Daily Log
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600 cursor-pointer"
                            onClick={() => handleDelete(item.id, item.product_name || "product")}
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
