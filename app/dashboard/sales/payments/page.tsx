"use client";

import { FormattedDate } from "@/components/shared/FormattedDate";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Filter, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashHeader } from "@/components/dashboard/dash-header";
import { EmptyState } from "@/components/shared/EmptyState";
import { SkeletonTable } from "@/components/shared/Skeleton";
import { useApi } from "@/lib/hooks/useApi";
import { paymentReceivedAPI } from "@/lib/api/sales";
import { formatCurrency } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function PaymentsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState("");

  const { data, loading } = useApi(
    () => paymentReceivedAPI.list({ payment_method: methodFilter || undefined }),
    { immediate: true, deps: [methodFilter] }
  );

  const payments = Array.isArray(data) ? data : [];

  const filteredPayments = payments.filter((payment: any) =>
    payment.payment_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.reference_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paymentMethodColors: Record<string, string> = {
    cash: "bg-green-100 text-green-700",
    bank: "bg-blue-100 text-blue-700",
    esewa: "bg-purple-100 text-purple-700",
    khalti: "bg-pink-100 text-pink-700",
    fonepay: "bg-orange-100 text-orange-700",
    cheque: "bg-yellow-100 text-yellow-700",
    other: "bg-gray-100 text-gray-600",
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Payments Received" subtitle="Loading..." />
        <div className="flex-1 p-6">
          <SkeletonTable rows={5} />
        </div>
      </div>
    );
  }

  if (payments.length === 0 && !searchTerm && !methodFilter) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Payments Received" subtitle="Track customer payments" />
        <div className="flex-1 p-6">
          <EmptyState
            icon={CreditCard}
            title="No payments yet"
            description="Record your first payment to start tracking customer receipts"
            actionLabel="Record Payment"
            actionHref="/dashboard/sales/payments/new"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Payments Received" subtitle="Track customer payments" />

      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by payment, customer, or reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 border-gray-200"
              />
            </div>
            <Select value={methodFilter} onValueChange={(v) => setMethodFilter(v || "")}>
              <SelectTrigger className="w-[180px] h-10 border-gray-200 shrink-0">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Methods</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank">Bank Transfer</SelectItem>
                <SelectItem value="esewa">eSewa</SelectItem>
                <SelectItem value="khalti">Khalti</SelectItem>
                <SelectItem value="fonepay">FonePay</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => router.push("/dashboard/sales/payments/new")}
            className="bg-[#22C55E] hover:bg-[#16A34A] text-white gap-2 shrink-0"
          >
            <Plus className="h-4 w-4" />
            Record Payment
          </Button>
        </div>

        {filteredPayments.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <p className="text-gray-500">No payments found matching your filters</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Payment #", "Date", "Customer", "Amount", "Method", "Invoice", "Reference", "Received By"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredPayments.map((payment: any) => (
                  <tr key={payment.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono text-xs text-[#22C55E] font-medium">
                      {payment.payment_number}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <FormattedDate value={payment.date} />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/sales/customers/${payment.customer}`}
                        className="text-gray-700 hover:text-[#22C55E] font-medium"
                      >
                        {payment.customer_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        paymentMethodColors[payment.payment_method] || "bg-gray-100 text-gray-600"
                      }`}>
                        {payment.payment_method}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">
                      {payment.invoice_number || "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {payment.reference_number || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {payment.received_by_name || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
