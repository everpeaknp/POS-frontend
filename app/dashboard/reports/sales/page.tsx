"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { DashHeader } from "@/components/dashboard/dash-header";
import { ReportFilter } from "@/components/reports/ReportFilter";
import { ExportButtons } from "@/components/reports/ExportButtons";
import { SummaryCards } from "@/components/reports/SummaryCards";
import apiClient from "@/lib/api/client";
import toast from "react-hot-toast";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";

interface SalesPerformanceData {
  total_sales: number;
  total_orders: number;
  average_order_value: number;
  top_customers: Array<{
    customer_id: string;
    customer_name: string;
    total_orders: number;
    total_amount: number;
  }>;
}

interface TrendData {
  monthly_data: Array<{
    month: string;
    month_date: string;
    revenue: number;
    expenses: number;
    profit: number;
  }>;
}

export default function SalesReportPage() {
  const [period, setPeriod] = useState("month");
  const [loading, setLoading] = useState(false);
  const [salesData, setSalesData] = useState<SalesPerformanceData | null>(null);
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));

  useEffect(() => {
    loadReportData();
  }, [startDate, endDate]);

  const handlePeriodChange = (newPeriod: string) => {
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
  };

  const loadReportData = async () => {
    setLoading(true);
    try {
      // Load sales performance data
      const salesResponse = await apiClient.get("/reports/sales-performance/", {
        params: { start_date: startDate, end_date: endDate }
      });
      setSalesData(salesResponse.data);

      // Load trend data
      const trendResponse = await apiClient.get("/reports/revenue-expense-trend/", {
        params: { months: 6 }
      });
      setTrendData(trendResponse.data);
    } catch (error) {
      console.error("Error loading report data:", error);
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  const stats = salesData ? [
    { label: "Total Sales", value: `Rs. ${salesData.total_sales.toLocaleString()}` },
    { label: "Total Orders", value: salesData.total_orders.toString() },
    { label: "Avg Order Value", value: `Rs. ${salesData.average_order_value.toLocaleString()}` },
    { label: "Top Customer", value: salesData.top_customers[0]?.customer_name || "N/A" },
  ] : [
    { label: "Total Sales", value: "Rs. 0" },
    { label: "Total Orders", value: "0" },
    { label: "Avg Order Value", value: "Rs. 0" },
    { label: "Top Customer", value: "N/A" },
  ];

  // Transform trend data for chart
  const trendChartData = trendData?.monthly_data.map(item => ({
    date: item.month,
    sales: item.revenue,
  })) || [];

  // Calculate total sales for percentage
  const totalSales = salesData?.total_sales || 1;

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Sales Report" subtitle="Sales performance and trends" />
      <ReportFilter 
        period={period} 
        onPeriodChange={handlePeriodChange} 
        onGenerate={loadReportData}
      />

      <div className="flex-1 p-6 space-y-6">
        {/* Export Buttons */}
        <div className="flex justify-end">
          <ExportButtons />
        </div>

        {/* Summary Cards */}
        <SummaryCards cards={stats} />

        {/* Sales Trend Chart */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Sales Trend (Last 6 Months)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: any) => `Rs. ${Number(value).toLocaleString()}`} />
              <Line type="monotone" dataKey="sales" stroke="#22C55E" strokeWidth={2} dot={{ fill: "#22C55E" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Customers */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Top Customers</h3>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : salesData && salesData.top_customers.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Rank", "Customer Name", "Orders", "Total Amount", "% of Total"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {salesData.top_customers.map((customer, index) => {
                  const percentage = ((customer.total_amount / totalSales) * 100).toFixed(1);
                  return (
                    <tr key={customer.customer_id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-900">{index + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{customer.customer_name}</td>
                      <td className="px-4 py-3 text-gray-600">{customer.total_orders}</td>
                      <td className="px-4 py-3 text-gray-800 font-medium">Rs. {customer.total_amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-600">{percentage}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-gray-500">No customer data available</div>
          )}
        </div>
      </div>
    </div>
  );
}
