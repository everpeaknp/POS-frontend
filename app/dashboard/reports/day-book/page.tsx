"use client";

import { useState, useEffect, useCallback } from "react";
import { ReportFilter } from "@/components/reports/ReportFilter";
import { ExportButtons } from "@/components/reports/ExportButtons";
import { SummaryCards } from "@/components/reports/SummaryCards";
import {
  ReportsPageShell,
  reportsTableWrapClass,
} from "@/components/reports/ReportsPageShell";
import { reportsAPI } from "@/lib/api/reports";
import { formatNPR } from "@/lib/utils";
import toast from "react-hot-toast";
import { format } from "date-fns";
import type { ExportTableData } from "@/lib/utils/export";

export default function DayBookReportPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dayBookData, setDayBookData] = useState<Awaited<
    ReturnType<typeof reportsAPI.dayBook>
  > | null>(null);
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );

  const loadReportData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reportsAPI.dayBook({ date: selectedDate });
      setDayBookData(data);
    } catch (err) {
      console.error("Error loading day book:", err);
      setError("Failed to load day book. Please try again.");
      toast.error("Failed to load day book");
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  const stats = [
    {
      label: "Total Transactions",
      value: String(dayBookData?.summary.total_transactions ?? 0),
    },
    {
      label: "Total Receipts",
      value: formatNPR(dayBookData?.summary.total_credit ?? 0),
    },
    {
      label: "Total Payments",
      value: formatNPR(dayBookData?.summary.total_debit ?? 0),
    },
    {
      label: "Net Cash Flow",
      value: formatNPR(dayBookData?.summary.net_cash_flow ?? 0),
    },
  ];

  const getExportData = useCallback((): ExportTableData | null => {
    if (!dayBookData?.transactions?.length) return null;
    return {
      filename: `day-book-${selectedDate}`,
      title: "Day Book",
      subtitle: `Date: ${selectedDate}`,
      headers: ["Time", "Type", "Reference", "Party", "Debit", "Credit", "Description"],
      rows: dayBookData.transactions.map((txn) => [
        txn.time,
        txn.type,
        txn.reference,
        txn.party,
        formatNPR(txn.debit),
        formatNPR(txn.credit),
        txn.description,
      ]),
    };
  }, [dayBookData, selectedDate]);

  return (
    <ReportsPageShell
      title="Day Book"
      subtitle="Daily transaction summary"
      loading={loading && !dayBookData}
      error={error}
      onRetry={loadReportData}
      toolbar={
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
          />
          <button
            onClick={loadReportData}
            disabled={loading}
            className="px-4 py-2 bg-slate-600 text-white text-sm rounded-lg hover:bg-slate-700 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Load"}
          </button>
        </div>
      }
      action={<ExportButtons getExportData={getExportData} disabled={loading} />}
    >
      <SummaryCards cards={stats} />

      <div className={reportsTableWrapClass}>
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">
            Transactions for {selectedDate}
          </h3>
        </div>
        {dayBookData && dayBookData.transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Time", "Type", "Reference", "Party", "Debit", "Credit", "Description"].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dayBookData.transactions.map((txn, index) => (
                  <tr key={index} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3 text-gray-600">{txn.time}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        txn.type === 'Sales' || txn.type === 'Receipt' || txn.type === 'Income'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {txn.type}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-mono text-xs text-gray-600">
                      {txn.reference}
                    </td>
                    <td className="px-6 py-3 font-medium text-gray-900">{txn.party}</td>
                    <td className="px-6 py-3 text-red-600 font-medium">
                      {txn.debit > 0 ? formatNPR(txn.debit) : '-'}
                    </td>
                    <td className="px-6 py-3 text-slate-600 font-medium">
                      {txn.credit > 0 ? formatNPR(txn.credit) : '-'}
                    </td>
                    <td className="px-6 py-3 text-gray-600 text-xs">{txn.description}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                <tr className="font-semibold">
                  <td colSpan={4} className="px-6 py-3 text-right text-gray-900">
                    Total:
                  </td>
                  <td className="px-6 py-3 text-red-600">
                    {formatNPR(dayBookData.summary.total_debit)}
                  </td>
                  <td className="px-6 py-3 text-slate-600">
                    {formatNPR(dayBookData.summary.total_credit)}
                  </td>
                  <td className="px-6 py-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500">
            No transactions for this date
          </div>
        )}
      </div>
    </ReportsPageShell>
  );
}
