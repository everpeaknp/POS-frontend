"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExportButtons } from "@/components/reports/ExportButtons";
import {
  PurchasePageShell,
  purchaseCardClass,
  purchaseTableWrapClass,
  purchaseStatCardClass,
  purchaseFilterPillActive,
  purchaseFilterPillInactive,
  purchaseSectionTitleClass,
} from "@/components/dashboard/PurchasePageShell";
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
import { reportsAPI, type PurchaseReportsData } from "@/lib/api/reports";
import { formatNPR } from "@/lib/utils";
import toast from "react-hot-toast";
import type { ExportTableData } from "@/lib/utils/export";

const DATE_RANGES = ["This Week", "This Month", "This Quarter", "This Year"] as const;
const TAB_VALUES = [
  { value: "summary", label: "Purchase Summary" },
  { value: "supplier", label: "By Supplier" },
  { value: "product", label: "By Product" },
  { value: "tax", label: "Tax Report" },
] as const;

type TabValue = (typeof TAB_VALUES)[number]["value"];

const dateRangeMap: Record<(typeof DATE_RANGES)[number], "week" | "month" | "quarter" | "year"> = {
  "This Week": "week",
  "This Month": "month",
  "This Quarter": "quarter",
  "This Year": "year",
};

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
            value === r ? purchaseFilterPillActive : purchaseFilterPillInactive
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
    <div className={purchaseStatCardClass}>
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
    <div className={purchaseTableWrapClass}>
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

