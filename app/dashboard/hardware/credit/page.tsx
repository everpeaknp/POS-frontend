"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  HardwarePageShell,
  hardwareStatCardClass,
  hardwareTableWrapClass,
} from "@/components/dashboard/HardwarePageShell";
import { customerAPI, type Customer } from "@/lib/api/sales";
import { HARDWARE_LIST_PARAMS, unwrapList, availableCredit } from "@/lib/api/hardware-helpers";
import { formatNPR } from "@/lib/utils";
import toast from "react-hot-toast";

type CreditFilter = "all" | "balance" | "over_limit" | "clear";

export default function HardwareCreditPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<CreditFilter>("all");

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await customerAPI.list(HARDWARE_LIST_PARAMS);
      setCustomers(unwrapList(response.data));
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      toast.error("Failed to load customer credit data");
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    return customers.filter((item) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !q ||
        item.name?.toLowerCase().includes(q) ||
        item.phone?.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      const balance = item.current_balance || 0;
      const overLimit =
        Boolean(item.is_over_limit) ||
        ((item.credit_limit || 0) > 0 && balance > (item.credit_limit || 0));

      if (statusFilter === "over_limit") return overLimit;
      if (statusFilter === "balance") return balance > 0 && !overLimit;
      if (statusFilter === "clear") return balance <= 0 && !overLimit;
      return true;
    });
  }, [customers, searchTerm, statusFilter]);

  const totalOutstanding = customers.reduce((sum, item) => sum + (item.current_balance || 0), 0);
  const totalCreditLimit = customers.reduce((sum, item) => sum + (item.credit_limit || 0), 0);
  const withBalance = customers.filter((c) => (c.current_balance || 0) > 0).length;

  return (
    <HardwarePageShell
      title="Customer Credit"
      subtitle="Monitor udhaar balances and credit utilization"
      loading={loading}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={hardwareStatCardClass}>
          <p className="text-xs text-gray-500 dark:text-muted-foreground">Total Outstanding</p>
          <p className="text-xl font-medium text-red-600 dark:text-red-400 tabular-nums mt-1">
            {formatNPR(totalOutstanding)}
          </p>
        </div>
        <div className={hardwareStatCardClass}>
          <p className="text-xs text-gray-500 dark:text-muted-foreground">Total Credit Limit</p>
          <p className="text-xl font-medium text-gray-900 dark:text-foreground tabular-nums mt-1">
            {formatNPR(totalCreditLimit)}
          </p>
        </div>
        <div className={hardwareStatCardClass}>
          <p className="text-xs text-gray-500 dark:text-muted-foreground">Customers with Balance</p>
          <p className="text-xl font-medium text-gray-900 dark:text-foreground tabular-nums mt-1">
            {withBalance}
          </p>
        </div>
      </div>

      <div className="flex gap-3 items-center justify-between">
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
          value={statusFilter}
          onValueChange={(v) => setStatusFilter((v as CreditFilter) || "all")}
        >
          <SelectTrigger className="w-[180px] h-9 border-gray-200 shrink-0">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="balance">Has Balance</SelectItem>
            <SelectItem value="over_limit">Over Limit</SelectItem>
            <SelectItem value="clear">Clear</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className={hardwareTableWrapClass}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-muted/50 border-b border-gray-100 dark:border-border">
              <tr>
                {["Customer", "Credit Limit", "Balance", "Available", ""].map((h) => (
                  <th
                    key={h || "actions"}
                    className={`px-4 py-3 text-xs font-medium text-gray-500 dark:text-muted-foreground uppercase ${
                      h === "" ? "text-right" : "text-left"
                    }`}
                  >
                    {h === "" ? "Actions" : h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-border">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-500 dark:text-muted-foreground">
                    No credit data found
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-foreground">
                      {item.name}
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-foreground tabular-nums">
                      {formatNPR(item.credit_limit || 0)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-sm font-medium tabular-nums ${
                          (item.current_balance || 0) > 0
                            ? "text-red-600 dark:text-red-400"
                            : "text-green-600 dark:text-green-400"
                        }`}
                      >
                        {formatNPR(item.current_balance || 0)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-foreground tabular-nums">
                      {formatNPR(availableCredit(item))}
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
