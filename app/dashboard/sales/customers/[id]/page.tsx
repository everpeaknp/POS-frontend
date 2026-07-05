"use client";

import { FormattedDate } from "@/components/shared/FormattedDate";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Edit, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashHeader } from "@/components/dashboard/dash-header";
import { StatusBadge } from "@/components/sales/StatusBadge";
import { SkeletonTable } from "@/components/shared/Skeleton";
import { useApi } from "@/lib/hooks/useApi";
import { customerAPI, salesOrderAPI, invoiceAPI, customerLedgerAPI } from "@/lib/api/sales";
import { formatCurrency } from "@/lib/utils";
import { CustomerPricingPanel } from "@/components/sales/CustomerPricingPanel";

const tabs = ["Overview", "Orders", "Invoices", "Credit Notes", "Ledger", "Pricing"];

export default function CustomerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("Overview");

  const { data: customerData, loading: customerLoading } = useApi(
    () => customerAPI.get(id),
    { immediate: true, deps: [id] }
  );

  const { data: ordersData, loading: ordersLoading } = useApi(
    () => salesOrderAPI.list({ customer: id }),
    { immediate: activeTab === "Orders", deps: [id, activeTab] }
  );

  const { data: invoicesData, loading: invoicesLoading } = useApi(
    () => invoiceAPI.list({ customer: id }),
    { immediate: activeTab === "Invoices", deps: [id, activeTab] }
  );

  const { data: ledgerData, loading: ledgerLoading } = useApi(
    () => customerLedgerAPI.list({ customer: id }),
    { immediate: activeTab === "Ledger", deps: [id, activeTab] }
  );

  if (customerLoading) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <DashHeader title="Loading..." subtitle="Customer Profile" />
        <div className="flex-1 p-6">
          <SkeletonTable rows={5} />
        </div>
      </div>
    );
  }

  const customer = customerData?.data;
  if (!customer) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <DashHeader title="Not Found" subtitle="Customer Profile" />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
          <p className="text-gray-500">Customer not found</p>
          <Link href="/dashboard/sales/customers">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Customers
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const orders = ordersData?.data?.results || [];
  const invoices = invoicesData?.data?.results || [];
  const ledger = ledgerData || [];

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader title={customer.name} subtitle="Customer Profile" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="w-full min-h-full space-y-6">
          {/* Action bar */}
          <div className="flex flex-wrap items-center gap-2 sticky top-0 z-10 bg-[#F3F4F6] py-2 -mx-1 px-1">
            <Link href="/dashboard/sales/customers">
              <Button variant="outline" size="sm" className="gap-1.5 h-8">
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </Button>
            </Link>
            <StatusBadge status={customer.status} />
            <div className="flex-1" />
            <Link href={`/dashboard/sales/customers/${customer.id}/aging`}>
              <Button variant="outline" size="sm" className="gap-1.5 h-8">
                Aging Report
              </Button>
            </Link>
            <Link href={`/dashboard/sales/customers/${customer.id}/edit`}>
              <Button variant="outline" size="sm" className="gap-1.5 h-8">
                <Edit className="h-3.5 w-3.5" /> Edit
              </Button>
            </Link>
          </div>

          {/* Profile card */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 lg:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#22C55E] text-white text-lg font-bold flex items-center justify-center shrink-0">
              {customer.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-900">{customer.name}</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {customer.phone} · {customer.email || 'No email'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {customer.address || 'No address'} {customer.pan && `· PAN: ${customer.pan}`}
              </p>
              {customer.current_balance > 0 && (
                <p className="text-sm font-semibold text-red-600 mt-1">
                  Outstanding: {formatCurrency(customer.current_balance)}
                </p>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 px-4 flex gap-1 overflow-x-auto">
              {tabs.map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                    activeTab === t
                      ? "border-[#22C55E] text-[#22C55E]"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="p-5 lg:p-6">
            {activeTab === "Overview" && (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
                {[
                  { label: "Total Orders", value: customer.total_orders || 0 },
                  { label: "Total Spent", value: formatCurrency(customer.total_spent || 0) },
                  { label: "Credit Limit", value: formatCurrency(customer.credit_limit || 0) },
                  { label: "Payment Terms", value: customer.payment_terms || 'N/A' },
                ].map((s) => (
                  <div key={s.label} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <p className="text-xl font-bold text-gray-900">{s.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "Orders" && (
              ordersLoading ? (
                <SkeletonTable rows={3} />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {["Order #", "Date", "Items", "Total", "Status"].map((h) => (
                        <th key={h} className="text-left text-xs text-gray-400 font-medium pb-2 px-2">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-sm text-gray-400">
                          No orders
                        </td>
                      </tr>
                    ) : (
                      orders.map((o: any) => (
                        <tr key={o.id} className="hover:bg-gray-50/50">
                          <td className="px-2 py-2.5 font-mono text-xs text-[#22C55E]">
                            <Link href={`/dashboard/sales/orders/${o.id}`} className="hover:underline">
                              {o.order_number}
                            </Link>
                          </td>
                          <td className="px-2 py-2.5 text-gray-600">
                            <FormattedDate value={o.date} />
                          </td>
                          <td className="px-2 py-2.5 text-gray-600">{o.items_count || 0}</td>
                          <td className="px-2 py-2.5 font-medium">{formatCurrency(o.total)}</td>
                          <td className="px-2 py-2.5">
                            <StatusBadge status={o.status} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )
            )}

            {activeTab === "Invoices" && (
              invoicesLoading ? (
                <SkeletonTable rows={3} />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {["Invoice #", "Date", "Due Date", "Amount", "Balance", "Status"].map((h) => (
                        <th key={h} className="text-left text-xs text-gray-400 font-medium pb-2 px-2">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {invoices.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-sm text-gray-400">
                          No invoices
                        </td>
                      </tr>
                    ) : (
                      invoices.map((inv: any) => (
                        <tr key={inv.id} className="hover:bg-gray-50/50">
                          <td className="px-2 py-2.5 font-mono text-xs text-[#22C55E]">
                            {inv.invoice_number}
                          </td>
                          <td className="px-2 py-2.5 text-gray-600">
                            <FormattedDate value={inv.date} />
                          </td>
                          <td className="px-2 py-2.5 text-gray-600">
                            <FormattedDate value={inv.due_date} />
                          </td>
                          <td className="px-2 py-2.5 font-medium">{formatCurrency(inv.amount)}</td>
                          <td className="px-2 py-2.5 text-red-600">{formatCurrency(inv.balance)}</td>
                          <td className="px-2 py-2.5">
                            <StatusBadge status={inv.status} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )
            )}

            {activeTab === "Ledger" && (
              ledgerLoading ? (
                <SkeletonTable rows={3} />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {["Date", "Type", "Reference", "Debit", "Credit", "Balance"].map((h) => (
                        <th key={h} className="text-left text-xs text-gray-400 font-medium pb-2 px-2">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {ledger.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-sm text-gray-400">
                          No ledger entries
                        </td>
                      </tr>
                    ) : (
                      ledger.map((entry: any) => (
                        <tr key={entry.id} className="hover:bg-gray-50/50">
                          <td className="px-2 py-2.5 text-gray-600">
                            <FormattedDate value={entry.date} />
                          </td>
                          <td className="px-2 py-2.5 text-gray-600 capitalize">{entry.transaction_type}</td>
                          <td className="px-2 py-2.5 font-mono text-xs text-[#22C55E]">
                            {entry.reference_number}
                          </td>
                          <td className="px-2 py-2.5 text-red-600">
                            {entry.debit_amount > 0 ? formatCurrency(entry.debit_amount) : '-'}
                          </td>
                          <td className="px-2 py-2.5 text-green-600">
                            {entry.credit_amount > 0 ? formatCurrency(entry.credit_amount) : '-'}
                          </td>
                          <td className="px-2 py-2.5 font-medium">{formatCurrency(entry.running_balance)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )
            )}

            {activeTab === "Credit Notes" && (
              <p className="text-sm text-gray-400 py-6 text-center">No credit notes found</p>
            )}

            {activeTab === "Pricing" && (
              <CustomerPricingPanel customerId={id} />
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
