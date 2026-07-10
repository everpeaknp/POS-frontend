"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, MoreVertical, FileText } from "lucide-react";
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
import toast from "react-hot-toast";

function ReviewStatusBadge({ reviewed }: { reviewed: boolean }) {
  return reviewed ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
      Reviewed
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
      Pending
    </span>
  );
}

export default function DailyLogsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [siteFilter, setSiteFilter] = useState("All");
  const [reviewFilter, setReviewFilter] = useState("All");

  const { data: sitesData } = useApi(() => constructionApi.sites.list(), { deps: [] });
  const sites = sitesData || [];

  const { data: logsData, loading, refetch } = useApi(
    () =>
      constructionApi.dailyLogs.list({
        search: search || undefined,
        site: siteFilter === "All" ? undefined : siteFilter,
      }),
    { immediate: true, deps: [search, siteFilter] }
  );

  const handleView = (id: string) => {
    router.push(`/dashboard/construction/daily-logs/${id}`);
  };

  const handleEdit = (id: string) => {
    router.push(`/dashboard/construction/daily-logs/${id}/edit`);
  };

  const handleDelete = async (id: string, siteName: string) => {
    const confirmDelete = () => {
      toast.promise(constructionApi.dailyLogs.delete(id), {
        loading: "Deleting daily log...",
        success: () => {
          refetch();
          return `Daily log for ${siteName} deleted successfully`;
        },
        error: (err) =>
          err.response?.data?.detail || err.response?.data?.message || "Failed to delete daily log",
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
              <p className="font-semibold text-gray-900 text-base">Delete this daily log?</p>
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
        <DashHeader title="Daily Site Logs" subtitle="Loading..." />
        <div className="flex-1 p-6">
          <SkeletonTable rows={10} />
        </div>
      </div>
    );
  }

  const logs = logsData || [];

  if (logs.length === 0 && !search && siteFilter === "All" && reviewFilter === "All") {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Daily Site Logs" subtitle="Track daily progress and activities" />
        <div className="flex-1 p-6">
          <EmptyState
            icon={FileText}
            title="No daily logs yet"
            description="Create your first daily site log to track progress"
            actionLabel="Add Daily Log"
            actionHref="/dashboard/construction/daily-logs/new"
          />
        </div>
      </div>
    );
  }

  const filtered = logs.filter((log) => {
    const query = search.toLowerCase();
    const matchesSearch =
      search === "" ||
      log.work_description.toLowerCase().includes(query) ||
      (log.progress_notes && log.progress_notes.toLowerCase().includes(query)) ||
      (log.site_name && log.site_name.toLowerCase().includes(query));
    const isReviewed = Boolean(log.reviewed_by_name);
    const matchesReview =
      reviewFilter === "All" ||
      (reviewFilter === "Reviewed" && isReviewed) ||
      (reviewFilter === "Pending" && !isReviewed);
    return matchesSearch && matchesReview;
  });

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Daily Site Logs" subtitle={`${filtered.length} logs`} />
      <div className="flex-1 p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search logs..."
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
            <Select value={reviewFilter} onValueChange={(v) => setReviewFilter(v ?? "All")}>
              <SelectTrigger className="h-9 w-32 text-sm border-gray-200 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["All", "Reviewed", "Pending"].map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Link href="/dashboard/construction/daily-logs/new">
            <Button size="sm" className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5">
              <Plus className="h-4 w-4" /> Add Daily Log
            </Button>
          </Link>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <p className="text-gray-500">No daily logs found matching your filters</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {[
                    "Site",
                    "Date",
                    "Work Description",
                    "Weather",
                    "Submitted By",
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
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#22C55E] text-white text-xs font-semibold flex items-center justify-center shrink-0">
                          {(log.site_name || "S")
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <Link
                          href={`/dashboard/construction/daily-logs/${log.id}`}
                          className="font-medium text-gray-800 hover:text-[#22C55E] hover:underline"
                        >
                          {log.site_name || "—"}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      <FormattedDate value={log.date} />
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-[240px]">
                      <p className="truncate" title={log.work_description}>
                        {log.work_description}
                      </p>
                      {log.progress_notes && (
                        <p className="text-xs text-gray-400 truncate mt-0.5" title={log.progress_notes}>
                          {log.progress_notes}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{log.weather || "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{log.submitted_by_name || "-"}</td>
                    <td className="px-4 py-3">
                      <ReviewStatusBadge reviewed={Boolean(log.reviewed_by_name)} />
                    </td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="p-1 rounded hover:bg-gray-100 focus:outline-none">
                          <MoreVertical className="h-4 w-4 text-gray-400" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem
                            onClick={() => handleView(log.id)}
                            className="cursor-pointer"
                          >
                            View
                          </DropdownMenuItem>
                          {log.is_editable !== false && (
                            <DropdownMenuItem
                              onClick={() => handleEdit(log.id)}
                              className="cursor-pointer"
                            >
                              Edit
                            </DropdownMenuItem>
                          )}
                          {log.is_editable !== false && (
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600 cursor-pointer"
                              onClick={() => handleDelete(log.id, log.site_name || "site")}
                            >
                              Delete
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
