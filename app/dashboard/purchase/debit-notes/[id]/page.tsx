"use client";

import { PageLoading } from "@/components/shared/PageLoading";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Printer, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashHeader } from "@/components/dashboard/dash-header";
import { StatusBadge } from "@/components/purchase/StatusBadge";
import { FormattedDate } from "@/components/shared/FormattedDate";
import { AmountInWords } from "@/components/sales/AmountInWords";
import { PrintableDebitNote } from "@/components/print/PrintableDebitNote";
import { debitNotesAPI, type DebitNote } from "@/lib/api/purchase";
import { useCompanyInfo } from "@/lib/hooks/useCompanyInfo";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";

export default function DebitNoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const printRef = useRef<HTMLDivElement>(null);
  const { companyInfo } = useCompanyInfo();
  const [dn, setDn] = useState<DebitNote | null>(null);
  const [loading, setLoading] = useState(true);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${dn?.debit_note_number || dn?.note_number || "DebitNote"}_${new Date().toISOString().split("T")[0]}` });

  useEffect(() => {
    const fetchDebitNote = async () => {
      if (!id) return;
      try {
        const data = await debitNotesAPI.get(id);
        setDn(data);
      } catch (error: any) {
        console.error("Error fetching debit note:", error);
        toast.error("Failed to load debit note details");
      } finally {
        setLoading(false);
      }
    };
    fetchDebitNote();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Loading..." subtitle="Debit Note" />
        <PageLoading message="Loading…" />
      </div>
    );
  }

  if (!dn) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Debit Note Not Found" subtitle="Debit Note" />
        <div className="flex-1 p-6 flex flex-col items-center justify-center">
          <p className="text-gray-500 mb-4">The debit note you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/dashboard/purchase/debit-notes">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Debit Notes
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const noteNumber = dn.debit_note_number || dn.note_number || dn.id;
  const invoiceRef = dn.invoice_number || dn.purchase_invoice_number || dn.invoice || dn.purchase_invoice;

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader
        title={noteNumber}
        subtitle={`Debit Note · ${dn.date}`}
      />
      <div className="flex-1 p-6 space-y-4 w-full">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={dn.status} />
          <div className="flex-1" />
          <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => handlePrint()} disabled={!companyInfo}>
            <Printer className="h-3.5 w-3.5" /> Print
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Debit Note Info</h3>
            {[
              ["Debit Note #", noteNumber],
              ["Date", <FormattedDate key="date" value={dn.date} />],
              ["Against Invoice", invoiceRef ? (
                <Link
                  key="inv"
                  href={`/dashboard/purchase/invoices/${dn.invoice || dn.purchase_invoice}`}
                  className="font-medium text-blue-600 hover:underline"
                >
                  {invoiceRef}
                </Link>
              ) : "—"],
              ["Reason", dn.reason],
              ["Status", <StatusBadge key="status" status={dn.status} />],
              ...(dn.created_by_name ? [["Created By", dn.created_by_name]] : []),
            ].map(([k, v]) => (
              <div key={String(k)} className="flex justify-between text-sm">
                <span className="text-gray-500">{k}</span>
                <span className="font-medium text-gray-800">{v}</span>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Supplier</h3>
            <p className="font-semibold text-gray-800">{dn.supplier_name || dn.supplier}</p>
            <div className="flex justify-between text-sm pt-2">
              <span className="text-gray-500">Amount</span>
              <span className="font-bold text-[#22C55E]">{formatCurrency(dn.amount)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex justify-end">
            <div className="bg-gray-50 rounded-lg border border-gray-200 px-4 py-3">
              <span className="text-sm text-gray-600">Debit Amount: </span>
              <span className="font-bold text-[#22C55E]">{formatCurrency(dn.amount)}</span>
            </div>
          </div>
          <div className="mt-3"><AmountInWords amount={dn.amount} /></div>
        </div>

        {(dn.description || dn.reason) && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm font-medium text-amber-800">Reason: {dn.reason}</p>
            {dn.description && (
              <p className="text-xs text-amber-600 mt-1">{dn.description}</p>
            )}
            {invoiceRef && (
              <p className="text-xs text-amber-600 mt-1">
                This debit note is issued against {invoiceRef} for {formatCurrency(dn.amount)}
              </p>
            )}
          </div>
        )}

        <Link href="/dashboard/purchase/debit-notes">
          <Button variant="ghost" className="gap-1.5 text-gray-500">
            <ArrowLeft className="h-4 w-4" /> Back to Debit Notes
          </Button>
        </Link>
      </div>

      {companyInfo && dn && (
        <div className="hidden">
          <PrintableDebitNote ref={printRef} debitNote={dn} companyInfo={companyInfo} />
        </div>
      )}
    </div>
  );
}