export default function PurchaseReportsPage() {
  const [activeTab, setActiveTab] = useState<TabValue>("summary");
  const [dateRange, setDateRange] = useState<(typeof DATE_RANGES)[number]>("This Month");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PurchaseReportsData | null>(null);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const reportData = await reportsAPI.purchaseReports({
        date_range: dateRangeMap[dateRange],
      });
      setData(reportData);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { detail?: string } } };
      console.error("Error loading purchase reports:", err);
      setError(apiErr.response?.data?.detail || "Failed to load purchase reports");
      toast.error("Failed to load purchase reports");
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const summary = data?.summary;
  const bySupplier = data?.by_supplier ?? [];
  const byProduct = data?.by_product ?? [];
  const taxReport = data?.tax_report;
  const monthlyTrend = data?.monthly_trend ?? [];

  const getExportData = useCallback((): ExportTableData | null => {
    if (!data) return null;
    const subtitle = `Period: ${dateRange}`;

    switch (activeTab) {
      case "supplier":
        if (!bySupplier.length) return null;
        return {
          filename: `purchase-by-supplier-${dateRange}`,
          title: "Purchases by Supplier",
          subtitle,
          headers: ["Supplier", "Orders", "Total Purchased", "Outstanding", "Status"],
          rows: bySupplier.map((s) => [
            s.supplier_name,
            String(s.orders),
            fmt(s.amount),
            fmt(s.outstanding),
            s.status,
          ]),
        };
      case "product":
        if (!byProduct.length) return null;
        return {
          filename: `purchase-by-product-${dateRange}`,
          title: "Purchases by Product",
          subtitle,
          headers: ["Product", "Unit", "Avg Price", "Qty Purchased", "Total Amount"],
          rows: byProduct.map((p) => [
            p.product_name,
            p.unit,
            formatNPR(p.avg_price),
            String(p.qty),
            fmt(p.amount),
          ]),
        };
      case "tax":
        if (!taxReport?.monthly_data?.length) return null;
        return {
          filename: `purchase-tax-${dateRange}`,
          title: "Purchase Tax Report",
          subtitle,
          headers: ["Period", "Taxable Purchases", "VAT Rate", "Input VAT", "Status"],
          rows: taxReport.monthly_data.map((row) => [
            row.month,
            fmt(row.taxable),
            "13%",
            fmt(row.vat),
            "Claimable",
          ]),
        };
      default:
        if (!monthlyTrend.length) return null;
        return {
          filename: `purchase-summary-${dateRange}`,
          title: "Purchase Summary",
          subtitle,
          headers: ["Month", "Orders", "Amount", "Paid", "Outstanding"],
          rows: monthlyTrend.map((row) => {
            const avgOrder = summary?.avg_order_value || 1;
            const paid = Math.floor(row.purchases * 0.88);
            const outstanding = Math.floor(row.purchases * 0.12);
            return [
              row.month,
              String(Math.floor(row.purchases / avgOrder)),
              fmt(row.purchases),
              fmt(paid),
              fmt(outstanding),
            ];
          }),
        };
    }
  }, [data, activeTab, dateRange, bySupplier, byProduct, taxReport, monthlyTrend, summary]);

  return (
    <PurchasePageShell
      title="Purchase Reports"
      subtitle="Analytics and spending insights across suppliers and products"
      loading={loading && !data}
      error={error}
      onRetry={loadReports}
      toolbar={<DateRangeFilter value={dateRange} onChange={(v) => setDateRange(v as typeof dateRange)} />}
      action={<ExportButtons getExportData={getExportData} disabled={loading} />}
    >
      {data && (
        <div className={`${purchaseCardClass} p-4 lg:p-5`}>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto gap-1">
              {TAB_VALUES.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="text-xs sm:text-sm">
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="summary" className="mt-6 space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  label="Total Purchases"
                  value={fmt(summary?.total_purchases ?? 0)}
                  hint={`${summary?.total_orders ?? 0} orders`}
                />
                <StatCard
                  label="Total Orders"
                  value={String(summary?.total_orders ?? 0)}
                  hint="Purchase invoices"
                />
                <StatCard
                  label="Avg Order Value"
                  value={fmt(summary?.avg_order_value ?? 0)}
                  hint="Per transaction"
                />
                <StatCard
                  label="Total Paid"
                  value={fmt(summary?.total_paid ?? 0)}
                  hint={`${summary?.payment_rate_percentage ?? 0}% payment rate`}
                />
              </div>

              <div className={`${purchaseCardClass} p-5`}>
                <h3 className={`${purchaseSectionTitleClass} mb-4`}>Monthly Purchase Trend</h3>
                {monthlyTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickFormatter={(v) => `${(Number(v) / 1000).toFixed(0)}k`}
                      />
                      <Tooltip formatter={(v) => [fmt(Number(v)), "Purchases"]} />
                      <Line
                        type="monotone"
                        dataKey="purchases"
                        stroke="#22C55E"
                        strokeWidth={2.5}
                        dot={{ fill: "#22C55E", r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[260px] flex items-center justify-center text-sm text-gray-400">
                    No trend data for this period
                  </div>
                )}
              </div>

              <ReportTable
                headers={["Month", "Orders", "Amount", "Paid", "Outstanding"]}
                title="Monthly Breakdown"
              >
                {monthlyTrend.length > 0 ? (
                  monthlyTrend.map((row) => {
                    const avgOrder = summary?.avg_order_value || 1;
                    const paid = Math.floor(row.purchases * 0.88);
                    const outstanding = Math.floor(row.purchases * 0.12);
                    return (
                      <tr key={row.month} className="hover:bg-gray-50/50 dark:hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium text-gray-800 dark:text-foreground">
                          {row.month}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground">
                          {Math.floor(row.purchases / avgOrder)}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-800 dark:text-foreground">
                          {fmt(row.purchases)}
                        </td>
                        <td className="px-4 py-3 text-[#22C55E] font-medium">{fmt(paid)}</td>
                        <td className="px-4 py-3 text-red-500">{fmt(outstanding)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                      No monthly data for this period
                    </td>
                  </tr>
                )}
              </ReportTable>
            </TabsContent>

            <TabsContent value="supplier" className="mt-6 space-y-4">
              <div className={`${purchaseCardClass} p-5`}>
                <h3 className={`${purchaseSectionTitleClass} mb-4`}>Purchases by Supplier</h3>
                {bySupplier.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={bySupplier}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="supplier_name" tick={{ fontSize: 12 }} />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickFormatter={(v) => `${(Number(v) / 1000).toFixed(0)}k`}
                      />
                      <Tooltip formatter={(v) => [fmt(Number(v)), "Amount"]} />
                      <Bar dataKey="amount" fill="#22C55E" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[260px] flex items-center justify-center text-sm text-gray-400">
                    No supplier data for this period
                  </div>
                )}
              </div>

              <ReportTable headers={["Supplier", "Orders", "Total Purchased", "Outstanding", "Status"]}>
                {bySupplier.length > 0 ? (
                  bySupplier.map((s) => (
                    <tr key={s.supplier_id} className="hover:bg-gray-50/50 dark:hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-foreground">
                        {s.supplier_name}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground">{s.orders}</td>
                      <td className="px-4 py-3 font-semibold text-gray-800 dark:text-foreground">
                        {fmt(s.amount)}
                      </td>
                      <td className="px-4 py-3 text-red-500 font-medium">{fmt(s.outstanding)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            s.status === "active"
                              ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                              : "bg-gray-100 text-gray-500 dark:bg-muted dark:text-muted-foreground"
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                      No supplier data for this period
                    </td>
                  </tr>
                )}
              </ReportTable>
            </TabsContent>

            <TabsContent value="product" className="mt-6 space-y-4">
              <div className={`${purchaseCardClass} p-5`}>
                <h3 className={`${purchaseSectionTitleClass} mb-4`}>Purchases by Product</h3>
                {byProduct.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={byProduct}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="product_name" tick={{ fontSize: 10 }} />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickFormatter={(v) => `${(Number(v) / 1000).toFixed(0)}k`}
                      />
                      <Tooltip formatter={(v) => [fmt(Number(v))]} />
                      <Legend />
                      <Bar dataKey="amount" name="Amount" fill="#22C55E" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="qty" name="Qty" fill="#86EFAC" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[260px] flex items-center justify-center text-sm text-gray-400">
                    No product data for this period
                  </div>
                )}
              </div>

              <ReportTable headers={["Product", "Unit", "Avg Price", "Qty Purchased", "Total Amount"]}>
                {byProduct.length > 0 ? (
                  byProduct.map((p) => (
                    <tr key={p.product_id} className="hover:bg-gray-50/50 dark:hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-foreground">
                        {p.product_name}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground">{p.unit}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground">
                        {formatNPR(p.avg_price)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground">{p.qty}</td>
                      <td className="px-4 py-3 font-semibold text-gray-800 dark:text-foreground">
                        {fmt(p.amount)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                      No product data for this period
                    </td>
                  </tr>
                )}
              </ReportTable>
            </TabsContent>

            <TabsContent value="tax" className="mt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                  label="Total Taxable Purchases"
                  value={fmt(taxReport?.total_taxable ?? 0)}
                />
                <StatCard label="Input VAT (13%)" value={fmt(taxReport?.total_vat ?? 0)} />
                <StatCard label="Net VAT Claimable" value={fmt(taxReport?.total_vat ?? 0)} />
              </div>

              <div className={`${purchaseCardClass} p-5`}>
                <h3 className={`${purchaseSectionTitleClass} mb-4`}>Input VAT by Month</h3>
                {(taxReport?.monthly_data?.length ?? 0) > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={taxReport?.monthly_data ?? []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickFormatter={(v) => `${(Number(v) / 1000).toFixed(0)}k`}
                      />
                      <Tooltip formatter={(v) => [fmt(Number(v))]} />
                      <Legend />
                      <Bar
                        dataKey="taxable"
                        name="Taxable Purchases"
                        fill="#86EFAC"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="vat"
                        name="Input VAT (13%)"
                        fill="#22C55E"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[260px] flex items-center justify-center text-sm text-gray-400">
                    No tax data for this period
                  </div>
                )}
              </div>

              <ReportTable headers={["Period", "Taxable Purchases", "VAT Rate", "Input VAT", "Status"]}>
                {(taxReport?.monthly_data?.length ?? 0) > 0 ? (
                  taxReport!.monthly_data.map((row) => (
                    <tr key={row.month} className="hover:bg-gray-50/50 dark:hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-foreground">
                        {row.month}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground">
                        {fmt(row.taxable)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground">13%</td>
                      <td className="px-4 py-3 font-semibold text-gray-800 dark:text-foreground">
                        {fmt(row.vat)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400">
                          Claimable
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                      No tax data for this period
                    </td>
                  </tr>
                )}
              </ReportTable>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </PurchasePageShell>
  );
}
