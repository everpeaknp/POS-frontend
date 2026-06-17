"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, MoreHorizontal, Eye, CheckCircle, Printer, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashHeader } from "@/components/dashboard/dash-header";
import { StatusBadge } from "@/components/purchase/StatusBadge";
import { debitNotesAPI, type DebitNote } from "@/lib/api/purchase";
import toast from "react-hot-toast";

export default function DebitNotesPage() {
  const router = useRouter();
  const [debitNotes, setDebitNotes] = useState<DebitNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [menu, setMenu] = useState<string | null>(null);

  useEffect(() => {
    loadDebitNotes();
  }, []);

  const loadDebitNotes = async () => {
    try {
      setLoading(true);
      const data = await debitNotesAPI.list();
      setDebitNotes(Array.isArray(data) ? data : (data as any).results || []);
    } catch (error) {
      toast.error("Failed to load debit notes");
    } finally {
      setLoading(false);
    }
  };

  const filtered = debitNotes.filter((dn) =>
    dn.debit_note_number.toLowerCase().includes(search.toLowerCase()) ||
    (dn.supplier_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (dn.invoice_number || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Debit Notes" subtitle="Manage issued debit notes" />
      <div className="flex-1 p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm border-gray-200" placeholder="Search debit notes..." />
          </div>
          <div className="flex-1" />
          <Button size="sm" className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5" onClick={() => router.push("/dashboard/purchase/debit-notes/new")}>
            <Plus className="h-4 w-4" /> New Debit Note
          </Button>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{["Debit Note #", "Date", "Supplier", "Against Invoice", "Amount", "Reason", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={8} className="px-4 py-10 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-gray-400" /></td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-400">No debit notes found</td></tr>
                ) : (
                  filtered.map((dn) => (
                    <tr key={dn.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-[#22C55E] cursor-pointer hover:underline" onClick={() => router.push(`/dashboard/purchase/debit-notes/${dn.id}`)}>{dn.debit_note_number}</td>
                      <td className="px-4 py-3 text-gray-600">{new Date(dn.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{dn.supplier_name}</td>
                      <td className="px-4 py-3 text-blue-600 font-medium">{dn.invoice_number}</td>
                      <td className="px-4 py-3 font-semibold text-gray-800">Rs. {dn.amount?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-600">{dn.reason}</td>
                      <td className="px-4 py-3"><StatusBadge status={dn.status} /></td>
                      <td className="px-4 py-3">
                        <div className="relative">
                          <button onClick={() => setMenu(menu === dn.id ? null : dn.id)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                          {menu === dn.id && (
                            <div className="absolute right-0 top-8 z-10 bg-white border border-gray-100 rounded-lg shadow-lg py-1 min-w-[160px]">
                              {[
                                { icon: Eye, label: "View", action: () => router.push(`/dashboard/purchase/debit-notes/${dn.id}`) },
                                { icon: CheckCircle, label: "Apply to Invoice", action: () => {} },
                                { icon: Printer, label: "Print", action: () => {} },
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
