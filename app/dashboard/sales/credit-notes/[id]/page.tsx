"use client";

import { PageLoading } from "@/components/shared/PageLoading";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, FileText, Calendar, User, Loader2, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashHeader } from "@/components/dashboard/dash-header";
import { creditNoteAPI, CreditNote } from "@/lib/api/sales";
import toast from "react-hot-toast";
import { format } from "date-fns";

const statusColors = {
  Draft: "bg-gray-100 text-gray-700",
  Issued: "bg-blue-100 text-blue-700",
  Applied: "bg-green-100 text-green-700",
};

export default function CreditNoteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const creditNoteId = params.id as string;
  
  const [creditNote, setCreditNote] = useState<CreditNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (creditNoteId) {
      loadCreditNote();
    }
  }, [creditNoteId]);

  const loadCreditNote = async () => {
    try {
      const response = await creditNoteAPI.get(creditNoteId);
      setCreditNote(response.data);
    } catch (error) {
      console.error("Error loading credit note:", error);
      toast.error("Failed to load credit note");
      router.push("/dashboard/sales/credit-notes");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (creditNote?.status === "Issued" || creditNote?.status === "Applied") {
      toast.error("Cannot delete an issued credit note");
      return;
    }
    if (!confirm("Are you sure you want to delete this credit note?")) {
      return;
    }

    setDeleting(true);
    try {
      await creditNoteAPI.delete(creditNoteId);
      toast.success("Credit note deleted successfully");
      router.push("/dashboard/sales/credit-notes");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to delete credit note");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Credit Note Details" subtitle="Loading..." />
        <PageLoading message="Loading…" />
      </div>
    );
  }

  if (!creditNote) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Credit Note Not Found" subtitle="The credit note could not be found" />
        <div className="flex-1 flex items-center justify-center">
          <Button onClick={() => router.push("/dashboard/sales/credit-notes")}>
            Back to Credit Notes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader 
        title={`Credit Note ${creditNote.credit_note_number}`} 
        subtitle={`Customer: ${creditNote.customer_name}`}
      />
      
      <div className="flex-1 p-6 space-y-6">
        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/sales/credit-notes")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Credit Notes
          </Button>
          <div className="flex-1" />
          {creditNote.status === "Draft" && (
          <Button
            variant="outline"
            onClick={handleDelete}
            disabled={deleting}
            className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
          >
            {deleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete
              </>
            )}
          </Button>
          )}
        </div>

        {/* Credit Note Details */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">{creditNote.credit_note_number}</h2>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                      statusColors[creditNote.status as keyof typeof statusColors]
                    }`}
                  >
                    {creditNote.status}
                  </span>
                </div>
              </div>
              <FileText className="h-12 w-12 opacity-80" />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Customer & Invoice */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-gray-500 mb-1">Customer</div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="font-medium text-gray-900">{creditNote.customer_name}</span>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Related Invoice</div>
                <Button
                  variant="link"
                  onClick={() => router.push(`/dashboard/sales/invoices/${creditNote.invoice}`)}
                  className="p-0 h-auto text-[#22C55E] hover:text-[#16A34A] font-medium"
                >
                  {creditNote.invoice_number}
                </Button>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Date</div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">
                    {format(new Date(creditNote.date), "MMM dd, yyyy")}
                  </span>
                </div>
              </div>
            </div>

            {/* Amount */}
            <div className="border-t border-gray-100 pt-6">
              <div className="bg-red-50 border border-red-100 rounded-lg p-6">
                <div className="text-sm text-red-700 mb-2">Credit Amount</div>
                <div className="text-3xl font-bold text-red-600">
                  Rs. {Number(creditNote.amount).toLocaleString()}
                </div>
                <div className="text-xs text-red-600 mt-2 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  This amount will be credited to the customer's account
                </div>
              </div>
            </div>

            {/* Reason */}
            <div className="border-t border-gray-100 pt-4">
              <div className="text-sm text-gray-500 mb-2">Reason</div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">{creditNote.reason}</p>
              </div>
            </div>

            {/* Metadata */}
            <div className="border-t border-gray-100 pt-4 text-xs text-gray-500 space-y-1">
              <div>Created by: {creditNote.created_by_name || "System"}</div>
              <div>Created: {format(new Date(creditNote.created_at), "MMM dd, yyyy 'at' hh:mm a")}</div>
              <div>Last updated: {format(new Date(creditNote.updated_at), "MMM dd, yyyy 'at' hh:mm a")}</div>
            </div>
          </div>
        </div>

        {/* Information Box */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <div className="font-medium mb-1">About Credit Notes</div>
              <p className="text-blue-700">
                Credit notes are issued to customers for returns, pricing errors, or other adjustments. 
                They reduce the amount owed by the customer and can be applied against future invoices.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
