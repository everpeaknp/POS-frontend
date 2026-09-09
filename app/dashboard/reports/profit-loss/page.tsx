"use client";

import { useState, useEffect, useCallback } from "react";
import { ReportsPageShell, reportsCardClass, reportsTableWrapClass } from "@/components/reports/ReportsPageShell";
import { SummaryCards } from "@/components/reports/SummaryCards";
import { ExportButtons } from "@/components/reports/ExportButtons";
import { formatNPR } from "@/lib/utils";
import { reportsAPI } from "@/lib/api/reports";
import toast from "react-hot-toast";
import type { ExportTableData } from "@/lib/utils/export";

interface ProfitAndLossData {
  period?: string;
  revenue: number;
  cost_of_goods_sold: number;
  gross_profit: number;
  operating_expenses: number;
  operating_profit: number;
  other_income: number;
  other_expenses: number;
  profit_before_tax: number;
  tax: number;
  net_profit: number;
  line_items?: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
}

export default function ProfitLossReportPage() {
  const [data, setData] = useState<ProfitAndLossData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Initialize dates to last 12 months
  useEffect(() => {
    const end = new Date();
    const start = new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000);
    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
  }, []);

  const fetchData = useCallback(async (start?: string, end?: string) => {
    if (!start || !end) return;
    setLoading(true);
    setError(null);
    try {
      const result = await reportsAPI.profitAndLoss({
        start_date: start,
        end_date: end,
      });
      setData(result as unknown as ProfitAndLossData);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { detail?: string } } };
      console.error("Failed to fetch P&L:", err);
      setError(apiErr.response?.data?.detail || "Failed to load P&L report");
      toast.error("Failed to load P&L report");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      void fetchData(startDate, endDate);
    }
  }, [startDate, endDate, fetchData]);

  const stats = data
    ? [
        { label: "Revenue", value: formatNPR(data.revenue) },
        { label: "Gross Profit", value: formatNPR(data.gross_profit) },
        { label: "Operating Profit", value: formatNPR(data.operating_profit) },
        { label: "Net Profit", value: formatNPR(data.net_profit) },
      ]
    : [
        { label: "Revenue", value: "Rs. 0" },
        { label: "Gross Profit", value: "Rs. 0" },
        { label: "Operating Profit", value: "Rs. 0" },
        { label: "Net Profit", value: "Rs. 0" },
      ];

  const getExportData = useCallback((): ExportTableData | null => {
    if (!data) return null;
    return {
      filename: `profit-loss-${startDate}-to-${endDate}`,
      title: "Profit & Loss Report",
      subtitle: `${startDate} to ${endDate}`,
      headers: ["Category", "Amount"],
      rows: [
        ["Revenue", formatNPR(data.revenue)],
        ["Cost of Goods Sold", formatNPR(data.cost_of_goods_sold)],
        ["Gross Profit", formatNPR(data.gross_profit)],
        ["Operating Expenses", formatNPR(data.operating_expenses)],
        ["Operating Profit", formatNPR(data.operating_profit)],
        ["Other Income", formatNPR(data.other_income)],
        ["Other Expenses", formatNPR(data.other_expenses)],
        ["Profit Before Tax", formatNPR(data.profit_before_tax)],
        ["Tax", formatNPR(data.tax)],
        ["Net Profit", formatNPR(data.net_profit)],
      ],
    };
  }, [data, startDate, endDate]);

  return (
    <ReportsPageShell
      title="Profit & Loss"
      subtitle="Income and expense summary"
      loading={loading && !data}
      error={error}
      onRetry={() => void fetchData(startDate, endDate)}
      toolbar={
        <div className="flex items-center gap-2">
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
        </div>
      }
      action={<ExportButtons getExportData={getExportData} disabled={loading} />}
    >
      {!data ? (
        <div className={`${reportsCardClass} p-12 text-center text-gray-500`}>
          No P&L data available for the selected period
        </div>
      ) : (
        <>
          <SummaryCards cards={stats} />

          <div className={reportsTableWrapClass}>
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Income Statement</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {[
                { label: "Revenue", value: data.revenue },
                { label: "Cost of Goods Sold", value: data.cost_of_goods_sold, indent: true },
                { label: "Gross Profit", value: data.gross_profit, bold: true },
                { label: "Operating Expenses", value: data.operating_expenses, indent: true },
                { label: "Operating Profit", value: data.operating_profit, bold: true },
                { label: "Other Income", value: data.other_income, indent: true },
                { label: "Other Expenses", value: data.other_expenses, indent: true },
                { label: "Profit Before Tax", value: data.profit_before_tax, bold: true },
                { label: "Tax", value: data.tax, indent: true },
                { label: "Net Profit", value: data.net_profit, bold: true, highlight: true },
              ].map((row, idx) => (
                <div
                  key={idx}
                  className={`px-6 py-3 flex justify-between ${
                    row.highlight ? "bg-slate-50" : ""
                  }`}
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
        </>
      )}
    </ReportsPageShell>
  );
}
