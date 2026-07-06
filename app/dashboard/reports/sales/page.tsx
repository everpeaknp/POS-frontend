"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import type { ExportTableData } from "@/lib/utils/export";

const SALES_PERIODS = ["today", "week", "month", "year"] as const;

export default function SalesReportPage() {
  const [period, setPeriod] = useState<string>("month");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [salesData, setSalesData] = useState<Awaited<
    ReturnType<typeof reportsAPI.salesPerformance>
  > | null>(null);
  const [trendData, setTrendData] = useState<Awaited<
    ReturnType<typeof reportsAPI.revenueExpenseTrend>
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
      const [sales, trend] = await Promise.all([
        reportsAPI.salesPerformance({ start_date: startDate, end_date: endDate }),
        reportsAPI.revenueExpenseTrend({ months: 6 }),
      ]);
      setSalesData(sales);
      setTrendData(trend);
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
      value: formatNPR(salesData?.total_sales ?? 0),
    },
    {
      label: "Total Orders",
      value: String(salesData?.total_orders ?? 0),
    },
    {
      label: "Avg Order Value",
      value: formatNPR(salesData?.average_order_value ?? 0),
    },
    {
      label: "Top Customer",
      value: salesData?.top_customers?.[0]?.customer_name ?? "N/A",
    },
  ];

  const trendChartData =
    trendData?.monthly_data.map((item) => ({
      date: item.month,
      sales: item.revenue,
    })) ?? [];

  const totalSales = salesData?.total_sales || 1;

  const getExportData = useCallback((): ExportTableData | null => {
    if (!salesData?.top_customers?.length) return null;
    return {
      filename: `sales-report-${startDate}`,
      title: "Sales Report",
      subtitle: `${startDate} to ${endDate}`,
      headers: ["Rank", "Customer", "Orders", "Total Amount", "% of Total"],
      rows: salesData.top_customers.map((customer, index) => [
        String(index + 1),
        customer.customer_name,
        String(customer.total_orders),
        formatNPR(customer.total_amount),
        `${((customer.total_amount / totalSales) * 100).toFixed(1)}%`,
      ]),
    };
  }, [salesData, startDate, endDate, totalSales]);

  return (
    <ReportsPageShell
      title="Sales Report"
      subtitle="Sales performance and trends"
      loading={loading && !salesData}
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

      <div className={`${reportsCardClass} p-6`}>
        <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">
          Sales Trend (Last 6 Months)
        </h3>
        {trendChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={trendChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => formatNPR(Number(value ?? 0))} />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#22C55E"
                strokeWidth={2}
                dot={{ fill: "#22C55E" }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[320px] flex items-center justify-center text-sm text-gray-400">
            No trend data for this period
          </div>
        )}
      </div>

      <div className={reportsTableWrapClass}>
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Top Customers</h3>
        </div>
        {salesData && salesData.top_customers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Rank", "Customer", "Orders", "Total Amount", "% of Total"].map(
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
                {salesData.top_customers.map((customer, index) => (
                  <tr key={customer.customer_id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3 font-medium text-gray-900">{index + 1}</td>
                    <td className="px-6 py-3 font-medium text-gray-900">
                      {customer.customer_name}
                    </td>
                    <td className="px-6 py-3 text-gray-600">{customer.total_orders}</td>
                    <td className="px-6 py-3 font-medium text-gray-800">
                      {formatNPR(customer.total_amount)}
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {((customer.total_amount / totalSales) * 100).toFixed(1)}%
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
    </ReportsPageShell>
  );
}
