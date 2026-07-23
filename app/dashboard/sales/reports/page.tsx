"use client";

import { DateInput } from "@/components/shared/DateInput";
import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExportButtons } from "@/components/reports/ExportButtons";
import { ReportsLoadingState } from "@/components/reports/ReportsPageShell";
import {
  SalesPageShell,
  salesCardClass,
  salesTableWrapClass,
  salesStatCardClass,
  salesFilterPillActive,
  salesFilterPillInactive,
  salesSectionTitleClass,
} from "@/components/dashboard/SalesPageShell";
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
import { formatNPR } from "@/lib/utils";
import toast from "react-hot-toast";
import { format, startOfWeek, startOfMonth, startOfQuarter, startOfYear } from "date-fns";
import type { ExportTableData } from "@/lib/utils/export";

const DATE_RANGES = ["This Week", "This Month", "This Quarter", "This Year", "Custom"] as const;
const TAB_VALUES = [
  { value: "summary", label: "Sales Summary" },
  { value: "customer", label: "By Customer" },
  { value: "product", label: "By Product" },
  { value: "category", label: "By Category" },
  { value: "tax", label: "Tax Report" },
] as const;

type TabValue = (typeof TAB_VALUES)[number]["value"];

const fmt = (n: number) => formatNPR(n);

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
          type="button"
          onClick={() => onChange(r)}
          className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
            value === r ? salesFilterPillActive : salesFilterPillInactive
          }`}
        >
          {r}
        </button>
      ))}
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className={salesStatCardClass}>
      <p className="text-xs text-gray-500 dark:text-muted-foreground">{label}</p>
      <p className="text-xl font-bold text-gray-900 dark:text-foreground mt-1">{value}</p>
      {hint && <p className="text-xs text-[#22C55E] mt-0.5">{hint}</p>}
    </div>
  );
}

function ReportTable({
  headers,
  children,
  title,
}: {
  headers: string[];
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <div className={salesTableWrapClass}>
      {title && (
        <div className="px-6 py-4 border-b border-gray-100 dark:border-border">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-foreground">{title}</h3>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-muted/50 border-b border-gray-100 dark:border-border">
            <tr>
              {headers.map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-border">{children}</tbody>
        </table>
      </div>
    </div>
  );
}

export default function SalesReportsPage() {
  const [activeTab, setActiveTab] = useState<TabValue>("summary");
  const [dateRange, setDateRange] = useState("This Month");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [salesSummaryData, setSalesSummaryData] = useState<any>(null);
  const [byCustomerData, setByCustomerData] = useState<any>(null);
  const [byProductData, setByProductData] = useState<any>(null);
  const [byCategoryData, setByCategoryData] = useState<any>(null);
  const [taxReportData, setTaxReportData] = useState<any>(null);

  useEffect(() => {
    const today = new Date();
    let start = "";
    const end = format(today, "yyyy-MM-dd");

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
        return;
    }

    setStartDate(start);
    setEndDate(end);
  }, [dateRange]);

  const loadReportData = useCallback(async () => {
    if (!startDate || !endDate) return;

    setLoading(true);
    setError(null);
    try {
      const params = { start_date: startDate, end_date: endDate };

      switch (activeTab) {
        case "summary": {
          const summaryData = await salesReportsAPI.getSalesSummary(params);
          setSalesSummaryData(summaryData);
          break;
        }
        case "customer": {
          const customerData = await salesReportsAPI.getByCustomer(params);
          setByCustomerData(customerData);
          break;
        }
        case "product": {
          const productData = await salesReportsAPI.getByProduct(params);
          setByProductData(productData);
          break;
        }
        case "category": {
          const categoryData = await salesReportsAPI.getByCategory(params);
          setByCategoryData(categoryData);
          break;
        }
        case "tax": {
          const taxData = await salesReportsAPI.getTaxReport(params);
          setTaxReportData(taxData);
          break;
        }
      }
    } catch (err) {
      console.error("Error loading report:", err);
      setError("Failed to load report data. Please try again.");
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  }, [activeTab, startDate, endDate]);

  useEffect(() => {
    if (startDate && endDate) {
      loadReportData();
    }
  }, [loadReportData, startDate, endDate]);

  const hasAnyData =
    salesSummaryData || byCustomerData || byProductData || byCategoryData || taxReportData;

  const tabLoading =
    loading &&
    ((activeTab === "summary" && !salesSummaryData) ||
      (activeTab === "customer" && !byCustomerData) ||
      (activeTab === "product" && !byProductData) ||
      (activeTab === "category" && !byCategoryData) ||
      (activeTab === "tax" && !taxReportData));

  const getExportData = useCallback((): ExportTableData | null => {
    const subtitle = `${startDate} to ${endDate}`;

    switch (activeTab) {
      case "customer":
        if (!byCustomerData?.customers?.length) return null;
        return {
          filename: `sales-by-customer-${startDate}`,
          title: "Sales by Customer",
          subtitle,
          headers: ["Customer", "Orders", "Total Revenue", "Avg Order", "Status"],
          rows: byCustomerData.customers.map((c: any) => [
            c.customer_name,
            String(c.orders),
            fmt(c.revenue),
            fmt(c.avg_order),
            c.status,
          ]),
        };
      case "product":
        if (!byProductData?.products?.length) return null;
        return {
          filename: `sales-by-product-${startDate}`,
          title: "Sales by Product",
          subtitle,
          headers: ["Product", "Unit Price", "Qty Sold", "Revenue", "% of Total"],
          rows: byProductData.products.map((p: any) => [
            p.product_name,
            formatNPR(p.unit_price),
            `${p.qty_sold} ${p.unit}`,
            fmt(p.revenue),
            `${p.percentage.toFixed(1)}%`,
          ]),
        };
      case "category":
        if (!byCategoryData?.categories?.length) return null;
        return {
          filename: `sales-by-category-${startDate}`,
          title: "Sales by Category",
          subtitle,
          headers: ["Category", "Revenue", "% Share", "Orders"],
          rows: byCategoryData.categories.map((cat: any) => [
            cat.category_name,
            fmt(cat.revenue),
            `${cat.percentage.toFixed(1)}%`,
            String(cat.orders),
          ]),
        };
      case "tax":
        if (!taxReportData?.monthly_data?.length) return null;
        return {
          filename: `sales-tax-${startDate}`,
          title: "Sales Tax Report",
          subtitle,
          headers: ["Period", "Taxable Sales", "VAT Rate", "VAT Collected", "Status"],
          rows: taxReportData.monthly_data.map((row: any) => [
            `${row.month} ${row.year}`,
            fmt(row.taxable_sales),
            `${row.vat_rate}%`,
            fmt(row.vat_collected),
            row.status,
          ]),
        };
      default:
        if (!salesSummaryData?.monthly_trend?.length) return null;
        return {
          filename: `sales-summary-${startDate}`,
          title: "Sales Summary",
          subtitle,
          headers: ["Month", "Orders", "Revenue", "Collected", "Outstanding"],
          rows: salesSummaryData.monthly_trend.map((row: any) => [
            row.month,
            String(row.orders),
            fmt(row.sales),
            fmt(row.collected),
            fmt(row.outstanding),
          ]),
        };
    }
  }, [
    activeTab,
    startDate,
    endDate,
    byCustomerData,
    byProductData,
    byCategoryData,
    taxReportData,
    salesSummaryData,
  ]);

  return (
    <SalesPageShell
      title="Sales Reports"
      subtitle="Analytics and insights across orders, customers, and tax"
      loading={loading && !hasAnyData}
      error={error}
      onRetry={loadReportData}
      toolbar={
        <>
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
          {dateRange === "Custom" && (
            <div className="flex flex-wrap items-center gap-2">
              <DateInput value={startDate} onChange={setStartDate} className="w-40" />
              <span className="text-sm text-gray-400">to</span>
              <DateInput value={endDate} onChange={setEndDate} className="w-40" />
            </div>
          )}
        </>
      }
      action={<ExportButtons getExportData={getExportData} disabled={loading} />}
    >
      <div className={`${salesCardClass} p-4 lg:p-5`}>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto gap-1">
            {TAB_VALUES.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="text-xs sm:text-sm">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="summary" className="mt-6 space-y-4">
            {tabLoading ? (
              <ReportsLoadingState label="Loading sales summary..." />
            ) : salesSummaryData ? (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    label="Total Sales"
                    value={fmt(salesSummaryData.summary.total_sales)}
                    hint={`${salesSummaryData.summary.total_orders} orders`}
                  />
                  <StatCard
                    label="Total Orders"
                    value={String(salesSummaryData.summary.total_orders)}
                    hint="Confirmed & Delivered"
                  />
                  <StatCard
                    label="Avg Order Value"
                    value={fmt(salesSummaryData.summary.avg_order_value)}
                    hint="Per transaction"
                  />
                  <StatCard
                    label="Cash Collected"
                    value={fmt(salesSummaryData.summary.cash_collected)}
                    hint={`${salesSummaryData.summary.collection_rate}% collection rate`}
                  />
                </div>

                <div className={`${salesCardClass} p-5`}>
                  <h3 className={`${salesSectionTitleClass} mb-4`}>Monthly Sales Trend</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={salesSummaryData.monthly_trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip formatter={(v) => [fmt(Number(v)), "Sales"]} />
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

                <ReportTable
                  headers={["Month", "Orders", "Revenue", "Collected", "Outstanding"]}
                  title="Monthly Breakdown"
                >
                  {salesSummaryData.monthly_trend.map((row: any) => (
                    <tr key={row.month} className="hover:bg-gray-50/50 dark:hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-foreground">
                        {row.month}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground">
                        {row.orders}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-foreground">
                        {fmt(row.sales)}
                      </td>
                      <td className="px-4 py-3 text-[#22C55E] font-medium">{fmt(row.collected)}</td>
                      <td className="px-4 py-3 text-red-500">{fmt(row.outstanding)}</td>
                    </tr>
                  ))}
                </ReportTable>
              </>
            ) : (
              <div className="py-12 text-center text-sm text-gray-500">No summary data for this period</div>
            )}
          </TabsContent>

          <TabsContent value="customer" className="mt-6 space-y-4">
            {tabLoading ? (
              <ReportsLoadingState label="Loading customer report..." />
            ) : byCustomerData ? (
              <>
                <div className={`${salesCardClass} p-5`}>
                  <h3 className={`${salesSectionTitleClass} mb-4`}>Revenue by Customer</h3>
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
                      <Tooltip formatter={(v) => [fmt(Number(v)), "Revenue"]} />
                      <Bar dataKey="revenue" fill="#22C55E" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <ReportTable headers={["Customer", "Orders", "Total Revenue", "Avg Order", "Status"]}>
                  {byCustomerData.customers.map((c: any) => (
                    <tr key={c.customer_id} className="hover:bg-gray-50/50 dark:hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-foreground">
                        {c.customer_name}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground">{c.orders}</td>
                      <td className="px-4 py-3 font-semibold text-gray-800 dark:text-foreground">
                        {fmt(c.revenue)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground">
                        {fmt(c.avg_order)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            c.status === "active"
                              ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                              : "bg-gray-100 text-gray-500 dark:bg-muted dark:text-muted-foreground"
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </ReportTable>
              </>
            ) : (
              <div className="py-12 text-center text-sm text-gray-500">No customer data for this period</div>
            )}
          </TabsContent>

          <TabsContent value="product" className="mt-6 space-y-4">
            {tabLoading ? (
              <ReportsLoadingState label="Loading product report..." />
            ) : byProductData ? (
              <>
                <div className={`${salesCardClass} p-5`}>
                  <h3 className={`${salesSectionTitleClass} mb-4`}>Revenue by Product</h3>
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
                      <Tooltip formatter={(v) => [fmt(Number(v)), "Revenue"]} />
                      <Legend />
                      <Bar dataKey="revenue" name="Revenue" fill="#22C55E" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="qty_sold" name="Qty Sold" fill="#86EFAC" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <ReportTable headers={["Product", "Unit Price", "Qty Sold", "Revenue", "% of Total"]}>
                  {byProductData.products.map((p: any) => (
                    <tr key={p.product_id} className="hover:bg-gray-50/50 dark:hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-foreground">
                        {p.product_name}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground">
                        {formatNPR(p.unit_price)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground">
                        {p.qty_sold} {p.unit}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800 dark:text-foreground">
                        {fmt(p.revenue)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <div className="flex-1 bg-gray-100 dark:bg-muted rounded-full h-1.5">
                            <div
                              className="bg-[#22C55E] h-1.5 rounded-full"
                              style={{ width: `${Math.min(p.percentage, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 dark:text-muted-foreground">
                            {p.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </ReportTable>
              </>
            ) : (
              <div className="py-12 text-center text-sm text-gray-500">No product data for this period</div>
            )}
          </TabsContent>

          <TabsContent value="category" className="mt-6 space-y-4">
            {tabLoading ? (
              <ReportsLoadingState label="Loading category report..." />
            ) : byCategoryData ? (
              <>
                <div className={`${salesCardClass} p-5`}>
                  <h3 className={`${salesSectionTitleClass} mb-4`}>Revenue by Category</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={byCategoryData.categories} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
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
                      <Tooltip formatter={(v) => [fmt(Number(v)), "Revenue"]} />
                      <Bar dataKey="revenue" fill="#22C55E" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <ReportTable headers={["Category", "Revenue", "% Share", "Orders"]}>
                  {byCategoryData.categories.map((cat: any) => (
                    <tr
                      key={cat.category_id || cat.category_name}
                      className="hover:bg-gray-50/50 dark:hover:bg-muted/30"
                    >
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-foreground">
                        {cat.category_name}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800 dark:text-foreground">
                        {fmt(cat.revenue)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-100 dark:bg-muted rounded-full h-1.5">
                            <div
                              className="bg-[#22C55E] h-1.5 rounded-full"
                              style={{ width: `${cat.percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 dark:text-muted-foreground">
                            {cat.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground">{cat.orders}</td>
                    </tr>
                  ))}
                </ReportTable>
              </>
            ) : (
              <div className="py-12 text-center text-sm text-gray-500">No category data for this period</div>
            )}
          </TabsContent>

          <TabsContent value="tax" className="mt-6 space-y-4">
            {tabLoading ? (
              <ReportsLoadingState label="Loading tax report..." />
            ) : taxReportData ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <StatCard
                    label="Total Taxable Sales"
                    value={fmt(taxReportData.summary.total_taxable_sales)}
                  />
                  <StatCard
                    label="VAT Collected (13%)"
                    value={fmt(taxReportData.summary.total_vat_collected)}
                  />
                  <StatCard
                    label="Net VAT Payable"
                    value={fmt(taxReportData.summary.net_vat_payable)}
                  />
                </div>

                <div className={`${salesCardClass} p-5`}>
                  <h3 className={`${salesSectionTitleClass} mb-4`}>VAT Collected by Month</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={taxReportData.monthly_data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip formatter={(v) => [fmt(Number(v))]} />
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

                <ReportTable headers={["Period", "Taxable Sales", "VAT Rate", "VAT Collected", "Status"]}>
                  {taxReportData.monthly_data.map((row: any) => (
                    <tr
                      key={`${row.month}-${row.year}`}
                      className="hover:bg-gray-50/50 dark:hover:bg-muted/30"
                    >
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-foreground">
                        {row.month} {row.year}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground">
                        {fmt(row.taxable_sales)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground">
                        {row.vat_rate}%
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800 dark:text-foreground">
                        {fmt(row.vat_collected)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400">
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </ReportTable>
              </>
            ) : (
              <div className="py-12 text-center text-sm text-gray-500">No tax data for this period</div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </SalesPageShell>
  );
}
