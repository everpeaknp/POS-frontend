"use client";

import { FormattedDate } from "@/components/shared/FormattedDate";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, MoreHorizontal, Eye, Edit, PackageCheck, X } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashHeader } from "@/components/dashboard/dash-header";
import { StatusBadge } from "@/components/purchase/StatusBadge";
import { purchaseOrdersAPI, PurchaseOrder } from "@/lib/api/purchase";

const STATUSES = ["All", "Draft", "Sent", "Received", "Partially Received", "Cancelled"];

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [menu, setMenu] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const PER_PAGE = 10;

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await purchaseOrdersAPI.list();
      // Handle both paginated and non-paginated responses
      const data = Array.isArray(response) ? response : (response as any).results || [];
      setOrders(data);
    } catch (error: any) {
      console.error("Failed to fetch purchase orders:", error);
      toast.error("Failed to load purchase orders");
      setOrders([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (id: string) => {
    try {
      await purchaseOrdersAPI.updateStatus(id, "Cancelled");
      toast.success("Purchase order cancelled");
      fetchOrders();
    } catch (error) {
      toast.error("Failed to cancel purchase order");
    }
  };

  const filtered = orders.filter((o) => {
    const matchSearch = o.po_number.toLowerCase().includes(search.toLowerCase()) || 
                       (o.supplier_name && o.supplier_name.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = status === "All" || o.status === status;
    return matchSearch && matchStatus;
  });

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Purchase Orders" subtitle="Manage all purchase orders" />
      <div className="flex-1 p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm border-gray-200" placeholder="Search PO or supplier..." />
          </div>
          <Select value={status} onValueChange={(v) => setStatus(v || "All")}>
            <SelectTrigger className="h-9 w-44 text-sm border-gray-200"><SelectValue /></SelectTrigger>
            <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <div className="flex-1" />
          <Button variant="outline" size="sm" className="h-9 text-gray-600 border-gray-200">Export CSV</Button>
          <Button size="sm" className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5" onClick={() => router.push("/dashboard/purchase/orders/new")}>
            <Plus className="h-4 w-4" /> New Purchase Order
          </Button>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#22C55E]"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>{["PO #", "Date", "Supplier", "Expected Date", "Items", "Total Amount", "Status", "Actions"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginated.map((o) => (
                      <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-[#22C55E] cursor-pointer hover:underline" onClick={() => router.push(`/dashboard/purchase/orders/${o.id}`)}>{o.po_number}</td>
                        <td className="px-4 py-3 text-gray-600"><FormattedDate value={o.date} /></td>
                        <td className="px-4 py-3 font-medium text-gray-800">{o.supplier_name || 'N/A'}</td>
                        <td className="px-4 py-3 text-gray-600">{o.expected_delivery_date ? new Date(o.expected_delivery_date).toLocaleDateString() : 'N/A'}</td>
                        <td className="px-4 py-3 text-gray-600">{o.items_count || 0}</td>
                        <td className="px-4 py-3 font-semibold text-gray-800">Rs. {Number(o.total).toLocaleString()}</td>
                        <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                        <td className="px-4 py-3">
                          <div className="relative">
                            <button onClick={() => setMenu(menu === o.id ? null : o.id)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                            {menu === o.id && (
                              <div className="absolute right-0 top-8 z-10 bg-white border border-gray-100 rounded-lg shadow-lg py-1 min-w-[160px]">
                                {[
                                  { icon: Eye, label: "View", action: () => router.push(`/dashboard/purchase/orders/${o.id}`) },
                                  { icon: Edit, label: "Edit", action: () => router.push(`/dashboard/purchase/orders/${o.id}/edit`) },
                                  { icon: PackageCheck, label: "Receive Items", action: () => router.push(`/dashboard/purchase/orders/${o.id}?receive=1`) },
                                  { icon: X, label: "Cancel", action: () => handleCancelOrder(o.id), disabled: o.status === 'Cancelled' },
                                ].map(({ icon: Icon, label, action, disabled }) => (
                                  <button key={label} onClick={() => { if (!disabled) { action(); setMenu(null); } }}
                                    disabled={disabled}
                                    className={`flex items-center gap-2 w-full px-3 py-2 text-sm ${disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}`}>
                                    <Icon className="h-3.5 w-3.5" /> {label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {paginated.length === 0 && (
                      <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-400">No purchase orders found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-50">
                  <p className="text-xs text-gray-500">Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}</p>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" className="h-7 px-2 text-xs" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                    <Button variant="outline" size="sm" className="h-7 px-2 text-xs" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
