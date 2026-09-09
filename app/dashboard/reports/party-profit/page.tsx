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
import { reportsAPI, type PartyProfitData } from "@/lib/api/reports";
import { formatNPR } from "@/lib/utils";
import toast from "react-hot-toast";
import type { ExportTableData } from "@/lib/utils/export";
import { PrintableReport } from "@/components/reports/PrintableReport";

export default function PartyProfitPage() {
  const [reportData, setReportData] = useState<PartyProfitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Initialize dates to last 90 days
  useEffect(() => {
    const end = new Date();
    const start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
  }, []);

  const fetchData = useCallback(async (start?: string, end?: string) => {
    if (!start || !end) return;
    setLoading(true);
    setError(null);
    try {
      const result = await reportsAPI.partyProfit({
        start_date: start,
        end_date: end,
      });
      setReportData(result);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { detail?: string } } };
      console.error("Failed to fetch party profit:", err);
      setError(apiErr.response?.data?.detail || "Failed to load party profit");
      toast.error("Failed to load party profit");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      void fetchData(startDate, endDate);
    }
  }, [startDate, endDate, fetchData]);

  const stats = reportData
    ? [
        {
          label: "Total Customers",
          value: String(reportData.summary.total_customers),
        },
        {
          label: "Total Revenue",
          value: formatNPR(reportData.summary.total_revenue),
        },
        {
          label: "Total Profit",
          value: formatNPR(reportData.summary.total_profit),
        },
        {
          label: "Profit Margin",
          value: `${reportData.summary.overall_margin.toFixed(2)}%`,
        },
      ]
    : [
        { label: "Total Customers", value: "0" },
        { label: "Total Revenue", value: "Rs. 0" },
        { label: "Total Profit", value: "Rs. 0" },
        { label: "Profit Margin", value: "0%" },
      ];

  const chartData = reportData?.customers.slice(0, 10).map((c) => ({
    name: c.customer_name.substring(0, 15),
    revenue: c.revenue,
    profit: c.profit,
  })) || [];

  const getExportData = useCallback((): ExportTableData | null => {
    if (!reportData?.customers.length) return null;
    return {
      filename: `party-profit-${startDate}-to-${endDate}`,
      title: "Party-wise Profit Report",
      subtitle: `${startDate} to ${endDate}`,
      headers: ["Rank", "Customer", "Orders", "Revenue", "Profit", "Margin", "Avg Order"],
      rows: reportData.customers.map((customer, index) => [
        String(index + 1),
        customer.customer_name,
        String(customer.orders_count),
        formatNPR(customer.revenue),
        formatNPR(customer.profit),
        `${customer.profit_margin.toFixed(2)}%`,
        formatNPR(customer.avg_order_value),
      ]),
    };
  }, [reportData, startDate, endDate]);

  return (
    <ReportsPageShell
      title="Party-wise Profit"
      subtitle="Profit analysis grouped by customer"
      loading={loading && !reportData}
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
      {!reportData ? (
        <div className={`${reportsCardClass} p-12 text-center text-gray-500`}>
          No profit data for the selected period
        </div>
      ) : (
        <>
          <SummaryCards cards={stats} />

          {chartData.length > 0 && (
            <div className={`${reportsCardClass} p-6`}>
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">
                Top 10 Customers by Profit
              </h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value) => formatNPR(Number(value))}
                    contentStyle={{ backgroundColor: "#fff", border: "1px solid #ccc" }}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="#4A5D7A" name="Revenue" />
                  <Bar dataKey="profit" fill="#2E3E52" name="Profit" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className={reportsTableWrapClass}>
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Customer Profitability</h3>
            </div>
            {reportData.customers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {["Rank", "Customer", "Orders", "Revenue", "Profit", "Margin", "Avg Order"].map((h) => (
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
                    {reportData.customers.map((customer, index) => (
                      <tr key={customer.customer_id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-3 font-medium">{index + 1}</td>
                        <td className="px-6 py-3 font-medium text-gray-900">
                          {customer.customer_name}
                        </td>
                        <td className="px-6 py-3 text-gray-600">{customer.orders_count}</td>
                        <td className="px-6 py-3 font-medium">
                          {formatNPR(customer.revenue)}
                        </td>
                        <td className="px-6 py-3 font-medium text-green-600">
                          {formatNPR(customer.profit)}
                        </td>
                        <td className="px-6 py-3">
                          <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-700">
                            {customer.profit_margin.toFixed(2)}%
                          </span>
                        </td>
                        <td className="px-6 py-3 text-gray-600">
                          {formatNPR(customer.avg_order_value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-12 text-center text-gray-500">No customer data</div>
            )}
          </div>

          <PrintableReport reportTitle="Customer Profitability Report">
            <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "12px", color: "#000" }}>
              Summary
            </h3>
            <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #d1d5db", marginBottom: "20px" }}>
              <tbody>
                <tr style={{ borderBottom: "1px solid #d1d5db" }}>
                  <td style={{ padding: "8px", fontWeight: "600", color: "#000" }}>Total Customers</td>
                  <td style={{ padding: "8px", textAlign: "right", color: "#000" }}>{reportData.summary.total_customers}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #d1d5db" }}>
                  <td style={{ padding: "8px", fontWeight: "600", color: "#000" }}>Total Revenue</td>
                  <td style={{ padding: "8px", textAlign: "right", color: "#000" }}>{formatNPR(reportData.summary.total_revenue)}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #d1d5db" }}>
                  <td style={{ padding: "8px", fontWeight: "600", color: "#000" }}>Total Profit</td>
                  <td style={{ padding: "8px", textAlign: "right", color: "#000" }}>{formatNPR(reportData.summary.total_profit)}</td>
                </tr>
                <tr>
                  <td style={{ padding: "8px", fontWeight: "600", color: "#000" }}>Profit Margin</td>
                  <td style={{ padding: "8px", textAlign: "right", color: "#000" }}>{reportData.summary.overall_margin.toFixed(2)}%</td>
                </tr>
              </tbody>
            </table>

            <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "12px", color: "#000" }}>
              Customer Profitability
            </h3>
            <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #d1d5db" }}>
              <thead style={{ backgroundColor: "#f3f4f6" }}>
                <tr>
                  {["Rank", "Customer", "Orders", "Revenue", "Profit", "Margin", "Avg Order"].map((h) => (
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
                {reportData.customers.map((customer, index) => (
                  <tr key={customer.customer_id} style={{ borderBottom: "1px solid #d1d5db" }}>
                    <td style={{ padding: "8px", color: "#000" }}>{index + 1}</td>
                    <td style={{ padding: "8px", color: "#000" }}>{customer.customer_name}</td>
                    <td style={{ padding: "8px", textAlign: "right", color: "#000" }}>{customer.orders_count}</td>
                    <td style={{ padding: "8px", textAlign: "right", color: "#000" }}>{formatNPR(customer.revenue)}</td>
                    <td style={{ padding: "8px", textAlign: "right", color: "#000" }}>{formatNPR(customer.profit)}</td>
                    <td style={{ padding: "8px", textAlign: "right", color: "#000" }}>{customer.profit_margin.toFixed(2)}%</td>
                    <td style={{ padding: "8px", textAlign: "right", color: "#000" }}>{formatNPR(customer.avg_order_value)}</td>
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
