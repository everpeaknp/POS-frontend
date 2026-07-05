"use client";

import React from "react";
import { FormattedDate } from "@/components/shared/FormattedDate";
import { PrintCompanyHeader } from "@/components/print/PrintCompanyHeader";
import type { CompanyPrintInfo } from "@/lib/print/company-info";
import type { DebitNote } from "@/lib/api/purchase";
import { formatCurrency } from "@/lib/utils";

interface PrintableDebitNoteProps {
  debitNote: DebitNote;
  companyInfo: CompanyPrintInfo;
}

export const PrintableDebitNote = React.forwardRef<HTMLDivElement, PrintableDebitNoteProps>(
  ({ debitNote, companyInfo }, ref) => {
    const noteNumber = debitNote.debit_note_number || debitNote.note_number || debitNote.id;
    const invoiceRef = debitNote.invoice_number || debitNote.purchase_invoice_number;

    return (
      <div ref={ref} className="p-8 bg-white text-gray-900" style={{ width: "210mm", minHeight: "297mm" }}>
        <PrintCompanyHeader
          company={companyInfo}
          documentTitle="DEBIT NOTE"
          documentNumber={noteNumber}
          documentDate={<FormattedDate value={debitNote.date} />}
        />

        <div className="mb-8 grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase mb-2">Supplier:</h3>
            <p className="font-semibold text-gray-900">{debitNote.supplier_name || debitNote.supplier}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase mb-2">Reference:</h3>
            <p className="text-sm text-gray-700">Reason: {debitNote.reason}</p>
            {invoiceRef && <p className="text-sm text-gray-700 mt-1">Against Invoice: {invoiceRef}</p>}
            <p className="text-sm text-gray-700 mt-1">Status: {debitNote.status}</p>
          </div>
        </div>

        <div className="mb-8 flex justify-end">
          <div className="w-64 border-t-2 border-gray-300 pt-4">
            <div className="flex justify-between text-base">
              <span className="font-bold text-gray-900">Debit Amount:</span>
              <span className="font-bold text-gray-900">{formatCurrency(debitNote.amount)}</span>
            </div>
          </div>
        </div>

        {(debitNote.description || debitNote.reason) && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-700 uppercase mb-2">Description:</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {debitNote.description || debitNote.reason}
            </p>
          </div>
        )}

        <div className="mt-12 pt-6 border-t border-gray-300 text-center text-xs text-gray-400">
          <p>Printed on: {new Date().toLocaleString("en-GB")}</p>
        </div>
      </div>
    );
  },
);

PrintableDebitNote.displayName = "PrintableDebitNote";
