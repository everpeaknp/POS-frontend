"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import {
  HardwarePageShell,
  hardwareCardClass,
  hardwareInputClass,
  hardwareStatCardClass,
  hardwareTableWrapClass,
} from "@/components/dashboard/HardwarePageShell";
import { customerAPI, type Customer } from "@/lib/api/sales";
import { HARDWARE_LIST_PARAMS, unwrapList, availableCredit } from "@/lib/api/hardware-helpers";
import { formatNPR } from "@/lib/utils";
import toast from "react-hot-toast";

export default function HardwareCreditPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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

  const filteredData = customers.filter((item) =>
    item.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      <div className={`${hardwareCardClass} p-4`}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={hardwareInputClass}
          />
        </div>
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
