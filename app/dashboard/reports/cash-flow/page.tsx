"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ExportButtons } from "@/components/reports/ExportButtons";
import { SummaryCards } from "@/components/reports/SummaryCards";
import {
  ReportsPageShell,
  reportsCardClass,
  reportsTableWrapClass,
} from "@/components/reports/ReportsPageShell";
import { formatNPR } from "@/lib/utils";
import apiClient from "@/lib/api/client";
import toast from "react-hot-toast";
import type { ExportTableData } from "@/lib/utils/export";

interface CashFlowData {
  operating_cash_flow: number;
  investing_cash_flow: number;
  financing_cash_flow: number;
  net_cash_flow: number;
  beginning_balance: number;
  ending_balance: number;
  monthly?: Array<{
    month: string;
    inflow: number;
    outflow: number;
    net: number;
  }>;
}

export default function CashFlowPage() {
  const [data, setData] = useState<CashFlowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<CashFlowData>("/api/reports/financial-reports/", {
        params: { type: "cash_flow" }
      });
      setData(response.data);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { detail?: string } } };
      console.error("Failed to fetch cash flow:", err);
      setError("Unable to load cash flow - feature currently unavailable");
      toast.error("Unable to load cash flow");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const stats = data
    ? [
        { label: "Operating Cash Flow", value: formatNPR(data.operating_cash_flow) },
        { label: "Investing Cash Flow", value: formatNPR(data.investing_cash_flow) },
        { label: "Financing Cash Flow", value: formatNPR(data.financing_cash_flow) },
        { label: "Net Cash Flow", value: formatNPR(data.net_cash_flow) },
      ]
    : [
        { label: "Operating Cash Flow", value: "Rs. 0" },
        { label: "Investing Cash Flow", value: "Rs. 0" },
        { label: "Financing Cash Flow", value: "Rs. 0" },
        { label: "Net Cash Flow", value: "Rs. 0" },
      ];

  const chartData = data?.monthly || [];

  const getExportData = useCallback((): ExportTableData | null => {
    if (!data) return null;
    return {
      filename: "cash-flow",
      title: "Cash Flow Report",
      headers: ["Category", "Amount"],
      rows: [
        ["Operating Cash Flow", formatNPR(data.operating_cash_flow)],
        ["Investing Cash Flow", formatNPR(data.investing_cash_flow)],
        ["Financing Cash Flow", formatNPR(data.financing_cash_flow)],
        ["Net Cash Flow", formatNPR(data.net_cash_flow)],
        ["Beginning Balance", formatNPR(data.beginning_balance)],
        ["Ending Balance", formatNPR(data.ending_balance)],
      ],
    };
  }, [data]);

  return (
    <ReportsPageShell
      title="Cash Flow"
      subtitle="Cash inflows and outflows"
      loading={loading && !data}
      error={error}
      onRetry={() => void fetchData()}
      action={<ExportButtons getExportData={getExportData} disabled={loading} />}
    >
      {!data ? (
        <div className={`${reportsCardClass} p-12 text-center text-gray-500`}>
          No cash flow data available
        </div>
      ) : (
        <>
          <SummaryCards cards={stats} />

          {chartData.length > 0 && (
            <div className={`${reportsCardClass} p-6`}>
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">
                Monthly Cash Flow Trend
              </h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => formatNPR(Number(value))} />
                  <Legend />
                  <Bar dataKey="inflow" fill="#4A5D7A" name="Inflow" />
                  <Bar dataKey="outflow" fill="#556B8C" name="Outflow" />
                  <Bar dataKey="net" fill="#2E3E52" name="Net Flow" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className={reportsTableWrapClass}>
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Cash Flow Summary</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {[
                { label: "Operating Cash Flow", value: data.operating_cash_flow, color: "green" },
                { label: "Investing Cash Flow", value: data.investing_cash_flow, color: "orange" },
                { label: "Financing Cash Flow", value: data.financing_cash_flow, color: "blue" },
                { label: "Net Cash Flow", value: data.net_cash_flow, color: data.net_cash_flow >= 0 ? "green" : "red" },
                { label: "Beginning Balance", value: data.beginning_balance, color: "gray" },
                { label: "Ending Balance", value: data.ending_balance, color: data.ending_balance >= 0 ? "green" : "red" },
              ].map((row, idx) => (
                <div key={idx} className="px-6 py-4 flex justify-between items-center">
                  <span className="font-medium text-gray-700">{row.label}</span>
                  <span
                    className={`font-semibold ${
                      row.color === "green"
                        ? "text-green-600"
                        : row.color === "red"
                          ? "text-red-600"
                          : row.color === "orange"
                            ? "text-orange-600"
                            : row.color === "blue"
                              ? "text-blue-600"
                              : "text-gray-600"
                    }`}
                  >
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
