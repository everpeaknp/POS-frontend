"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, AlertCircle, TrendingUp, TrendingDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashHeader } from "@/components/dashboard/dash-header";
import { SkeletonTable } from "@/components/shared/Skeleton";
import { useApi } from "@/lib/hooks/useApi";
import { customerAPI } from "@/lib/api/sales";
import { formatCurrency } from "@/lib/utils";

type CreditFilter = "all" | "balance" | "over_limit" | "clear";

export default function CustomerCreditPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<CreditFilter>("all");

  const { data, loading } = useApi(
    () => customerAPI.list(),
    { immediate: true }
  );

  const customers = data?.data?.results || [];

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer: any) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !q ||
        customer.name?.toLowerCase().includes(q) ||
        customer.phone?.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (statusFilter === "over_limit") return Boolean(customer.is_over_limit);
      if (statusFilter === "balance") {
        return (customer.current_balance || 0) > 0 && !customer.is_over_limit;
      }
      if (statusFilter === "clear") {
        return (customer.current_balance || 0) <= 0 && !customer.is_over_limit;
      }
      return true;
    });
  }, [customers, searchTerm, statusFilter]);

  const totalOutstanding = customers.reduce(
    (sum: number, c: any) => sum + (c.current_balance || 0),
    0
  );
  const totalCreditLimit = customers.reduce(
    (sum: number, c: any) => sum + (c.credit_limit || 0),
    0
  );
  const customersOverLimit = customers.filter((c: any) => c.is_over_limit).length;
  const customersWithBalance = customers.filter(
    (c: any) => c.current_balance > 0
  ).length;

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Customer Credit" subtitle="Monitor customer credit and outstanding balances" />
      <div className="flex-1 p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalOutstanding)}</p>
                <p className="text-xs text-gray-500 mt-1">Total Outstanding</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalCreditLimit)}</p>
                <p className="text-xs text-gray-500 mt-1">Total Credit Limit</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{customersWithBalance}</p>
                <p className="text-xs text-gray-500 mt-1">Customers with Balance</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{customersOverLimit}</p>
                <p className="text-xs text-gray-500 mt-1">Over Credit Limit</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-md min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by customer or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 border-gray-200"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter((v as CreditFilter) || "all")}
          >
            <SelectTrigger className="w-[180px] h-10 border-gray-200 shrink-0">
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

        {loading ? (
          <SkeletonTable rows={5} />
        ) : filteredCustomers.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No customers found</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== "all"
                ? "Try a different search or filter"
                : "Create customers to track credit"}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Customer", "Phone", "Credit Limit", "Current Balance", "Available Credit", "Utilization", "Status"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredCustomers.map((customer: any) => {
                  const utilization = customer.credit_limit > 0
                    ? ((customer.current_balance / customer.credit_limit) * 100).toFixed(1)
                    : 0;

                  return (
                    <tr key={customer.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/sales/customers/${customer.id}`}
                          className="text-gray-700 hover:text-[#22C55E] font-medium"
                        >
                          {customer.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{customer.phone}</td>
                      <td className="px-4 py-3 font-medium">{formatCurrency(customer.credit_limit || 0)}</td>
                      <td className="px-4 py-3">
                        <span className={customer.current_balance > 0 ? "text-red-600 font-semibold" : "text-gray-600"}>
                          {formatCurrency(customer.current_balance || 0)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {formatCurrency(customer.available_credit || 0)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden max-w-[80px]">
                            <div
                              className={`h-full ${
                                parseFloat(utilization as string) > 90 ? "bg-red-500" :
                                parseFloat(utilization as string) > 70 ? "bg-yellow-500" :
                                "bg-green-500"
                              }`}
                              style={{ width: `${Math.min(parseFloat(utilization as string), 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600">{utilization}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {customer.is_over_limit ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            Over Limit
                          </span>
                        ) : customer.current_balance > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                            Has Balance
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Clear
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
