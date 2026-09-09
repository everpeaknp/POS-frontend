"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { ReportFilter } from "@/components/reports/ReportFilter";
import { ExportButtons } from "@/components/reports/ExportButtons";
import { SummaryCards } from "@/components/reports/SummaryCards";
import {
  ReportsPageShell,
  reportsCardClass,
  reportsTableWrapClass,
} from "@/components/reports/ReportsPageShell";
import { reportsAPI } from "@/lib/api/reports";
import { formatNPR } from "@/lib/utils";
import toast from "react-hot-toast";
import { PrintableReport } from "@/components/reports/PrintableReport";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import type { ExportTableData } from "@/lib/utils/export";

const SALES_PERIODS = ["today", "week", "month", "year"] as const;

export default function SalesReportPage() {
  const [period, setPeriod] = useState<string>("month");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [salesSummary, setSalesSummary] = useState<Awaited<
    ReturnType<typeof reportsAPI.salesSummary>
  > | null>(null);
  const [salesByCustomer, setSalesByCustomer] = useState<Awaited<
    ReturnType<typeof reportsAPI.salesByCustomer>
  > | null>(null);
  const [startDate, setStartDate] = useState(
    format(startOfMonth(new Date()), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState(
    format(endOfMonth(new Date()), "yyyy-MM-dd")
  );

  const applyPeriod = useCallback((newPeriod: string) => {
    setPeriod(newPeriod);
    const today = new Date();
    switch (newPeriod) {
      case "today":
        setStartDate(format(today, "yyyy-MM-dd"));
        setEndDate(format(today, "yyyy-MM-dd"));
        break;
      case "week":
        setStartDate(format(subDays(today, 7), "yyyy-MM-dd"));
        setEndDate(format(today, "yyyy-MM-dd"));
        break;
      case "month":
        setStartDate(format(startOfMonth(today), "yyyy-MM-dd"));
        setEndDate(format(endOfMonth(today), "yyyy-MM-dd"));
        break;
      case "year":
        setStartDate(format(new Date(today.getFullYear(), 0, 1), "yyyy-MM-dd"));
        setEndDate(format(today, "yyyy-MM-dd"));
        break;
    }
  }, []);

  const loadReportData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summary, byCustomer] = await Promise.all([
        reportsAPI.salesSummary({ start_date: startDate, end_date: endDate }),
        reportsAPI.salesByCustomer({ start_date: startDate, end_date: endDate }),
      ]);
      setSalesSummary(summary);
      setSalesByCustomer(byCustomer);
    } catch (err) {
      console.error("Error loading sales report:", err);
      setError("Failed to load sales report. Please try again.");
      toast.error("Failed to load sales report");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  const stats = [
    {
      label: "Total Sales",
      value: formatNPR(salesSummary?.summary.total_sales ?? 0),
    },
    {
      label: "Total Orders",
      value: String(salesSummary?.summary.total_orders ?? 0),
    },
    {
      label: "Avg Order Value",
      value: formatNPR(salesSummary?.summary.avg_order_value ?? 0),
    },
    {
      label: "Collection Rate",
      value: `${(salesSummary?.summary.collection_rate ?? 0).toFixed(1)}%`,
    },
  ];

  const monthlyTrendData = salesSummary?.monthly_trend ?? [];

  const getExportData = useCallback((): ExportTableData | null => {
    if (!salesByCustomer?.customers?.length) return null;
    return {
      filename: `sales-report-${startDate}`,
      title: "Sales Report",
      subtitle: `${startDate} to ${endDate}`,
      headers: ["Rank", "Customer", "Orders", "Revenue", "Avg Order"],
      rows: salesByCustomer.customers.map((customer, index) => [
        String(index + 1),
        customer.customer_name,
        String(customer.orders),
        formatNPR(customer.revenue),
        formatNPR(customer.avg_order),
      ]),
    };
  }, [salesByCustomer, startDate, endDate]);

  return (
    <ReportsPageShell
      title="Sales Report"
      subtitle="Sales performance and trends"
      loading={loading && !salesSummary}
      error={error}
      onRetry={loadReportData}
      toolbar={
        <ReportFilter
          embedded
          period={period}
          periods={SALES_PERIODS}
          onPeriodChange={applyPeriod}
          fromDate={startDate}
          toDate={endDate}
          onFromDateChange={setStartDate}
          onToDateChange={setEndDate}
          onGenerate={loadReportData}
          loading={loading}
        />
      }
      action={<ExportButtons getExportData={getExportData} disabled={loading} />}
    >
      <SummaryCards cards={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={`${reportsCardClass} p-6`}>
          <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">
            Monthly Sales Trend
          </h3>
          {monthlyTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatNPR(Number(value ?? 0))} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#4A5D7A"
                  strokeWidth={2}
                  name="Sales"
                  dot={{ fill: "#4A5D7A" }}
                />
                <Line
                  type="monotone"
                  dataKey="collected"
                  stroke="#10B981"
                  strokeWidth={2}
                  name="Collected"
                  dot={{ fill: "#10B981" }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[320px] flex items-center justify-center text-sm text-gray-400">
              No trend data for this period
            </div>
          )}
        </div>

        <div className={`${reportsCardClass} p-6`}>
          <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">
            Orders & Collections
          </h3>
          {monthlyTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="orders" fill="#4A5D7A" name="Orders" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[320px] flex items-center justify-center text-sm text-gray-400">
              No data for this period
            </div>
          )}
        </div>
      </div>

      <div className={reportsTableWrapClass}>
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Sales by Customer</h3>
        </div>
        {salesByCustomer && salesByCustomer.customers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Rank", "Customer", "Orders", "Revenue", "Avg Order", "Status"].map(
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
                {salesByCustomer.customers.map((customer, index) => (
                  <tr key={customer.customer_id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3 font-medium text-gray-900">{index + 1}</td>
                    <td className="px-6 py-3 font-medium text-gray-900">
                      {customer.customer_name}
                    </td>
                    <td className="px-6 py-3 text-gray-600">{customer.orders}</td>
                    <td className="px-6 py-3 font-medium text-gray-800">
                      {formatNPR(customer.revenue)}
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {formatNPR(customer.avg_order)}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        customer.status === 'active' 
                          ? 'bg-slate-100 text-slate-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {customer.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500">No customer data for this period</div>
        )}
      </div>

      {/* Printable Version - Hidden on screen, shown only when printing */}
      <PrintableReport reportTitle={`Sales Report (${startDate} to ${endDate})`}>
        {/* Summary Stats */}
        <div style={{ marginBottom: "20px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "12px" }}>
            <tbody>
              <tr>
                <td style={{ padding: "6px", border: "1px solid #d1d5db", fontWeight: "600" }}>Total Sales:</td>
                <td style={{ padding: "6px", border: "1px solid #d1d5db" }}>{formatNPR(salesSummary?.summary.total_sales ?? 0)}</td>
                <td style={{ padding: "6px", border: "1px solid #d1d5db", fontWeight: "600" }}>Total Orders:</td>
                <td style={{ padding: "6px", border: "1px solid #d1d5db" }}>{salesSummary?.summary.total_orders ?? 0}</td>
              </tr>
              <tr>
                <td style={{ padding: "6px", border: "1px solid #d1d5db", fontWeight: "600" }}>Avg Order Value:</td>
                <td style={{ padding: "6px", border: "1px solid #d1d5db" }}>{formatNPR(salesSummary?.summary.avg_order_value ?? 0)}</td>
                <td style={{ padding: "6px", border: "1px solid #d1d5db", fontWeight: "600" }}>Collection Rate:</td>
                <td style={{ padding: "6px", border: "1px solid #d1d5db" }}>{(salesSummary?.summary.collection_rate ?? 0).toFixed(1)}%</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Sales by Customer Table */}
        {salesByCustomer && salesByCustomer.customers.length > 0 && (
          <div>
            <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "12px", color: "#000" }}>
              Sales by Customer
            </h3>
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Customer</th>
                  <th>Orders</th>
                  <th>Revenue</th>
                  <th>Avg Order</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {salesByCustomer.customers.map((customer, index) => (
                  <tr key={customer.customer_id}>
                    <td>{index + 1}</td>
                    <td>{customer.customer_name}</td>
                    <td>{customer.orders}</td>
                    <td>{formatNPR(customer.revenue)}</td>
                    <td>{formatNPR(customer.avg_order)}</td>
                    <td>{customer.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PrintableReport>
    </ReportsPageShell>
  );
}
