"use client";

import { FormattedDate } from "@/components/shared/FormattedDate";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, MoreHorizontal, Eye, Edit, CreditCard, Printer, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashHeader } from "@/components/dashboard/dash-header";
import { StatusBadge } from "@/components/purchase/StatusBadge";
import { purchaseInvoicesAPI, type PurchaseInvoice } from "@/lib/api/purchase";
import toast from "react-hot-toast";

const STATUSES = ["All", "Received", "Partially Paid", "Paid", "Overdue"];

export default function PurchaseInvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [menu, setMenu] = useState<string | null>(null);

  useEffect(() => {
    loadInvoices();
  }, [status]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (status !== "All") {
        params.status = status.toLowerCase().replace(" ", "_");
      }
      const data = await purchaseInvoicesAPI.list(params);
      setInvoices(Array.isArray(data) ? data : (data as any).results || []);
    } catch (error) {
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  const filtered = invoices.filter((inv) => {
    const matchSearch = inv.invoice_number.toLowerCase().includes(search.toLowerCase()) || 
                       (inv.supplier_name || "").toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Purchase Invoices" subtitle="Manage supplier invoices and payables" />
      <div className="flex-1 p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm border-gray-200" placeholder="Search invoices..." />
          </div>
          <Select value={status} onValueChange={(v) => setStatus(v || "All")}>
            <SelectTrigger className="h-9 w-40 text-sm border-gray-200"><SelectValue /></SelectTrigger>
            <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <div className="flex-1" />
          <Button variant="outline" size="sm" className="h-9 text-gray-600 border-gray-200">Export CSV</Button>
          <Button size="sm" className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5" onClick={() => router.push("/dashboard/purchase/invoices/new")}>
            <Plus className="h-4 w-4" /> New Invoice
          </Button>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{["Invoice #", "Date", "Due Date", "Supplier", "Amount", "Paid", "Balance", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={9} className="px-4 py-10 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-gray-400" /></td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-400">No invoices found</td></tr>
                ) : (
                  filtered.map((inv) => (
                    <tr key={inv.id} className={`hover:bg-gray-50/50 transition-colors ${inv.status === "Overdue" ? "border-l-2 border-red-400" : ""}`}>
                      <td className="px-4 py-3 font-medium text-[#22C55E] cursor-pointer hover:underline" onClick={() => router.push(`/dashboard/purchase/invoices/${inv.id}`)}>{inv.invoice_number}</td>
                      <td className="px-4 py-3 text-gray-600"><FormattedDate value={inv.date} /></td>
                      <td className={`px-4 py-3 ${inv.status === "Overdue" ? "text-red-500 font-medium" : "text-gray-600"}`}><FormattedDate value={inv.due_date || ""} /></td>
                      <td className="px-4 py-3 font-medium text-gray-800">{inv.supplier_name}</td>
                      <td className="px-4 py-3 font-semibold text-gray-800">Rs. {inv.amount?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-600">Rs. {inv.paid_amount?.toLocaleString()}</td>
                      <td className={`px-4 py-3 font-medium ${inv.balance > 0 ? "text-red-500" : "text-gray-500"}`}>{inv.balance > 0 ? `Rs. ${inv.balance.toLocaleString()}` : "—"}</td>
                      <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                      <td className="px-4 py-3">
                        <div className="relative">
                          <button onClick={() => setMenu(menu === inv.id ? null : inv.id)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                          {menu === inv.id && (
                            <div className="absolute right-0 top-8 z-10 bg-white border border-gray-100 rounded-lg shadow-lg py-1 min-w-[160px]">
                              {[
                                { icon: Eye, label: "View", action: () => router.push(`/dashboard/purchase/invoices/${inv.id}`) },
                                { icon: CreditCard, label: "Record Payment", action: () => {} },
                                { icon: Edit, label: "Edit", action: () => router.push(`/dashboard/purchase/invoices/${inv.id}/edit`) },
                                { icon: Printer, label: "Print", action: () => router.push(`/dashboard/purchase/invoices/${inv.id}?print=1`) },
                              ].map(({ icon: Icon, label, action }) => (
                                <button key={label} onClick={() => { action(); setMenu(null); }}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                  <Icon className="h-3.5 w-3.5" /> {label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
