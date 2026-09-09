"use client";

import { useState, useEffect, useCallback } from "react";
import { ReportsPageShell, reportsCardClass, reportsTableWrapClass } from "@/components/reports/ReportsPageShell";
import { SummaryCards } from "@/components/reports/SummaryCards";
import { ExportButtons } from "@/components/reports/ExportButtons";
import { ReportFilter } from "@/components/reports/ReportFilter";
import { formatNPR } from "@/lib/utils";
import { reportsAPI, type AllTransactionsData } from "@/lib/api/reports";
import toast from "react-hot-toast";
import type { ExportTableData } from "@/lib/utils/export";
import { PrintableReport } from "@/components/reports/PrintableReport";

export default function AllTransactionsPage() {
  const [data, setData] = useState<AllTransactionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [filters, setFilters] = useState({
    type: "all",
    search: "",
  });

  // Initialize dates to last 30 days
  useEffect(() => {
    const end = new Date();
    const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
  }, []);

  const fetchData = useCallback(async (start?: string, end?: string) => {
    if (!start || !end) return;
    setLoading(true);
    setError(null);
    try {
      const result = await reportsAPI.allTransactions({
        start_date: start,
        end_date: end,
      });
      setData(result);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { detail?: string } } };
      console.error("Failed to fetch all transactions:", err);
      setError(apiErr.response?.data?.detail || "Failed to load transactions");
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      void fetchData(startDate, endDate);
    }
  }, [startDate, endDate, fetchData]);

  const filteredTransactions = data?.transactions.filter((txn) => {
    const matchesType = filters.type === "all" || txn.type === filters.type;
    const matchesSearch = txn.reference.toLowerCase().includes(filters.search.toLowerCase()) ||
      txn.party.toLowerCase().includes(filters.search.toLowerCase());
    return matchesType && matchesSearch;
  }) || [];

  const stats = data
    ? [
        {
          label: "Total Transactions",
          value: String(data.summary.total_transactions),
        },
        {
          label: "Total Inflow",
          value: formatNPR(data.summary.total_credit),
        },
        {
          label: "Total Outflow",
          value: formatNPR(data.summary.total_debit),
        },
        {
          label: "Net Cash Flow",
          value: formatNPR(data.summary.net_flow),
        },
      ]
    : [
        { label: "Total Transactions", value: "0" },
        { label: "Total Inflow", value: "Rs. 0" },
        { label: "Total Outflow", value: "Rs. 0" },
        { label: "Net Cash Flow", value: "Rs. 0" },
      ];

  const getExportData = useCallback((): ExportTableData | null => {
    if (!filteredTransactions.length) return null;
    return {
      filename: `all-transactions-${startDate}-to-${endDate}`,
      title: "All Transactions Report",
      subtitle: `${startDate} to ${endDate}`,
      headers: ["Date", "Type", "Reference", "Party", "Debit", "Credit", "Description"],
      rows: filteredTransactions.map((txn) => [
        txn.date,
        txn.type,
        txn.reference,
        txn.party,
        formatNPR(txn.debit),
        formatNPR(txn.credit),
        txn.description,
      ]),
    };
  }, [filteredTransactions, startDate, endDate]);

  return (
    <ReportsPageShell
      title="All Transactions"
      subtitle="Complete transaction history"
      loading={loading && !data}
      error={error}
      onRetry={() => void fetchData(startDate, endDate)}
      toolbar={
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
          <span className="text-gray-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          >
            <option value="all">All Types</option>
            <option value="Sales">Sales</option>
            <option value="Purchase">Purchase</option>
            <option value="Receipt">Receipt</option>
            <option value="Income">Income</option>
            <option value="Expense">Expense</option>
          </select>
          <input
            type="text"
            placeholder="Search..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
        </div>
      }
      action={<ExportButtons getExportData={getExportData} disabled={loading} />}
    >
      {!data ? (
        <div className={`${reportsCardClass} p-12 text-center text-gray-500`}>
          Loading transactions...
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className={`${reportsCardClass} p-12 text-center text-gray-500`}>
          No transactions found for the selected period
        </div>
      ) : (
        <>
          <SummaryCards cards={stats} />

          <div className={reportsTableWrapClass}>
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">
                Transactions ({filteredTransactions.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["Date", "Type", "Reference", "Party", "Debit", "Credit", "Description"].map((h) => (
                      <th
                        key={h}
                        className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTransactions.map((txn, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="px-6 py-3 text-gray-600">
                        {new Date(txn.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            txn.type === "Sales"
                              ? "bg-slate-50 text-slate-700"
                              : txn.type === "Purchase"
                                ? "bg-orange-50 text-orange-700"
                                : txn.type === "Receipt"
                                  ? "bg-green-50 text-green-700"
                                  : txn.type === "Income"
                                    ? "bg-blue-50 text-blue-700"
                                    : "bg-red-50 text-red-700"
                          }`}
                        >
                          {txn.type}
                        </span>
                      </td>
                      <td className="px-6 py-3 font-medium text-blue-600">{txn.reference}</td>
                      <td className="px-6 py-3 font-medium text-gray-900">{txn.party}</td>
                      <td className="px-6 py-3 text-red-600">
                        {txn.debit > 0 ? formatNPR(txn.debit) : "-"}
                      </td>
                      <td className="px-6 py-3 text-green-600">
                        {txn.credit > 0 ? formatNPR(txn.credit) : "-"}
                      </td>
                      <td className="px-6 py-3 text-gray-600 max-w-xs truncate">{txn.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <PrintableReport reportTitle="Transactions Report">
            <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "12px", color: "#000" }}>
              Summary
            </h3>
            <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #d1d5db", marginBottom: "20px" }}>
              <tbody>
                <tr style={{ borderBottom: "1px solid #d1d5db" }}>
                  <td style={{ padding: "8px", fontWeight: "600", color: "#000" }}>Total Transactions</td>
                  <td style={{ padding: "8px", textAlign: "right", color: "#000" }}>{data?.summary.total_transactions}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #d1d5db" }}>
                  <td style={{ padding: "8px", fontWeight: "600", color: "#000" }}>Total Inflow</td>
                  <td style={{ padding: "8px", textAlign: "right", color: "#000" }}>{formatNPR(data?.summary.total_credit || 0)}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #d1d5db" }}>
                  <td style={{ padding: "8px", fontWeight: "600", color: "#000" }}>Total Outflow</td>
                  <td style={{ padding: "8px", textAlign: "right", color: "#000" }}>{formatNPR(data?.summary.total_debit || 0)}</td>
                </tr>
                <tr>
                  <td style={{ padding: "8px", fontWeight: "600", color: "#000" }}>Net Cash Flow</td>
                  <td style={{ padding: "8px", textAlign: "right", color: "#000" }}>{formatNPR(data?.summary.net_flow || 0)}</td>
                </tr>
              </tbody>
            </table>

            <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "12px", color: "#000" }}>
              Transactions
            </h3>
            <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #d1d5db" }}>
              <thead style={{ backgroundColor: "#f3f4f6" }}>
                <tr>
                  {["Date", "Type", "Reference", "Party", "Debit", "Credit", "Description"].map((h) => (
                    <th
                      key={h}
                      style={{ padding: "8px", textAlign: "left", fontWeight: "600", borderBottom: "1px solid #d1d5db", color: "#000" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((txn, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #d1d5db" }}>
                    <td style={{ padding: "8px", color: "#000" }}>
                      {new Date(txn.date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "8px", color: "#000" }}>{txn.type}</td>
                    <td style={{ padding: "8px", color: "#000" }}>{txn.reference}</td>
                    <td style={{ padding: "8px", color: "#000" }}>{txn.party}</td>
                    <td style={{ padding: "8px", textAlign: "right", color: "#000" }}>
                      {txn.debit > 0 ? formatNPR(txn.debit) : "-"}
                    </td>
                    <td style={{ padding: "8px", textAlign: "right", color: "#000" }}>
                      {txn.credit > 0 ? formatNPR(txn.credit) : "-"}
                    </td>
                    <td style={{ padding: "8px", color: "#000" }}>{txn.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </PrintableReport>
        </>
      )}
    </ReportsPageShell>
  );
}
