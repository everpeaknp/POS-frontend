"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, Lock, Plus, Search } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AccountingPageShell } from "@/components/dashboard/AccountingPageShell";
import { FormattedDate } from "@/components/shared/FormattedDate";
import { fiscalYearsAPI, type FiscalYear } from "@/lib/api/accounting";

type StatusFilter = "all" | "open" | "closed";

export default function FiscalYearPage() {
  const [loading, setLoading] = useState(true);
  const [years, setYears] = useState<FiscalYear[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [closingId, setClosingId] = useState<number | null>(null);
  const [confirmClose, setConfirmClose] = useState<FiscalYear | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const list = await fiscalYearsAPI.list();
      setYears(list);
    } catch {
      toast.error("Failed to load fiscal years");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredYears = useMemo(() => {
    return years.filter((fy) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !q ||
        fy.label?.toLowerCase().includes(q) ||
        String(fy.bs_start_year || "").includes(q);

      if (!matchesSearch) return false;
      if (statusFilter === "open") return !fy.is_closed;
      if (statusFilter === "closed") return Boolean(fy.is_closed);
      return true;
    });
  }, [years, searchTerm, statusFilter]);

  const handleEnsureCurrent = async () => {
    try {
      await fiscalYearsAPI.ensureCurrent();
      toast.success("Current fiscal year ensured");
      await load();
    } catch {
      toast.error("Failed to ensure fiscal year");
    }
  };

  const handleClose = async () => {
    if (!confirmClose) return;
    try {
      setClosingId(confirmClose.id);
      await fiscalYearsAPI.close(confirmClose.id);
      toast.success(`Fiscal year ${confirmClose.label} closed — period locked`);
      setConfirmClose(null);
      await load();
    } catch {
      toast.error("Failed to close fiscal year");
    } finally {
      setClosingId(null);
    }
  };

  return (
    <AccountingPageShell
      title="Fiscal Year"
      subtitle="Nepal BS fiscal periods (Shrawan–Ashadh) · period locking"
      loading={loading}
      loadingMessage="Loading fiscal years…"
    >
      <div className="flex gap-3 items-center justify-between">
        <div className="flex gap-3 items-center flex-1 min-w-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by FY label or year..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-sm border-gray-200"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter((v as StatusFilter) || "all")}
          >
            <SelectTrigger className="w-[140px] h-9 border-gray-200 shrink-0">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          size="sm"
          className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5 shrink-0"
          onClick={handleEnsureCurrent}
        >
          <Plus className="h-4 w-4" /> Ensure current FY
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">FY Label</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">BS Start Year</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Period (AD)</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {years.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No fiscal years yet. Click &quot;Ensure current FY&quot; to create the active period.
                </td>
              </tr>
            ) : filteredYears.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No fiscal years found matching your filters
                </td>
              </tr>
            ) : (
              filteredYears.map((fy) => (
                <tr key={fy.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium">{fy.label}</td>
                  <td className="px-4 py-3">{fy.bs_start_year}</td>
                  <td className="px-4 py-3 text-gray-600">
                    <FormattedDate value={fy.start_date} /> – <FormattedDate value={fy.end_date} />
                  </td>
                  <td className="px-4 py-3">
                    {fy.is_closed ? (
                      <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-xs">
                        <Lock className="h-3 w-3" /> Closed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded text-xs">
                        <Calendar className="h-3 w-3" /> Open
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!fy.is_closed && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={closingId === fy.id}
                        onClick={() => setConfirmClose(fy)}
                      >
                        Close FY
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {confirmClose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold">Close fiscal year {confirmClose.label}?</h3>
            <p className="text-sm text-gray-500 mt-2">
              Posted transactions in this period will be locked. This action cannot be undone without admin intervention.
            </p>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setConfirmClose(null)}>
                Cancel
              </Button>
              <Button
                className="bg-amber-600 hover:bg-amber-700 text-white"
                onClick={handleClose}
                disabled={closingId !== null}
              >
                {closingId ? "Closing…" : "Close fiscal year"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AccountingPageShell>
  );
}
