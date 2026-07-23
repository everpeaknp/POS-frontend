"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  HardwarePageShell,
  hardwareCardClass,
  hardwareTableWrapClass,
} from "@/components/dashboard/HardwarePageShell";
import { EmptyState } from "@/components/shared/EmptyState";
import { customerAPI, type Customer } from "@/lib/api/sales";
import { HARDWARE_LIST_PARAMS, unwrapList } from "@/lib/api/hardware-helpers";
import { formatNPR } from "@/lib/utils";
import toast from "react-hot-toast";

type CreditFilter = "all" | "balance" | "over_limit" | "clear";

export default function HardwareCustomersPage() {
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
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      customer.name?.toLowerCase().includes(q) ||
      customer.email?.toLowerCase().includes(q) ||
      customer.phone?.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    const balance = customer.current_balance || 0;
    const overLimit =
      Boolean(customer.is_over_limit) ||
      ((customer.credit_limit || 0) > 0 && balance > (customer.credit_limit || 0));

    if (statusFilter === "over_limit") return overLimit;
    if (statusFilter === "balance") return balance > 0 && !overLimit;
    if (statusFilter === "clear") return balance <= 0 && !overLimit;
    return true;
  });

  if (!loading && customers.length === 0 && !searchTerm && statusFilter === "all") {
    return (
      <HardwarePageShell
        title="Hardware Customers"
        subtitle="Manage customers with credit limits and payment tracking"
      >
        <EmptyState
            icon={Users}
            title="No customers yet"
            description="Add your first customer to start tracking credit limits and payments"
            actionLabel="New Customer"
            actionHref="/dashboard/hardware/customers/new"
          />
      </HardwarePageShell>
    );
  }

  return (
    <HardwarePageShell
      title="Hardware Customers"
      subtitle="Manage customers with credit limits and payment tracking"
      loading={loading}
    >
      <div className="flex gap-3 items-center justify-between">
        <div className="flex gap-3 items-center flex-1 min-w-0">
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
            <SelectTrigger className="w-[160px] h-9 border-gray-200 shrink-0">
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
        <Link href="/dashboard/hardware/customers/new">
          <Button size="sm" className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5 shrink-0">
            <Plus className="h-4 w-4" /> New Customer
          </Button>
        </Link>
      </div>

      {filteredCustomers.length === 0 ? (
        <div className={`${hardwareCardClass} p-12 text-center`}>
          <p className="text-gray-500 dark:text-muted-foreground">No customers found matching your search</p>
        </div>
      ) : (
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
              {filteredCustomers.map((customer) => (
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
                ))}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </HardwarePageShell>
  );
}
