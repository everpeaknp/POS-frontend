"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, MoreVertical, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DashHeader } from "@/components/dashboard/dash-header";
import { DateInput } from "@/components/shared/DateInput";
import { FormattedDate } from "@/components/shared/FormattedDate";
import { EmptyState } from "@/components/shared/EmptyState";
import { SkeletonTable } from "@/components/shared/Skeleton";
import { useApi } from "@/lib/hooks/useApi";
import { constructionApi } from "@/lib/api/construction";
import { todayIsoDate } from "@/lib/dates";
import { formatNPR } from "@/lib/utils";
import toast from "react-hot-toast";

export default function EquipmentUsagePage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [siteFilter, setSiteFilter] = useState("All");
  const [equipmentFilter, setEquipmentFilter] = useState("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    equipment: "",
    site: "",
    date: todayIsoDate(),
    hours_used: "",
    notes: "",
  });

  const { data: sitesData } = useApi(() => constructionApi.sites.list(), { deps: [] });
  const { data: equipmentData } = useApi(() => constructionApi.equipment.list(), { deps: [] });
  const sites = sitesData || [];
  const equipment = equipmentData || [];

  const { data: logsData, loading, refetch } = useApi(
    () =>
      constructionApi.equipmentUsage.list({
        search: search || undefined,
        site: siteFilter === "All" ? undefined : siteFilter,
        equipment: equipmentFilter === "All" ? undefined : equipmentFilter,
      }),
    { immediate: true, deps: [search, siteFilter, equipmentFilter] }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await constructionApi.equipmentUsage.create({
        equipment: form.equipment,
        site: form.site,
        date: form.date,
        hours_used: parseFloat(form.hours_used),
        notes: form.notes || undefined,
      });
      toast.success("Usage logged");
      setDialogOpen(false);
      setForm({
        equipment: "",
        site: "",
        date: todayIsoDate(),
        hours_used: "",
        notes: "",
      });
      refetch();
    } catch (error: unknown) {
      console.error(error);
      toast.error("Failed to log usage");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, equipmentName: string) => {
    const confirmDelete = () => {
      toast.promise(constructionApi.equipmentUsage.delete(id), {
        loading: "Deleting usage log...",
        success: () => {
          refetch();
          return `Usage log for ${equipmentName} deleted successfully`;
        },
        error: (err) =>
          err.response?.data?.detail || err.response?.data?.message || "Failed to delete usage log",
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
              <p className="font-semibold text-gray-900 text-base">Delete this usage log?</p>
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

  const dialog = (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log Equipment Usage</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div>
            <Label>Equipment *</Label>
            <Select
              value={form.equipment}
              onValueChange={(v) => setForm({ ...form, equipment: v ?? "" })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select equipment" />
              </SelectTrigger>
              <SelectContent>
                {equipment.map((e) => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Site *</Label>
            <Select value={form.site} onValueChange={(v) => setForm({ ...form, site: v ?? "" })}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select site" />
              </SelectTrigger>
              <SelectContent>
                {sites.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Date *</Label>
            <DateInput
              value={form.date}
              onChange={(date) => setForm({ ...form, date })}
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label>Hours Used *</Label>
            <Input
              type="number"
              step="0.5"
              min="0"
              value={form.hours_used}
              onChange={(e) => setForm({ ...form, hours_used: e.target.value })}
              className="mt-1"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Cost is calculated automatically from equipment rental rates.
            </p>
          </div>
          <div>
            <Label>Notes</Label>
            <Input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="mt-1"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white"
            >
              {submitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );

  if (loading) {
    return (
      <>
        <div className="flex flex-col min-h-full">
          <DashHeader title="Equipment Usage" subtitle="Loading..." />
          <div className="flex-1 p-6">
            <SkeletonTable rows={10} />
          </div>
        </div>
        {dialog}
      </>
    );
  }

  const logs = logsData || [];

  if (logs.length === 0 && !search && siteFilter === "All" && equipmentFilter === "All") {
    return (
      <>
        <div className="flex flex-col min-h-full">
          <DashHeader title="Equipment Usage" subtitle="Track equipment hours and costs by site" />
          <div className="flex-1 p-6">
            <EmptyState
              icon={Clock}
              title="No usage logs yet"
              description="Log equipment hours and costs to track usage across your sites"
              actionLabel="Log Usage"
              onAction={() => setDialogOpen(true)}
            />
          </div>
        </div>
        {dialog}
      </>
    );
  }

  const filtered = logs.filter((log) => {
    const query = search.toLowerCase();
    return (
      search === "" ||
      (log.equipment_name && log.equipment_name.toLowerCase().includes(query)) ||
      (log.site_name && log.site_name.toLowerCase().includes(query)) ||
      (log.notes && log.notes.toLowerCase().includes(query))
    );
  });

  return (
    <>
      <div className="flex flex-col min-h-full">
        <DashHeader title="Equipment Usage" subtitle={`${filtered.length} logs`} />
        <div className="flex-1 p-6 space-y-4">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search usage logs..."
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
              <Select value={equipmentFilter} onValueChange={(v) => setEquipmentFilter(v ?? "All")}>
                <SelectTrigger className="h-9 w-44 text-sm border-gray-200 bg-white">
                  <SelectValue placeholder="All Equipment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Equipment</SelectItem>
                  {equipment.map((item) => (
                    <SelectItem key={item.id} value={String(item.id)}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              size="sm"
              className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="h-4 w-4" /> Log Usage
            </Button>
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <p className="text-gray-500">No usage logs found matching your filters</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["Equipment", "Site", "Date", "Hours", "Cost", "Notes", "Actions"].map((h) => (
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
                            {(log.equipment_name || "E")
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-800">
                            {log.equipment_name || log.equipment}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-[140px] truncate">
                        {log.site_name || log.site}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        <FormattedDate value={log.date} />
                      </td>
                      <td className="px-4 py-3 text-gray-600">{log.hours_used}h</td>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {formatNPR(Number(log.cost))}
                      </td>
                      <td
                        className="px-4 py-3 text-gray-500 max-w-[160px] truncate"
                        title={log.notes || ""}
                      >
                        {log.notes || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="p-1 rounded hover:bg-gray-100 focus:outline-none">
                            <MoreVertical className="h-4 w-4 text-gray-400" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/dashboard/construction/equipment/${log.equipment}`)
                              }
                              className="cursor-pointer"
                            >
                              View Equipment
                            </DropdownMenuItem>
                            {log.daily_log && (
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(`/dashboard/construction/daily-logs/${log.daily_log}`)
                                }
                                className="cursor-pointer"
                              >
                                View Daily Log
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600 cursor-pointer"
                              onClick={() =>
                                handleDelete(log.id, log.equipment_name || "equipment")
                              }
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
      {dialog}
    </>
  );
}
