"use client";

import { useState, useEffect, useCallback } from "react";
import { ExportButtons } from "@/components/reports/ExportButtons";
import { SummaryCards } from "@/components/reports/SummaryCards";
import {
  ReportsPageShell,
  reportsCardClass,
  reportsTableWrapClass,
} from "@/components/reports/ReportsPageShell";
import { formatNPR } from "@/lib/utils";
import { reportsAPI } from "@/lib/api/reports";
import toast from "react-hot-toast";
import type { ExportTableData } from "@/lib/utils/export";

interface FinancialReportData {
  as_of_date?: string;
  profit_loss?: any;
  balance_sheet?: any;
  trial_balance?: any;
}

export default function FinancialReportPage() {
  const [data, setData] = useState<FinancialReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [asOfDate, setAsOfDate] = useState<string>("");

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setAsOfDate(today);
  }, []);

  const fetchData = useCallback(async (date?: string) => {
    if (!date) return;
    setLoading(true);
    setError(null);
    try {
      const result = await reportsAPI.financialReports({
        as_of_date: date,
      });
      setData(result as unknown as FinancialReportData);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { detail?: string } } };
      console.error("Failed to fetch financial reports:", err);
      setError(apiErr.response?.data?.detail || "Failed to load financial reports");
      toast.error("Failed to load financial reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (asOfDate) {
      void fetchData(asOfDate);
    }
  }, [asOfDate, fetchData]);

  const stats = data?.profit_loss
    ? [
        { label: "Revenue", value: formatNPR(data.profit_loss.revenue || 0) },
        { label: "Expenses", value: formatNPR(data.profit_loss.expenses || 0) },
        { label: "Net Profit", value: formatNPR(data.profit_loss.net_profit || 0) },
        { label: "As of Date", value: asOfDate },
      ]
    : [
        { label: "Revenue", value: "Rs. 0" },
        { label: "Expenses", value: "Rs. 0" },
        { label: "Net Profit", value: "Rs. 0" },
        { label: "As of Date", value: asOfDate },
      ];

  const getExportData = useCallback((): ExportTableData | null => {
    if (!data) return null;
    return {
      filename: `financial-report-${asOfDate}`,
      title: "Financial Report",
      subtitle: `As of ${asOfDate}`,
      headers: ["Category", "Amount"],
      rows: [
        ...(data.profit_loss ? [["Revenue", formatNPR(data.profit_loss.revenue || 0)]] : []),
        ...(data.profit_loss ? [["Expenses", formatNPR(data.profit_loss.expenses || 0)]] : []),
        ...(data.profit_loss ? [["Net Profit", formatNPR(data.profit_loss.net_profit || 0)]] : []),
      ],
    };
  }, [data, asOfDate]);

  return (
    <ReportsPageShell
      title="Financial Report"
      subtitle="P&L, Balance Sheet, Trial Balance"
      loading={loading && !data}
      error={error}
      onRetry={() => void fetchData(asOfDate)}
      toolbar={
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">As of:</span>
          <input
            type="date"
            value={asOfDate}
            onChange={(e) => setAsOfDate(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
        </div>
      }
      action={<ExportButtons getExportData={getExportData} disabled={loading} />}
    >
      {!data ? (
        <div className={`${reportsCardClass} p-12 text-center text-gray-500`}>
          No financial data available
        </div>
      ) : (
        <>
          <SummaryCards cards={stats} />

          {/* Profit & Loss Section */}
          {data.profit_loss && (
            <div className={reportsTableWrapClass}>
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">Profit & Loss</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {[
                  { label: "Revenue", value: data.profit_loss.revenue || 0, bold: true },
                  { label: "Cost of Goods Sold", value: data.profit_loss.cogs || 0, indent: true },
                  { label: "Gross Profit", value: (data.profit_loss.revenue || 0) - (data.profit_loss.cogs || 0), bold: true },
                  { label: "Operating Expenses", value: data.profit_loss.operating_expenses || 0, indent: true },
                  { label: "Operating Profit", value: data.profit_loss.operating_profit || 0, bold: true },
                  { label: "Other Income", value: data.profit_loss.other_income || 0, indent: true },
                  { label: "Net Profit", value: data.profit_loss.net_profit || 0, bold: true, highlight: true },
                ].map((row, idx) => (
                  <div
                    key={idx}
                    className={`px-6 py-3 flex justify-between ${row.highlight ? "bg-slate-50" : ""}`}
                  >
                    <span className={`${row.bold ? "font-semibold" : ""} ${row.indent ? "ml-4 text-gray-600" : ""}`}>
                      {row.label}
                    </span>
                    <span className={`${row.bold ? "font-semibold" : ""} ${row.highlight ? "text-green-600 font-bold" : ""}`}>
                      {formatNPR(row.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Balance Sheet Section */}
          {data.balance_sheet && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className={reportsTableWrapClass}>
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">Assets</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {[
                    { label: "Current Assets", value: data.balance_sheet.current_assets || 0, bold: true },
                    { label: "Fixed Assets", value: data.balance_sheet.fixed_assets || 0, bold: true },
                    { label: "Total Assets", value: (data.balance_sheet.current_assets || 0) + (data.balance_sheet.fixed_assets || 0), bold: true, highlight: true },
                  ].map((row, idx) => (
                    <div key={idx} className={`px-6 py-3 flex justify-between ${row.highlight ? "bg-slate-50" : ""}`}>
                      <span className={row.bold ? "font-semibold" : ""}>{row.label}</span>
                      <span className={row.highlight ? "text-blue-600 font-bold" : "font-semibold"}>
                        {formatNPR(row.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={reportsTableWrapClass}>
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">Liabilities & Equity</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {[
                    { label: "Current Liabilities", value: data.balance_sheet.current_liabilities || 0, bold: true },
                    { label: "Long-term Liabilities", value: data.balance_sheet.long_term_liabilities || 0, bold: true },
                    { label: "Total Liabilities", value: (data.balance_sheet.current_liabilities || 0) + (data.balance_sheet.long_term_liabilities || 0), bold: true },
                    { label: "Equity", value: data.balance_sheet.equity || 0, bold: true, highlight: true },
                    { label: "Total L&E", value: (data.balance_sheet.current_liabilities || 0) + (data.balance_sheet.long_term_liabilities || 0) + (data.balance_sheet.equity || 0), bold: true, highlight: true },
                  ].map((row, idx) => (
                    <div key={idx} className={`px-6 py-3 flex justify-between ${row.highlight ? "bg-slate-50" : ""}`}>
                      <span className={row.bold ? "font-semibold" : ""}>{row.label}</span>
                      <span className={row.highlight ? "text-green-600 font-bold" : "font-semibold"}>
                        {formatNPR(row.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </ReportsPageShell>
  );
}
