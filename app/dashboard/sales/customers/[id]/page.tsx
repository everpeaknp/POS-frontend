"use client";

import { FormattedDate } from "@/components/shared/FormattedDate";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Edit, ArrowLeft, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashHeader } from "@/components/dashboard/dash-header";
import { StatusBadge } from "@/components/sales/StatusBadge";
import { SkeletonTable } from "@/components/shared/Skeleton";
import { useApi } from "@/lib/hooks/useApi";
import { customerAPI, invoiceAPI } from "@/lib/api/sales";
import { formatCurrency } from "@/lib/utils";

export default function CustomerProfilePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const { data: customerData, loading: customerLoading } = useApi(
    () => customerAPI.get(id),
    { immediate: true, deps: [id] }
  );

  const { data: invoicesData, loading: invoicesLoading } = useApi(
    () => invoiceAPI.list({ customer: id }),
    { immediate: true, deps: [id] }
  );

  if (customerLoading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Loading..." subtitle="Customer Details" />
        <div className="flex-1 p-6">
          <SkeletonTable rows={5} />
        </div>
      </div>
    );
  }

  const customer = customerData?.data;
  if (!customer) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Not Found" subtitle="Customer Details" />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
          <p className="text-gray-500 dark:text-muted-foreground">Customer not found</p>
          <Button onClick={() => router.back()} variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </div>
      </div>
    );
  }

  const invoices = invoicesData?.data?.results || [];

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title={customer.name} subtitle="Customer Details" />

      <div className="flex-1 p-6 space-y-6">
        {/* Customer Info Card */}
        <div className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-[#4A5D7A]/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-[#4A5D7A]">{getInitials(customer.name)}</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-foreground mb-1">{customer.name}</h2>
                  <StatusBadge status={customer.status} />
                </div>
              </div>
              <Link href={`/dashboard/sales/customers/${customer.id}/edit`}>
                <Button size="sm" className="bg-[#4A5D7A] hover:bg-[#2E3E52] text-white gap-2">
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {customer.phone && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-muted-foreground mb-1">Phone</p>
                  <p className="text-base font-medium text-gray-900 dark:text-foreground">{customer.phone}</p>
                </div>
              )}
              {customer.email && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-muted-foreground mb-1">Email</p>
                  <p className="text-base font-medium text-gray-900 dark:text-foreground">{customer.email}</p>
                </div>
              )}
              {customer.pan && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-muted-foreground mb-1">PAN</p>
                  <p className="text-base font-medium text-gray-900 dark:text-foreground">{customer.pan}</p>
                </div>
              )}
              {customer.address && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-muted-foreground mb-1">Address</p>
                  <p className="text-base font-medium text-gray-900 dark:text-foreground">{customer.address}</p>
                </div>
              )}
            </div>
          </div>

          {/* Financial Summary */}
          <div className="border-t border-gray-100 dark:border-border bg-gray-50 dark:bg-muted/50 px-6 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-muted-foreground mb-1">Total Orders</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-foreground">{customer.total_orders || 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-muted-foreground mb-1">Total Spent</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-foreground">{formatCurrency(customer.total_spent || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-muted-foreground mb-1">Outstanding</p>
                <p className="text-lg font-semibold text-red-600 dark:text-red-400">{formatCurrency(customer.current_balance || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-muted-foreground mb-1">Credit Limit</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-foreground">{formatCurrency(customer.credit_limit || 0)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Orders/Invoices List */}
        <div className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-border">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground">Invoices</h3>
          </div>
          
          {invoicesLoading ? (
            <div className="p-6">
              <SkeletonTable rows={3} />
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 dark:text-muted-foreground">No invoices yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-muted/50 border-b border-gray-100 dark:border-border">
                  <tr>
                    {["Invoice #", "Date", "Due Date", "Amount", "Balance", "Status"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-muted-foreground uppercase">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-border">
                  {invoices.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-gray-50/50 dark:hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono text-xs text-[#4A5D7A]">
                        <Link href={`/dashboard/sales/invoices/${inv.id}`} className="hover:underline">
                          {inv.invoice_number}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground">
                        <FormattedDate value={inv.date} />
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground">
                        <FormattedDate value={inv.due_date} />
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-foreground">{formatCurrency(inv.amount)}</td>
                      <td className="px-4 py-3 font-medium text-red-600 dark:text-red-400">{formatCurrency(inv.balance)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={inv.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
