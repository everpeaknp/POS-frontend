"use client";

import { useState, useCallback } from "react";
import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashHeader } from "@/components/dashboard/dash-header";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useApi } from "@/lib/hooks/useApi";
import { inventoryApi } from "@/lib/api/inventory";
import { formatNPR } from "@/lib/utils";
import { SkeletonCard, SkeletonTable } from "@/components/shared/Skeleton";
import { exportTableAsCsv, exportTableAsPdf, type ExportTableData } from "@/lib/utils/export";
import toast from "react-hot-toast";

const TABS = ["Stock Summary", "Low Stock", "Valuation", "Movement"];

export default function InventoryReportsPage() {
  const [tab, setTab] = useState("Stock Summary");
  const [movementStartDate, setMovementStartDate] = useState("");
  const [movementEndDate, setMovementEndDate] = useState("");

  // Fetch data for each tab
  const { data: stockSummaryData, loading: loadingSummary } = useApi(
    () => inventoryApi.reports.stockSummary(),
    { immediate: tab === "Stock Summary" }
  );

  const { data: lowStockData, loading: loadingLowStock } = useApi(
    () => inventoryApi.reports.lowStock(),
    { immediate: tab === "Low Stock" }
  );

  const { data: valuationData, loading: loadingValuation } = useApi(
    () => inventoryApi.reports.valuation(),
    { immediate: tab === "Valuation" }
  );

  const { data: movementData, loading: loadingMovement, refetch: refetchMovement } = useApi(
    () => inventoryApi.reports.movement({
      start_date: movementStartDate || undefined,
      end_date: movementEndDate || undefined,
    }),
    { immediate: tab === "Movement", deps: [tab, movementStartDate, movementEndDate] }
  );

  const summary = stockSummaryData?.data?.summary || { total_products: 0, total_units: 0, low_stock: 0, out_of_stock: 0 };
  const stockData = stockSummaryData?.data?.stock_data || [];
  const lowStockItems = lowStockData?.data?.items || [];
  const valuationItems = valuationData?.data?.items || [];
  const valuationSummary = valuationData?.data?.summary || { total_cost_value: 0, total_sale_value: 0, potential_profit: 0 };
  const valuationChartData = valuationData?.data?.valuation_data || [];
  const movementItems = movementData?.data?.items || [];

  const getExportData = useCallback((): ExportTableData | null => {
    if (tab === "Low Stock") {
      if (!lowStockItems.length) return null;
      return {
        filename: "inventory-low-stock",
        title: "Low Stock Report",
        headers: ["Product", "SKU", "Current", "Reorder", "Shortage", "Status"],
        rows: lowStockItems.map((item: any) => [
          item.name,
          item.sku,
          `${item.current_stock} ${item.unit}`,
          String(item.reorder_level),
          String(item.shortage),
          item.status,
        ]),
      };
    }
    if (tab === "Valuation") {
      if (!valuationItems.length) return null;
      return {
        filename: "inventory-valuation",
        title: "Inventory Valuation Report",
        headers: ["Product", "SKU", "Stock", "Cost", "Sale Price", "Cost Value"],
        rows: valuationItems.map((item: any) => [
          item.name,
          item.sku,
          `${item.stock} ${item.unit}`,
          formatNPR(item.cost_price),
          formatNPR(item.selling_price),
          formatNPR(item.total_cost_value),
        ]),
      };
    }
    if (tab === "Movement") {
      if (!movementItems.length) return null;
      return {
        filename: "inventory-movement",
        title: "Stock Movement Report",
        headers: ["Product", "Category", "Opening", "In", "Out", "Closing"],
        rows: movementItems.map((item: any) => [
          item.name,
          item.category || "-",
          String(Math.round(item.opening)),
          String(Math.round(item.in)),
          String(Math.round(item.out)),
          String(Math.round(item.closing)),
        ]),
      };
    }
    if (!stockData.length) return null;
    return {
      filename: "inventory-stock-summary",
      title: "Stock Summary Report",
      headers: ["Product", "Stock"],
      rows: stockData.map((item: any) => [item.name, String(Math.round(item.stock))]),
    };
  }, [tab, stockData, lowStockItems, valuationItems, movementItems]);

  const runExport = (format: "csv" | "pdf") => {
    const data = getExportData();
    if (!data || data.rows.length === 0) {
      toast.error("No data to export");
      return;
    }
    try {
      if (format === "csv") {
        exportTableAsCsv(data);
        toast.success("CSV exported");
      } else {
        exportTableAsPdf(data);
        toast.success("Print dialog opened — choose Save as PDF as the destination");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to export");
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Inventory Reports" subtitle="Stock analytics and valuation" />
      <div className="flex-1 p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                {t}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-gray-600 border-gray-200" onClick={() => runExport("pdf")}>
            <FileText className="h-3.5 w-3.5" /> Export PDF
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-gray-600 border-gray-200" onClick={() => runExport("csv")}>
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
        </div>

        {tab === "Stock Summary" && (
          <div className="space-y-4">
            {loadingSummary ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
                <SkeletonCard />
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: "Total Products", value: summary.total_products },
                    { label: "Total Units", value: Math.round(summary.total_units) },
                    { label: "Low Stock", value: summary.low_stock },
                    { label: "Out of Stock", value: summary.out_of_stock },
                  ].map((s) => (
                    <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                      <p className="text-xs text-gray-500">{s.label}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Stock by Product</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={stockData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="stock" fill="#22C55E" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>
        )}

        {tab === "Low Stock" && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {loadingLowStock ? (
              <SkeletonTable rows={5} />
            ) : lowStockItems.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <p className="text-sm">No low stock items found</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>{["Product", "SKU", "Current Stock", "Reorder Level", "Shortage", "Status"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {lowStockItems.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.sku}</td>
                      <td className="px-4 py-3 font-semibold text-red-500">{Math.round(p.current_stock)}</td>
                      <td className="px-4 py-3 text-gray-600">{Math.round(p.reorder_level)}</td>
                      <td className="px-4 py-3 text-orange-600 font-medium">{Math.round(p.shortage)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.current_stock === 0 ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === "Valuation" && (
          <div className="space-y-4">
            {loadingValuation ? (
              <>
                <SkeletonCard />
                <SkeletonTable rows={5} />
              </>
            ) : (
              <>
                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Inventory Value by Product</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={valuationChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v) => [`Rs. ${Number(v).toLocaleString()}`, "Value"]} />
                      <Bar dataKey="value" fill="#22C55E" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>{["Product", "Stock", "Cost Price", "Total Value", "Sale Value"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {valuationItems.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                          <td className="px-4 py-3 text-gray-600">{Math.round(p.stock)}</td>
                          <td className="px-4 py-3 text-gray-600">Rs. {p.cost_price.toLocaleString()}</td>
                          <td className="px-4 py-3 font-semibold text-gray-800">Rs. {Math.round(p.total_cost_value).toLocaleString()}</td>
                          <td className="px-4 py-3 text-[#22C55E] font-semibold">Rs. {Math.round(p.total_sale_value).toLocaleString()}</td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 font-bold">
                        <td className="px-4 py-3 text-gray-700" colSpan={3}>Total</td>
                        <td className="px-4 py-3 text-gray-900">Rs. {Math.round(valuationSummary.total_cost_value).toLocaleString()}</td>
                        <td className="px-4 py-3 text-[#22C55E]">Rs. {Math.round(valuationSummary.total_sale_value).toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {tab === "Movement" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-end gap-3 bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Start date</label>
                <input
                  type="date"
                  value={movementStartDate}
                  onChange={(e) => setMovementStartDate(e.target.value)}
                  className="h-9 rounded-md border border-gray-200 px-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">End date</label>
                <input
                  type="date"
                  value={movementEndDate}
                  onChange={(e) => setMovementEndDate(e.target.value)}
                  className="h-9 rounded-md border border-gray-200 px-3 text-sm"
                />
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-9"
                onClick={() => refetchMovement()}
              >
                Apply
              </Button>
            </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {loadingMovement ? (
              <SkeletonTable rows={5} />
            ) : movementItems.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <p className="text-sm">No movement data available</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>{["Product", "Category", "Opening", "In", "Out", "Closing"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {movementItems.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                      <td className="px-4 py-3 text-gray-600">{p.category || '-'}</td>
                      <td className="px-4 py-3 text-gray-600">{Math.round(p.opening)}</td>
                      <td className="px-4 py-3 text-green-600 font-medium">+{Math.round(p.in)}</td>
                      <td className="px-4 py-3 text-red-500 font-medium">-{Math.round(p.out)}</td>
                      <td className="px-4 py-3 font-semibold text-gray-800">{Math.round(p.closing)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          </div>
        )}
      </div>
    </div>
  );
}
