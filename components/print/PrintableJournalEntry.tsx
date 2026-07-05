"use client";

import React from "react";
import { FormattedDate } from "@/components/shared/FormattedDate";
import { PrintCompanyHeader } from "@/components/print/PrintCompanyHeader";
import type { CompanyPrintInfo } from "@/lib/print/company-info";
import type { JournalEntry } from "@/lib/api/accounting";
import { formatCurrency } from "@/lib/utils";

interface PrintableJournalEntryProps {
  entry: JournalEntry;
  companyInfo: CompanyPrintInfo;
}

export const PrintableJournalEntry = React.forwardRef<HTMLDivElement, PrintableJournalEntryProps>(
  ({ entry, companyInfo }, ref) => {
    const statusDisplay = entry.status.charAt(0).toUpperCase() + entry.status.slice(1);

    return (
      <div ref={ref} className="p-8 bg-white text-gray-900" style={{ width: "210mm", minHeight: "297mm" }}>
        <PrintCompanyHeader
          company={companyInfo}
          documentTitle="JOURNAL ENTRY"
          documentNumber={entry.entry_number}
          documentDate={<FormattedDate value={entry.date} />}
        />

        <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p><span className="text-gray-500">Type:</span> {entry.type}</p>
            <p><span className="text-gray-500">Status:</span> {statusDisplay}</p>
            <p><span className="text-gray-500">Reference:</span> {entry.reference || "—"}</p>
          </div>
          <div>
            <p><span className="text-gray-500">Posted By:</span> {entry.posted_by_name || "—"}</p>
            <p>
              <span className="text-gray-500">Posted Date:</span>{" "}
              {entry.posted_date ? <FormattedDate value={entry.posted_date} /> : "—"}
            </p>
          </div>
        </div>

        <p className="text-sm text-gray-700 mb-4">{entry.description}</p>

        <table className="w-full mb-8">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-left py-2 px-2 text-sm font-semibold">Account</th>
              <th className="text-left py-2 px-2 text-sm font-semibold">Description</th>
              <th className="text-right py-2 px-2 text-sm font-semibold">Debit</th>
              <th className="text-right py-2 px-2 text-sm font-semibold">Credit</th>
            </tr>
          </thead>
          <tbody>
            {(entry.lines || []).map((line, index) => (
              <tr key={line.id || index} className="border-b border-gray-200">
                <td className="py-2 px-2 text-sm">
                  {line.account_code && <span className="font-mono text-xs mr-1">{line.account_code}</span>}
                  {line.account_name || line.account}
                </td>
                <td className="py-2 px-2 text-sm text-gray-600">{line.description}</td>
                <td className="py-2 px-2 text-sm text-right">
                  {Number(line.debit) > 0 ? formatCurrency(line.debit) : "—"}
                </td>
                <td className="py-2 px-2 text-sm text-right">
                  {Number(line.credit) > 0 ? formatCurrency(line.credit) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-300 font-semibold">
              <td colSpan={2} className="py-3 px-2 text-sm text-right">Totals</td>
              <td className="py-3 px-2 text-sm text-right">{formatCurrency(entry.total_debit)}</td>
              <td className="py-3 px-2 text-sm text-right">{formatCurrency(entry.total_credit)}</td>
            </tr>
          </tfoot>
        </table>

        <div className="mt-8 text-xs text-gray-400 text-center">
          <p>Printed on: {new Date().toLocaleString("en-GB")}</p>
        </div>
      </div>
    );
  },
);

PrintableJournalEntry.displayName = "PrintableJournalEntry";
