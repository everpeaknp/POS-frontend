"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, MoreHorizontal, Eye, Edit, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashHeader } from "@/components/dashboard/dash-header";
import { StatusBadge } from "@/components/purchase/StatusBadge";
import { suppliersAPI, type Supplier } from "@/lib/api/purchase";
import toast from "react-hot-toast";

export default function SuppliersPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [menu, setMenu] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await suppliersAPI.list();
      // Handle both array and paginated responses
      const data = Array.isArray(response) ? response : ((response as any)?.results || []);
      setSuppliers(data);
    } catch (error: any) {
      console.error("Failed to fetch suppliers:", error);
      toast.error("Failed to load suppliers");
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this supplier?")) return;
    try {
      await suppliersAPI.delete(id);
      toast.success("Supplier deleted successfully");
      fetchSuppliers();
    } catch (error) {
      toast.error("Failed to delete supplier");
    }
  };

  const filtered = suppliers.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                       (s.phone && s.phone.includes(search)) || 
                       (s.email && s.email.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = status === "All" || s.status === status;
    return matchSearch && matchStatus;
  });

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Suppliers" subtitle="Manage your supplier directory" />
      <div className="flex-1 p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm border-gray-200" placeholder="Search suppliers..." />
          </div>
          <Select value={status} onValueChange={(v) => setStatus(v || "All")}>
            <SelectTrigger className="h-9 w-36 text-sm border-gray-200"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex-1" />
          <Button size="sm" className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5" onClick={() => router.push("/dashboard/purchase/suppliers/new")}>
            <Plus className="h-4 w-4" /> Add Supplier
          </Button>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#22C55E]"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>{["Supplier", "Phone", "Email", "PAN/VAT", "Orders", "Total Purchased", "Outstanding", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#22C55E]/10 flex items-center justify-center text-sm font-bold text-[#22C55E] shrink-0">
                            {s.name[0]}
                          </div>
                          <span className="font-medium text-[#22C55E] cursor-pointer hover:underline" onClick={() => router.push(`/dashboard/purchase/suppliers/${s.id}`)}>
                            {s.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{s.phone || 'N/A'}</td>
                      <td className="px-4 py-3 text-gray-600">{s.email || 'N/A'}</td>
                      <td className="px-4 py-3 text-gray-600">{s.pan || 'N/A'}</td>
                      <td className="px-4 py-3 text-gray-600">{0}</td>
                      <td className="px-4 py-3 font-semibold text-gray-800">Rs. {Number(s.total_purchases || 0).toLocaleString()}</td>
                      <td className={`px-4 py-3 font-medium ${Number(s.outstanding_balance || 0) > 0 ? "text-red-500" : "text-gray-500"}`}>
                        {Number(s.outstanding_balance || 0) > 0 ? `Rs. ${Number(s.outstanding_balance).toLocaleString()}` : "—"}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                      <td className="px-4 py-3">
                        <div className="relative">
                          <button onClick={() => setMenu(menu === s.id ? null : s.id)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                          {menu === s.id && (
                            <div className="absolute right-0 top-8 z-10 bg-white border border-gray-100 rounded-lg shadow-lg py-1 min-w-[140px]">
                              {[
                                { icon: Eye, label: "View", action: () => router.push(`/dashboard/purchase/suppliers/${s.id}`) },
                                { icon: Edit, label: "Edit", action: () => router.push(`/dashboard/purchase/suppliers/${s.id}/edit`) },
                                { icon: Trash2, label: "Delete", action: () => handleDelete(s.id), isDelete: true },
                              ].map(({ icon: Icon, label, action, isDelete }) => (
                                <button key={label} onClick={() => { action(); setMenu(null); }}
                                  className={`flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-50 ${isDelete ? "text-red-500" : "text-gray-700"}`}>
                                  <Icon className="h-3.5 w-3.5" /> {label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-400">No suppliers found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
