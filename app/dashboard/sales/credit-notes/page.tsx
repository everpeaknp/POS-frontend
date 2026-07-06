"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashHeader } from "@/components/dashboard/dash-header";
import { EmptyState } from "@/components/shared/EmptyState";
import { creditNoteAPI, CreditNote } from "@/lib/api/sales";
import toast from "react-hot-toast";
import { format } from "date-fns";

const statusColors = {
  Draft: "bg-gray-100 text-gray-700",
  Issued: "bg-blue-100 text-blue-700",
  Applied: "bg-green-100 text-green-700",
};

export default function CreditNotesPage() {
  const router = useRouter();
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadCreditNotes();
  }, []);

  const loadCreditNotes = async () => {
    try {
      const response = await creditNoteAPI.list();
      setCreditNotes(response.data.results || []);
    } catch (error) {
      console.error("Error loading credit notes:", error);
      toast.error("Failed to load credit notes");
    } finally {
      setLoading(false);
    }
  };

  const filteredCreditNotes = creditNotes.filter((cn) =>
    cn.credit_note_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cn.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cn.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Credit Notes" subtitle="Manage credit notes" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading credit notes...</div>
        </div>
      </div>
    );
  }

  if (creditNotes.length === 0 && !searchTerm) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Credit Notes" subtitle="Manage credit notes for returns and adjustments" />
        <div className="flex-1 p-6">
          <EmptyState
            icon={FileText}
            title="No credit notes yet"
            description="Create your first credit note for returns or adjustments"
            actionLabel="New Credit Note"
            actionHref="/dashboard/sales/credit-notes/new"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Credit Notes" subtitle="Manage credit notes for returns and adjustments" />
      
      <div className="flex-1 p-6 space-y-6">
        {/* Actions Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by credit note, customer, or invoice..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 border-gray-200"
            />
          </div>
          <Button
            onClick={() => router.push("/dashboard/sales/credit-notes/new")}
            className="bg-[#22C55E] hover:bg-[#16A34A] text-white gap-2"
          >
            <Plus className="h-4 w-4" />
            New Credit Note
          </Button>
        </div>

        {/* Credit Notes List */}
        {filteredCreditNotes.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <p className="text-gray-500">No credit notes found matching your filters</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Credit Note #
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Customer
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Invoice
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCreditNotes.map((creditNote) => (
                  <tr
                    key={creditNote.id}
                    onClick={() => router.push(`/dashboard/sales/credit-notes/${creditNote.id}`)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {creditNote.credit_note_number}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {creditNote.customer_name}
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {creditNote.invoice_number}
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {format(new Date(creditNote.date), "MMM dd, yyyy")}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-red-600">
                      Rs. {Number(creditNote.amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                            statusColors[creditNote.status as keyof typeof statusColors]
                          }`}
                        >
                          {creditNote.status}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary Cards */}
        {creditNotes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border border-gray-100 p-4">
              <div className="text-sm text-gray-500 mb-1">Total Credit Notes</div>
              <div className="text-2xl font-semibold text-gray-900">
                {creditNotes.length}
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-100 p-4">
              <div className="text-sm text-gray-500 mb-1">Total Amount</div>
              <div className="text-2xl font-semibold text-red-600">
                Rs. {creditNotes.reduce((sum, cn) => sum + Number(cn.amount), 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-100 p-4">
              <div className="text-sm text-gray-500 mb-1">Applied</div>
              <div className="text-2xl font-semibold text-green-600">
                {creditNotes.filter(cn => cn.status === 'Applied').length}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
