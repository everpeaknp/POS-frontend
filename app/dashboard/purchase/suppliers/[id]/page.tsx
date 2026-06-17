"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashHeader } from "@/components/dashboard/dash-header";
import { StatusBadge } from "@/components/purchase/StatusBadge";
import { mockSuppliers, mockPurchaseOrders, mockPurchaseInvoices } from "@/lib/mock-data/purchase";

const TABS = ["Overview", "Purchase Orders", "Invoices", "Debit Notes", "Ledger"];

export default function SupplierProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supplier = mockSuppliers.find((s) => s.id === id) ?? mockSuppliers[0];
  const [tab, setTab] = useState("Overview");

  const supplierOrders = mockPurchaseOrders.filter((o) => o.supplierId === supplier.id);
  const supplierInvoices = mockPurchaseInvoices.filter((i) => i.supplier === supplier.name);

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title={supplier.name} subtitle="Supplier Profile" />
      <div className="flex-1 p-6 space-y-4">

        {/* Top card */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex flex-wrap items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-[#22C55E]/10 flex items-center justify-center text-2xl font-bold text-[#22C55E]">
            {supplier.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-gray-900">{supplier.name}</h2>
              <StatusBadge status={supplier.status} />
            </div>
            <div className="flex flex-wrap gap-4 mt-1 text-sm text-gray-500">
              <span>{supplier.phone}</span>
              <span>{supplier.email}</span>
              <span>PAN: {supplier.pan}</span>
              <span>{supplier.address}</span>
            </div>
          </div>
          <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => router.push(`/dashboard/purchase/suppliers/${supplier.id}/edit`)}>
            <Edit className="h-3.5 w-3.5" /> Edit
          </Button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Orders", value: supplier.totalOrders },
            { label: "Total Purchased", value: `Rs. ${supplier.totalPurchased.toLocaleString()}` },
            { label: "Outstanding", value: supplier.outstanding > 0 ? `Rs. ${supplier.outstanding.toLocaleString()}` : "—" },
            { label: "Lead Time", value: `${supplier.leadTime} days` },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm text-center">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`text-base font-bold mt-0.5 ${s.label === "Outstanding" && supplier.outstanding > 0 ? "text-red-500" : "text-gray-900"}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {t}
            </button>
          ))}
        </div>

        {tab === "Overview" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Supplier Details</h3>
              {[["Type", supplier.type], ["Payment Terms", supplier.paymentTerms], ["Credit Limit", `Rs. ${supplier.creditLimit.toLocaleString()}`], ["Bank", supplier.bankName], ["Account", supplier.bankAccount]].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-gray-500">{k}</span><span className="font-medium text-gray-800">{v}</span>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Purchase Summary</h3>
              {[["Total Orders", supplier.totalOrders], ["Total Purchased", `Rs. ${supplier.totalPurchased.toLocaleString()}`], ["Outstanding Balance", supplier.outstanding > 0 ? `Rs. ${supplier.outstanding.toLocaleString()}` : "Nil"], ["Avg Lead Time", `${supplier.leadTime} days`]].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-gray-500">{k}</span><span className="font-medium text-gray-800">{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "Purchase Orders" && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{["PO #", "Date", "Expected Date", "Items", "Total", "Status"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {supplierOrders.length > 0 ? supplierOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50/50 cursor-pointer" onClick={() => router.push(`/dashboard/purchase/orders/${o.id}`)}>
                    <td className="px-4 py-3 font-medium text-[#22C55E]">{o.id}</td>
                    <td className="px-4 py-3 text-gray-600">{o.date}</td>
                    <td className="px-4 py-3 text-gray-600">{o.expectedDate}</td>
                    <td className="px-4 py-3 text-gray-600">{o.items}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">Rs. {o.total.toLocaleString()}</td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  </tr>
                )) : <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">No orders found</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {tab === "Invoices" && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{["Invoice #", "Date", "Due Date", "Amount", "Paid", "Balance", "Status"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {supplierInvoices.length > 0 ? supplierInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50/50 cursor-pointer" onClick={() => router.push(`/dashboard/purchase/invoices/${inv.id}`)}>
                    <td className="px-4 py-3 font-medium text-[#22C55E]">{inv.id}</td>
                    <td className="px-4 py-3 text-gray-600">{inv.date}</td>
                    <td className="px-4 py-3 text-gray-600">{inv.dueDate}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">Rs. {inv.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-600">Rs. {inv.paid.toLocaleString()}</td>
                    <td className={`px-4 py-3 font-medium ${inv.balance > 0 ? "text-red-500" : "text-gray-500"}`}>{inv.balance > 0 ? `Rs. ${inv.balance.toLocaleString()}` : "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                  </tr>
                )) : <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">No invoices found</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {(tab === "Debit Notes" || tab === "Ledger") && (
          <div className="bg-white rounded-xl border border-gray-100 p-8 shadow-sm text-center text-sm text-gray-400">
            No {tab.toLowerCase()} records found
          </div>
        )}
      </div>
    </div>
  );
}
