"use client";

import { DateInput } from "@/components/shared/DateInput";
import { useState, useEffect } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashHeader } from "@/components/dashboard/dash-header";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { salesReportsAPI } from "@/lib/api/sales";
import toast from "react-hot-toast";
import { format, startOfWeek, startOfMonth, startOfQuarter, startOfYear } from "date-fns";

const DATE_RANGES = ["This Week", "This Month", "This Quarter", "This Year", "Custom"];
const TABS = ["Sales Summary", "By Customer", "By Product", "By Category", "Tax Report"];

const fmt = (n: number) => `Rs. ${n.toLocaleString("en-IN")}`;

function DateRangeFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {DATE_RANGES.map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
            value === r
              ? "bg-[#22C55E] text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {r}
        </button>
      ))}
    </div>
  );
}

export default function SalesReportsPage() {
  const [activeTab, setActiveTab] = useState("Sales Summary");
  const [dateRange, setDateRange] = useState("This Month");
  const [loading, setLoading] = useState(false);
  
  // Date state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Report data
  const [salesSummaryData, setSalesSummaryData] = useState<any>(null);
  const [byCustomerData, setByCustomerData] = useState<any>(null);
  const [byProductData, setByProductData] = useState<any>(null);
  const [byCategoryData, setByCategoryData] = useState<any>(null);
  const [taxReportData, setTaxReportData] = useState<any>(null);

  // Calculate date range based on selection
  useEffect(() => {
    const today = new Date();
    let start = "";
    let end = format(today, "yyyy-MM-dd");

    switch (dateRange) {
      case "This Week":
        start = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
        break;
      case "This Month":
        start = format(startOfMonth(today), "yyyy-MM-dd");
        break;
      case "This Quarter":
        start = format(startOfQuarter(today), "yyyy-MM-dd");
        break;
      case "This Year":
        start = format(startOfYear(today), "yyyy-MM-dd");
        break;
      case "Custom":
        // Don't auto-set dates for custom
        return;
    }

    setStartDate(start);
    setEndDate(end);
  }, [dateRange]);

  // Load data when tab or dates change
  useEffect(() => {
    if (startDate && endDate) {
      loadReportData();
    }
  }, [activeTab, startDate, endDate]);

  const loadReportData = async () => {
    if (!startDate || !endDate) return;

    setLoading(true);
    try {
      const params = { start_date: startDate, end_date: endDate };

      switch (activeTab) {
        case "Sales Summary":
          const summaryData = await salesReportsAPI.getSalesSummary(params);
          setSalesSummaryData(summaryData);
          break;
        case "By Customer":
          const customerData = await salesReportsAPI.getByCustomer(params);
          setByCustomerData(customerData);
          break;
        case "By Product":
          const productData = await salesReportsAPI.getByProduct(params);
          setByProductData(productData);
          break;
        case "By Category":
          const categoryData = await salesReportsAPI.getByCategory(params);
          setByCategoryData(categoryData);
          break;
        case "Tax Report":
          const taxData = await salesReportsAPI.getTaxReport(params);
          setTaxReportData(taxData);
          break;
      }
    } catch (error) {
      console.error("Error loading report:", error);
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Sales Reports" subtitle="Analytics and insights" />

      <div className="flex-1 p-6 space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
          
          {dateRange === "Custom" && (
            <>
              <DateInput value={startDate} onChange={(date) => setStartDate(date)} />
              <DateInput value={endDate} onChange={(date) => setEndDate(date)} />
            </>
          )}
          
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-gray-600 border-gray-200"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-gray-600 border-gray-200"
          >
            <Download className="h-3.5 w-3.5" /> Export PDF
          </Button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#22C55E]" />
          </div>
        )}

        {/* Sales Summary Tab */}
        {!loading && activeTab === "Sales Summary" && salesSummaryData && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <p className="text-xs text-gray-500">Total Sales</p>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  {fmt(salesSummaryData.summary.total_sales)}
                </p>
                <p className="text-xs text-[#22C55E] mt-0.5">
                  {salesSummaryData.summary.total_orders} orders
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <p className="text-xs text-gray-500">Total Orders</p>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  {salesSummaryData.summary.total_orders}
                </p>
                <p className="text-xs text-[#22C55E] mt-0.5">Confirmed & Delivered</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <p className="text-xs text-gray-500">Avg Order Value</p>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  {fmt(salesSummaryData.summary.avg_order_value)}
                </p>
                <p className="text-xs text-[#22C55E] mt-0.5">Per transaction</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <p className="text-xs text-gray-500">Cash Collected</p>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  {fmt(salesSummaryData.summary.cash_collected)}
                </p>
                <p className="text-xs text-[#22C55E] mt-0.5">
                  {salesSummaryData.summary.collection_rate}% collection rate
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                Monthly Sales Trend
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={salesSummaryData.monthly_trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(v) => [
                      `Rs. ${Number(v).toLocaleString()}`,
                      "Sales",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="#22C55E"
                    strokeWidth={2.5}
                    dot={{ fill: "#22C55E", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["Month", "Orders", "Revenue", "Collected", "Outstanding"].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {salesSummaryData.monthly_trend.map((row: any) => (
                    <tr key={row.month} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {row.month}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{row.orders}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {fmt(row.sales)}
                      </td>
                      <td className="px-4 py-3 text-[#22C55E] font-medium">
                        {fmt(row.collected)}
                      </td>
                      <td className="px-4 py-3 text-red-500">
                        {fmt(row.outstanding)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* By Customer Tab */}
        {!loading && activeTab === "By Customer" && byCustomerData && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                Revenue by Customer
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byCustomerData.customers.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="customer_name" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(v) => [
                      `Rs. ${Number(v).toLocaleString()}`,
                      "Revenue",
                    ]}
                  />
                  <Bar dataKey="revenue" fill="#22C55E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["Customer", "Orders", "Total Revenue", "Avg Order", "Status"].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {byCustomerData.customers.map((c: any) => (
                    <tr key={c.customer_id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {c.customer_name}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{c.orders}</td>
                      <td className="px-4 py-3 font-semibold text-gray-800">
                        {fmt(c.revenue)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {fmt(c.avg_order)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            c.status === "active"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* By Product Tab */}
        {!loading && activeTab === "By Product" && byProductData && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                Revenue by Product
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byProductData.products.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="product_name" 
                    tick={{ fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(v) => [
                      `Rs. ${Number(v).toLocaleString()}`,
                      "Revenue",
                    ]}
                  />
                  <Legend />
                  <Bar
                    dataKey="revenue"
                    name="Revenue"
                    fill="#22C55E"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="qty_sold"
                    name="Qty Sold"
                    fill="#86EFAC"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["Product", "Unit Price", "Qty Sold", "Revenue", "% of Total"].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {byProductData.products.map((p: any) => (
                    <tr key={p.product_id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {p.product_name}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        Rs. {p.unit_price.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {p.qty_sold} {p.unit}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800">
                        {fmt(p.revenue)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                            <div
                              className="bg-[#22C55E] h-1.5 rounded-full"
                              style={{
                                width: `${Math.min(p.percentage, 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">
                            {p.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* By Category Tab */}
        {!loading && activeTab === "By Category" && byCategoryData && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                Revenue by Category
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byCategoryData.categories} layout="vertical">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f0f0f0"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    type="category"
                    dataKey="category_name"
                    tick={{ fontSize: 12 }}
                    width={110}
                  />
                  <Tooltip
                    formatter={(v) => [
                      `Rs. ${Number(v).toLocaleString()}`,
                      "Revenue",
                    ]}
                  />
                  <Bar dataKey="revenue" fill="#22C55E" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["Category", "Revenue", "% Share", "Orders"].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {byCategoryData.categories.map((cat: any) => (
                    <tr key={cat.category_id || cat.category_name} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {cat.category_name}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800">
                        {fmt(cat.revenue)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-100 rounded-full h-1.5">
                            <div
                              className="bg-[#22C55E] h-1.5 rounded-full"
                              style={{
                                width: `${cat.percentage}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">
                            {cat.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{cat.orders}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tax Report Tab */}
        {!loading && activeTab === "Tax Report" && taxReportData && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <p className="text-xs text-gray-500">Total Taxable Sales</p>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  {fmt(taxReportData.summary.total_taxable_sales)}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <p className="text-xs text-gray-500">VAT Collected (13%)</p>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  {fmt(taxReportData.summary.total_vat_collected)}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <p className="text-xs text-gray-500">Net VAT Payable</p>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  {fmt(taxReportData.summary.net_vat_payable)}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                VAT Collected by Month
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={taxReportData.monthly_data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(v) => [`Rs. ${Number(v).toLocaleString()}`]}
                  />
                  <Legend />
                  <Bar
                    dataKey="taxable_sales"
                    name="Taxable Sales"
                    fill="#86EFAC"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="vat_collected"
                    name="VAT (13%)"
                    fill="#22C55E"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["Period", "Taxable Sales", "VAT Rate", "VAT Collected", "Status"].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {taxReportData.monthly_data.map((row: any) => (
                    <tr key={`${row.month}-${row.year}`} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {row.month} {row.year}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {fmt(row.taxable_sales)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{row.vat_rate}%</td>
                      <td className="px-4 py-3 font-semibold text-gray-800">
                        {fmt(row.vat_collected)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
