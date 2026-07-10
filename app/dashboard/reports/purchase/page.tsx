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
import { reportsAPI, type PurchaseReportsData } from "@/lib/api/reports";
import { formatNPR } from "@/lib/utils";
import toast from "react-hot-toast";
import type { ExportTableData } from "@/lib/utils/export";

type PurchasePeriod = "week" | "month" | "quarter" | "year";

export default function PurchaseReportPage() {
  const [period, setPeriod] = useState<PurchasePeriod>("month");
  const [reportData, setReportData] = useState<PurchaseReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (range: PurchasePeriod) => {
    setLoading(true);
    setError(null);
    try {
      const result = await reportsAPI.purchaseReports({ date_range: range });
      setReportData(result);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { detail?: string } } };
      console.error("Failed to fetch purchase reports:", err);
      setError(apiErr.response?.data?.detail || "Failed to load purchase reports");
      toast.error("Failed to load purchase reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData("month");
  }, [fetchData]);

  const stats = reportData
    ? [
        {
          label: "Total Purchases",
          value: formatNPR(reportData.summary.total_purchases),
        },
        {
          label: "Total POs",
          value: String(reportData.summary.total_orders),
        },
        {
          label: "Avg PO Value",
          value: formatNPR(reportData.summary.avg_order_value),
        },
        {
          label: "Payment Rate",
          value: `${Number(reportData.summary.payment_rate_percentage ?? 0).toFixed(1)}%`,
        },
      ]
    : [
        { label: "Total Purchases", value: "Rs. 0" },
        { label: "Total POs", value: "0" },
        { label: "Avg PO Value", value: "Rs. 0" },
        { label: "Payment Rate", value: "0%" },
      ];

  const getExportData = useCallback((): ExportTableData | null => {
    if (!reportData?.by_supplier?.length) return null;
    return {
      filename: `purchase-report-${period}`,
      title: "Purchase Report",
      subtitle: `Period: ${period}`,
      headers: ["Rank", "Supplier", "Orders", "Total", "Outstanding", "Status"],
      rows: reportData.by_supplier.map((supplier, index) => [
        String(index + 1),
        supplier.supplier_name,
        String(supplier.orders),
        formatNPR(supplier.amount),
        formatNPR(supplier.outstanding),
        supplier.status,
      ]),
    };
  }, [reportData, period]);

  return (
    <ReportsPageShell
      title="Purchase Report"
      subtitle="Purchase history and analysis"
      loading={loading && !reportData}
      error={error}
      onRetry={() => void fetchData(period)}
      toolbar={
        <ReportFilter
          embedded
          period={period}
          onPeriodChange={(p) => setPeriod(p as PurchasePeriod)}
          onGenerate={() => void fetchData(period)}
          showDateInputs={false}
          loading={loading}
        />
      }
      action={<ExportButtons getExportData={getExportData} disabled={loading} />}
    >
      {!reportData ? (
        <div className={`${reportsCardClass} p-12 text-center text-gray-500`}>
          No purchase data for the selected period
        </div>
      ) : (
        <>
          <SummaryCards cards={stats} />

          <div className={`${reportsCardClass} p-6`}>
            <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">
              Purchase Trend
            </h3>
            {reportData.monthly_trend.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={reportData.monthly_trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => formatNPR(Number(value ?? 0))} />
                  <Line
                    type="monotone"
                    dataKey="purchases"
                    stroke="#22C55E"
                    strokeWidth={2}
                    dot={{ fill: "#22C55E" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[320px] flex items-center justify-center text-sm text-gray-400">
                No trend data available
              </div>
            )}
          </div>

          <div className={reportsTableWrapClass}>
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Top Suppliers</h3>
            </div>
            {reportData.by_supplier.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {["Rank", "Supplier", "Orders", "Total", "Outstanding", "Status"].map(
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
                    {reportData.by_supplier.map((supplier, index) => (
                      <tr key={supplier.supplier_id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-3 font-medium">{index + 1}</td>
                        <td className="px-6 py-3 font-medium text-gray-900">
                          {supplier.supplier_name}
                        </td>
                        <td className="px-6 py-3 text-gray-600">{supplier.orders}</td>
                        <td className="px-6 py-3 font-medium">
                          {formatNPR(supplier.amount)}
                        </td>
                        <td className="px-6 py-3 text-gray-600">
                          {formatNPR(supplier.outstanding)}
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              supplier.status === "active"
                                ? "bg-green-50 text-green-700"
                                : "bg-gray-50 text-gray-700"
                            }`}
                          >
                            {supplier.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-12 text-center text-gray-500">No supplier data</div>
            )}
          </div>

          <div className={reportsTableWrapClass}>
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Purchase by Product</h3>
            </div>
            {reportData.by_product.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {["Product", "Qty", "Unit", "Total", "Avg Price"].map((h) => (
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
                    {reportData.by_product.map((product) => (
                      <tr key={product.product_id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-3 font-medium text-gray-900">
                          {product.product_name}
                        </td>
                        <td className="px-6 py-3 text-gray-600">{product.qty}</td>
                        <td className="px-6 py-3 text-gray-600">{product.unit}</td>
                        <td className="px-6 py-3 font-medium">
                          {formatNPR(product.amount)}
                        </td>
                        <td className="px-6 py-3 text-gray-600">
                          {formatNPR(product.avg_price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-12 text-center text-gray-500">No product data</div>
            )}
          </div>

          <div className={reportsCardClass}>
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">VAT Summary (13%)</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Total Taxable</p>
                  <p className="text-lg font-semibold">
                    {formatNPR(reportData.tax_report.total_taxable)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Total VAT</p>
                  <p className="text-lg font-semibold">
                    {formatNPR(reportData.tax_report.total_vat)}
                  </p>
                </div>
              </div>
              {reportData.tax_report.monthly_data.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {["Month", "Taxable", "VAT"].map((h) => (
                          <th
                            key={h}
                            className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {reportData.tax_report.monthly_data.map((item) => (
                        <tr key={item.month}>
                          <td className="px-6 py-3 font-medium">{item.month}</td>
                          <td className="px-6 py-3">{formatNPR(item.taxable)}</td>
                          <td className="px-6 py-3 font-medium">{formatNPR(item.vat)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </ReportsPageShell>
  );
}
