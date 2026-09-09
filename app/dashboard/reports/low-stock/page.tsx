"use client";

import { useState, useEffect, useCallback } from "react";
import { ExportButtons } from "@/components/reports/ExportButtons";
import { SummaryCards } from "@/components/reports/SummaryCards";
import {
  ReportsPageShell,
  reportsTableWrapClass,
} from "@/components/reports/ReportsPageShell";
import { reportsAPI } from "@/lib/api/reports";
import toast from "react-hot-toast";
import type { ExportTableData } from "@/lib/utils/export";

type LowStock = Awaited<ReturnType<typeof reportsAPI.inventoryLowStock>>;

export default function LowStockAlertReportPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lowStock, setLowStock] = useState<LowStock | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reportsAPI.inventoryLowStock();
      setLowStock(data);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { detail?: string } } };
      console.error("Failed to fetch low stock:", err);
      setError(apiErr.response?.data?.detail || "Failed to load low stock alerts");
      toast.error("Failed to load low stock alerts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const criticalCount = lowStock?.items.filter(item => item.status === "Out of Stock").length ?? 0;
  const lowCount = (lowStock?.total_count ?? 0) - criticalCount;

  const stats = [
    { label: "Total Alerts", value: String(lowStock?.total_count ?? 0) },
    { label: "Out of Stock", value: String(criticalCount) },
    { label: "Low Stock", value: String(lowCount) },
    { label: "Action Required", value: criticalCount > 0 ? "Yes" : "No" },
  ];

  const getExportData = useCallback((): ExportTableData | null => {
    if (!lowStock?.items?.length) return null;
    return {
      filename: "low-stock-alert",
      title: "Low Stock Alert Report",
      subtitle: `Generated on ${new Date().toLocaleDateString()}`,
      headers: ["Product", "SKU", "Current Stock", "Reorder Level", "Shortage", "Status"],
      rows: lowStock.items.map((item) => [
        item.name,
        item.sku,
        `${item.current_stock} ${item.unit}`,
        String(item.reorder_level),
        String(item.shortage),
        item.status,
      ]),
    };
  }, [lowStock]);

  return (
    <ReportsPageShell
      title="Low Stock Alert"
      subtitle="Products below reorder level"
      loading={loading && !lowStock}
      error={error}
      onRetry={fetchData}
      action={<ExportButtons getExportData={getExportData} disabled={loading} />}
    >
      <SummaryCards cards={stats} />

      <div className={reportsTableWrapClass}>
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-900">Low Stock Items</h3>
          {lowStock && lowStock.total_count > 0 && (
            <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
              {lowStock.total_count} items need attention
            </span>
          )}
        </div>
        {lowStock && lowStock.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {[
                    "Product",
                    "SKU",
                    "Category",
                    "Current Stock",
                    "Reorder Level",
                    "Shortage",
                    "Status",
                  ].map((h) => (
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
                {lowStock.items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3 font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-6 py-3 font-mono text-xs text-gray-600">
                      {item.sku}
                    </td>
                    <td className="px-6 py-3 text-gray-600 text-xs">
                      {item.category || 'Uncategorized'}
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {item.current_stock} {item.unit}
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {item.reorder_level} {item.unit}
                    </td>
                    <td className="px-6 py-3 font-medium text-red-600">
                      {item.shortage} {item.unit}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          item.status === "Out of Stock"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
              <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">All Stock Levels Good</h3>
            <p className="text-sm text-gray-500">
              All products are adequately stocked above reorder levels
            </p>
          </div>
        )}
      </div>
    </ReportsPageShell>
  );
}
