"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Edit, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashHeader } from "@/components/dashboard/dash-header";
import { StatusBadge } from "@/components/purchase/StatusBadge";
import { FormattedDate } from "@/components/shared/FormattedDate";
import {
  suppliersAPI,
  purchaseOrdersAPI,
  purchaseInvoicesAPI,
  type Supplier,
  type PurchaseOrder,
  type PurchaseInvoice,
} from "@/lib/api/purchase";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";

const TABS = ["Overview", "Purchase Orders", "Invoices", "Debit Notes", "Ledger"];

export default function SupplierProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("Overview");

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const [supplierData, ordersData, invoicesData] = await Promise.all([
          suppliersAPI.get(id),
          purchaseOrdersAPI.list({ supplier: id }),
          purchaseInvoicesAPI.list({ supplier: id }),
        ]);
        setSupplier(supplierData);
        setOrders(Array.isArray(ordersData) ? ordersData : []);
        setInvoices(Array.isArray(invoicesData) ? invoicesData : []);
      } catch (error: any) {
        console.error("Error fetching supplier:", error);
        toast.error("Failed to load supplier details");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Loading..." subtitle="Supplier Profile" />
        <div className="flex-1 p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#22C55E]" />
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Supplier Not Found" subtitle="Supplier Profile" />
        <div className="flex-1 p-6 flex flex-col items-center justify-center">
          <p className="text-gray-500 mb-4">The supplier you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/dashboard/purchase/suppliers">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Suppliers
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const outstanding = supplier.outstanding_balance ?? 0;
  const totalPurchases = supplier.total_purchases ?? 0;

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title={supplier.name} subtitle="Supplier Profile" />
      <div className="flex-1 p-6 space-y-4">

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
              {supplier.phone && <span>{supplier.phone}</span>}
              {supplier.email && <span>{supplier.email}</span>}
              {supplier.pan && <span>PAN: {supplier.pan}</span>}
              {supplier.address && <span>{supplier.address}</span>}
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5"
            onClick={() => router.push(`/dashboard/purchase/suppliers/${supplier.id}/edit`)}
          >
            <Edit className="h-3.5 w-3.5" /> Edit
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Orders", value: orders.length },
            { label: "Total Purchased", value: formatCurrency(totalPurchases) },
            { label: "Outstanding", value: outstanding > 0 ? formatCurrency(outstanding) : "—" },
            { label: "Lead Time", value: supplier.lead_time_days ? `${supplier.lead_time_days} days` : "—" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm text-center">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`text-base font-bold mt-0.5 ${s.label === "Outstanding" && outstanding > 0 ? "text-red-500" : "text-gray-900"}`}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "Overview" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Supplier Details</h3>
              {[
                ["Type", supplier.type || "—"],
                ["Payment Terms", supplier.payment_terms || "—"],
                ["Credit Limit", supplier.credit_limit ? formatCurrency(supplier.credit_limit) : "—"],
                ["Bank", supplier.bank_name || "—"],
                ["Account", supplier.bank_account || "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-gray-500">{k}</span>
                  <span className="font-medium text-gray-800">{v}</span>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Purchase Summary</h3>
              {[
                ["Total Orders", orders.length],
                ["Total Purchased", formatCurrency(totalPurchases)],
                ["Outstanding Balance", outstanding > 0 ? formatCurrency(outstanding) : "Nil"],
                ["Avg Lead Time", supplier.lead_time_days ? `${supplier.lead_time_days} days` : "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-gray-500">{k}</span>
                  <span className="font-medium text-gray-800">{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "Purchase Orders" && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["PO #", "Date", "Expected Date", "Items", "Total", "Status"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.length > 0 ? orders.map((o) => (
                  <tr
                    key={o.id}
                    className="hover:bg-gray-50/50 cursor-pointer"
                    onClick={() => router.push(`/dashboard/purchase/orders/${o.id}`)}
                  >
                    <td className="px-4 py-3 font-medium text-[#22C55E]">{o.po_number}</td>
                    <td className="px-4 py-3 text-gray-600"><FormattedDate value={o.date} /></td>
                    <td className="px-4 py-3 text-gray-600"><FormattedDate value={o.expected_delivery_date} /></td>
                    <td className="px-4 py-3 text-gray-600">{o.items_count ?? o.lines?.length ?? 0}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{formatCurrency(o.total)}</td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">No orders found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === "Invoices" && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Invoice #", "Date", "Due Date", "Amount", "Paid", "Balance", "Status"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.length > 0 ? invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-gray-50/50 cursor-pointer"
                    onClick={() => router.push(`/dashboard/purchase/invoices/${inv.id}`)}
                  >
                    <td className="px-4 py-3 font-medium text-[#22C55E]">{inv.invoice_number}</td>
                    <td className="px-4 py-3 text-gray-600"><FormattedDate value={inv.date} /></td>
                    <td className="px-4 py-3 text-gray-600">
                      {inv.due_date ? <FormattedDate value={inv.due_date} /> : "—"}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{formatCurrency(inv.amount)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatCurrency(inv.paid_amount)}</td>
                    <td className={`px-4 py-3 font-medium ${inv.balance > 0 ? "text-red-500" : "text-gray-500"}`}>
                      {inv.balance > 0 ? formatCurrency(inv.balance) : "—"}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">No invoices found</td>
                  </tr>
                )}
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
