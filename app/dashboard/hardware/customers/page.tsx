"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  HardwarePageShell,
  hardwareInputClass,
  hardwareTableWrapClass,
} from "@/components/dashboard/HardwarePageShell";
import { customerAPI, type Customer } from "@/lib/api/sales";
import { formatNPR } from "@/lib/utils";
import toast from "react-hot-toast";

export default function HardwareCustomersPage() {
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
      const response = await customerAPI.list();
      const data = response.data;
      setCustomers(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <HardwarePageShell
      title="Hardware Customers"
      subtitle="Manage customers with credit limits and payment tracking"
      loading={loading}
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={hardwareInputClass}
          />
        </div>
        <Link href="/dashboard/hardware/customers/new">
          <Button size="sm" className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5">
            <Plus className="h-4 w-4" />
            New Customer
          </Button>
        </Link>
      </div>

      <div className={hardwareTableWrapClass}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-muted/50 border-b border-gray-100 dark:border-border">
              <tr>
                {["Name", "Contact", "Credit Limit", "Balance", ""].map((h) => (
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
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-500 dark:text-muted-foreground">
                    No customers found
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => router.push(`/dashboard/hardware/customers/${customer.id}`)}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-foreground">
                      {customer.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground">
                      {customer.email || customer.phone || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-foreground tabular-nums">
                      {formatNPR(customer.credit_limit || 0)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-sm font-medium tabular-nums ${
                          (customer.current_balance || 0) > 0
                            ? "text-red-600 dark:text-red-400"
                            : "text-green-600 dark:text-green-400"
                        }`}
                      >
                        {formatNPR(customer.current_balance || 0)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/hardware/customers/${customer.id}`);
                        }}
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
