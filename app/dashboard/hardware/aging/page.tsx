"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  HardwarePageShell,
  hardwareStatCardClass,
  hardwareTableWrapClass,
} from "@/components/dashboard/HardwarePageShell";
import { customerAPI, type Customer } from "@/lib/api/sales";
import { formatNPR } from "@/lib/utils";
import toast from "react-hot-toast";

export default function HardwareAgingPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await customerAPI.list();
      const customersWithBalance = (response.data.results || []).filter(
        (c: Customer) => (c.current_balance || 0) > 0
      );
      setCustomers(customersWithBalance);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      toast.error("Failed to load aging data");
    } finally {
      setLoading(false);
    }
  };

  const totalOutstanding = customers.reduce((sum, c) => sum + (c.current_balance || 0), 0);
  const totalCreditLimit = customers.reduce((sum, c) => sum + (c.credit_limit || 0), 0);

  return (
    <HardwarePageShell
      title="Aging Report"
      subtitle="Outstanding balances and credit utilization"
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
            {customers.length}
          </p>
        </div>
      </div>

      <div className={hardwareTableWrapClass}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-muted/50 border-b border-gray-100 dark:border-border">
              <tr>
                {["Customer", "Credit Limit", "Outstanding", "Available", ""].map((h) => (
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
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-500 dark:text-muted-foreground">
                    No customers with outstanding balance
                  </td>
                </tr>
              ) : (
                customers.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-foreground">
                      {item.name}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-foreground tabular-nums">
                      {formatNPR(item.credit_limit || 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-red-600 dark:text-red-400 font-medium tabular-nums">
                      {formatNPR(item.current_balance || 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-foreground tabular-nums">
                      {formatNPR((item.credit_limit || 0) - (item.current_balance || 0))}
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
