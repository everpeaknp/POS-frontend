"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  HardwarePageShell,
  hardwareStatCardClass,
  hardwareTableWrapClass,
} from "@/components/dashboard/HardwarePageShell";
import { customerAPI, customerCreditAPI, type AgingReport } from "@/lib/api/sales";
import { HARDWARE_LIST_PARAMS, unwrapList, availableCredit } from "@/lib/api/hardware-helpers";
import { formatNPR } from "@/lib/utils";
import toast from "react-hot-toast";

interface AgingRow extends AgingReport {
  id: string;
}

type AgingFilter = "all" | "current" | "days_30_60" | "days_60_90" | "days_90_plus" | "over_limit";

export default function HardwareAgingPage() {
  const router = useRouter();
  const [rows, setRows] = useState<AgingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [bucketFilter, setBucketFilter] = useState<AgingFilter>("all");

  useEffect(() => {
    fetchAging();
  }, []);

  const fetchAging = async () => {
    try {
      setLoading(true);
      const response = await customerAPI.list(HARDWARE_LIST_PARAMS);
      const customers = unwrapList(response.data).filter((c) => (c.current_balance || 0) > 0);

      const reports = await Promise.all(
        customers.map(async (customer) => {
          try {
            const report = await customerCreditAPI.getAgingReport(customer.id);
            return { ...report, id: customer.id };
          } catch {
            return {
              id: customer.id,
              customer_id: customer.id,
              customer_name: customer.name,
              total_outstanding: customer.current_balance || 0,
              current: customer.current_balance || 0,
              days_30_60: 0,
              days_60_90: 0,
              days_90_plus: 0,
              overdue_invoices: [],
              credit_limit: customer.credit_limit || 0,
              available_credit: availableCredit(customer),
              is_over_limit: customer.is_over_limit ?? false,
            } satisfies AgingRow;
          }
        })
      );

      setRows(reports);
    } catch (error) {
      console.error("Failed to fetch aging data:", error);
      toast.error("Failed to load aging data");
    } finally {
      setLoading(false);
    }
  };

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = !q || row.customer_name?.toLowerCase().includes(q);
      if (!matchesSearch) return false;

      if (bucketFilter === "current") return (row.current || 0) > 0;
      if (bucketFilter === "days_30_60") return (row.days_30_60 || 0) > 0;
      if (bucketFilter === "days_60_90") return (row.days_60_90 || 0) > 0;
      if (bucketFilter === "days_90_plus") return (row.days_90_plus || 0) > 0;
      if (bucketFilter === "over_limit") return Boolean(row.is_over_limit);
      return true;
    });
  }, [rows, searchTerm, bucketFilter]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, row) => ({
          outstanding: acc.outstanding + (row.total_outstanding || 0),
          current: acc.current + (row.current || 0),
          days_30_60: acc.days_30_60 + (row.days_30_60 || 0),
          days_60_90: acc.days_60_90 + (row.days_60_90 || 0),
          days_90_plus: acc.days_90_plus + (row.days_90_plus || 0),
          credit_limit: acc.credit_limit + (row.credit_limit || 0),
        }),
        { outstanding: 0, current: 0, days_30_60: 0, days_60_90: 0, days_90_plus: 0, credit_limit: 0 }
      ),
    [rows]
  );

  return (
    <HardwarePageShell
      title="Aging Report"
      subtitle="Outstanding balances by invoice age (0–30, 31–60, 61–90, 90+ days)"
      loading={loading}
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className={hardwareStatCardClass}>
          <p className="text-xs text-gray-500 dark:text-muted-foreground">Total Outstanding</p>
          <p className="text-lg font-medium text-red-600 dark:text-red-400 tabular-nums mt-1">
            {formatNPR(totals.outstanding)}
          </p>
        </div>
        <div className={hardwareStatCardClass}>
          <p className="text-xs text-gray-500 dark:text-muted-foreground">Current (0–30d)</p>
          <p className="text-lg font-medium text-gray-900 dark:text-foreground tabular-nums mt-1">
            {formatNPR(totals.current)}
          </p>
        </div>
        <div className={hardwareStatCardClass}>
          <p className="text-xs text-gray-500 dark:text-muted-foreground">31–60 days</p>
          <p className="text-lg font-medium text-amber-600 tabular-nums mt-1">
            {formatNPR(totals.days_30_60)}
          </p>
        </div>
        <div className={hardwareStatCardClass}>
          <p className="text-xs text-gray-500 dark:text-muted-foreground">61–90 days</p>
          <p className="text-lg font-medium text-orange-600 tabular-nums mt-1">
            {formatNPR(totals.days_60_90)}
          </p>
        </div>
        <div className={hardwareStatCardClass}>
          <p className="text-xs text-gray-500 dark:text-muted-foreground">90+ days</p>
          <p className="text-lg font-medium text-red-700 tabular-nums mt-1">
            {formatNPR(totals.days_90_plus)}
          </p>
        </div>
        <div className={hardwareStatCardClass}>
          <p className="text-xs text-gray-500 dark:text-muted-foreground">Customers</p>
          <p className="text-lg font-medium text-gray-900 dark:text-foreground tabular-nums mt-1">
            {rows.length}
          </p>
        </div>
      </div>

      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-sm border-gray-200"
          />
        </div>
        <Select
          value={bucketFilter}
          onValueChange={(v) => setBucketFilter((v as AgingFilter) || "all")}
        >
          <SelectTrigger className="w-[180px] h-9 border-gray-200 shrink-0">
            <SelectValue placeholder="All Buckets" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Buckets</SelectItem>
            <SelectItem value="current">Current (0–30d)</SelectItem>
            <SelectItem value="days_30_60">31–60 days</SelectItem>
            <SelectItem value="days_60_90">61–90 days</SelectItem>
            <SelectItem value="days_90_plus">90+ days</SelectItem>
            <SelectItem value="over_limit">Over Limit</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className={hardwareTableWrapClass}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-muted/50 border-b border-gray-100 dark:border-border">
              <tr>
                {["Customer", "Current", "31–60", "61–90", "90+", "Total", ""].map((h) => (
                  <th
                    key={h || "actions"}
                    className={`px-4 py-3 text-xs font-medium text-gray-500 dark:text-muted-foreground uppercase ${
                      h === "" ? "text-right" : h === "Customer" ? "text-left" : "text-right"
                    }`}
                  >
                    {h === "" ? "Actions" : h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-border">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500 dark:text-muted-foreground">
                    {searchTerm || bucketFilter !== "all"
                      ? "No customers found matching your filters"
                      : "No customers with outstanding balance"}
                  </td>
                </tr>
              ) : (
                filteredRows.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-foreground">
                      {item.customer_name}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-foreground tabular-nums">
                      {formatNPR(item.current || 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-amber-600 tabular-nums">
                      {formatNPR(item.days_30_60 || 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-orange-600 tabular-nums">
                      {formatNPR(item.days_60_90 || 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-red-600 dark:text-red-400 tabular-nums">
                      {formatNPR(item.days_90_plus || 0)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-foreground tabular-nums">
                      {formatNPR(item.total_outstanding || 0)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => router.push(`/dashboard/hardware/customers/${item.id}`)}
                        className="text-sm text-[#22C55E] hover:text-[#16A34A] font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </HardwarePageShell>
  );
}
