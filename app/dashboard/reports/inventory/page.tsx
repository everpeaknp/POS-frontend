"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExportButtons } from "@/components/reports/ExportButtons";
import { SummaryCards } from "@/components/reports/SummaryCards";
import {
  ReportsPageShell,
  reportsCardClass,
  reportsTableWrapClass,
} from "@/components/reports/ReportsPageShell";
import { inventoryApi } from "@/lib/api/inventory";
import { formatNPR } from "@/lib/utils";
import toast from "react-hot-toast";
import type { ExportTableData } from "@/lib/utils/export";

type StockSummary = Awaited<
  ReturnType<typeof inventoryApi.reports.stockSummary>
>["data"];
type LowStock = Awaited<ReturnType<typeof inventoryApi.reports.lowStock>>["data"];
type Valuation = Awaited<ReturnType<typeof inventoryApi.reports.valuation>>["data"];

export default function InventoryReportPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<StockSummary | null>(null);
  const [lowStock, setLowStock] = useState<LowStock | null>(null);
  const [valuation, setValuation] = useState<Valuation | null>(null);
  const [activeTab, setActiveTab] = useState("stock");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [stockRes, lowRes, valRes] = await Promise.all([
        inventoryApi.reports.stockSummary(),
        inventoryApi.reports.lowStock(),
        inventoryApi.reports.valuation(),
      ]);
      setSummary(stockRes.data);
      setLowStock(lowRes.data);
      setValuation(valRes.data);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { detail?: string } } };
      console.error("Failed to fetch inventory reports:", err);
      setError(apiErr.response?.data?.detail || "Failed to load inventory reports");
      toast.error("Failed to load inventory reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = summary
    ? [
        { label: "Total Products", value: String(summary.summary.total_products) },
        {
          label: "Total Units",
          value: Math.round(summary.summary.total_units).toLocaleString(),
        },
        { label: "Low Stock", value: String(summary.summary.low_stock) },
        { label: "Out of Stock", value: String(summary.summary.out_of_stock) },
      ]
    : [];

  const valuationStats = valuation
    ? [
        { label: "Cost Value", value: formatNPR(valuation.summary.total_cost_value) },
        { label: "Sale Value", value: formatNPR(valuation.summary.total_sale_value) },
        {
          label: "Potential Profit",
          value: formatNPR(valuation.summary.potential_profit),
        },
        { label: "SKUs Valued", value: String(valuation.items.length) },
      ]
    : [];

  const getExportData = useCallback((): ExportTableData | null => {
    if (activeTab === "low") {
      if (!lowStock?.items?.length) return null;
      return {
        filename: "inventory-low-stock",
        title: "Low Stock Report",
        headers: ["Product", "SKU", "Current", "Reorder", "Shortage", "Status"],
        rows: lowStock.items.map((item) => [
          item.name,
          item.sku,
          `${item.current_stock} ${item.unit}`,
          String(item.reorder_level),
          String(item.shortage),
          item.status,
        ]),
      };
    }
    if (activeTab === "valuation") {
      if (!valuation?.items?.length) return null;
      return {
        filename: "inventory-valuation",
        title: "Inventory Valuation Report",
        headers: ["Product", "SKU", "Stock", "Cost", "Sale Price", "Cost Value"],
        rows: valuation.items.map((item) => [
          item.name,
          item.sku,
          `${item.stock} ${item.unit}`,
          formatNPR(item.cost_price),
          formatNPR(item.selling_price),
          formatNPR(item.total_cost_value),
        ]),
      };
    }
    if (!summary?.stock_data?.length) return null;
    return {
      filename: "inventory-stock-overview",
      title: "Stock Overview Report",
      headers: ["Product", "Stock", "Status"],
      rows: summary.stock_data.map((product) => [
        product.name,
        `${Math.round(product.stock)} units`,
        product.stock > 50 ? "Good" : product.stock > 10 ? "Low" : "Critical",
      ]),
    };
  }, [activeTab, summary, lowStock, valuation]);

  return (
    <ReportsPageShell
      title="Inventory Report"
      subtitle="Stock levels, alerts, and valuation"
      loading={loading && !summary}
      error={error}
      onRetry={fetchData}
      action={<ExportButtons getExportData={getExportData} disabled={loading} />}
    >
      {summary && (
        <>
          <SummaryCards cards={stats} />

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className={`${reportsCardClass} p-2`}>
              <TabsList className="grid w-full max-w-lg grid-cols-3">
                <TabsTrigger value="stock">Stock Overview</TabsTrigger>
                <TabsTrigger value="low">Low Stock</TabsTrigger>
                <TabsTrigger value="valuation">Valuation</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="stock" className="space-y-4 mt-4">
              <div className={`${reportsCardClass} p-6`}>
                <h3 className="text-sm font-semibold text-gray-700 mb-4">
                  Top Products by Stock
                </h3>
                {summary.stock_data.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={summary.stock_data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="stock" fill="#22C55E" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-sm text-gray-400">
                    No stock data yet
                  </div>
                )}
              </div>

              <div className={reportsTableWrapClass}>
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">Stock by SKU</h3>
                </div>
                {summary.stock_data.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {["SKU", "Units", "Status"].map((h) => (
                          <th
                            key={h}
                            className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {summary.stock_data.map((product) => (
                        <tr key={product.name} className="hover:bg-gray-50/50">
                          <td className="px-6 py-3 font-mono text-xs text-gray-700">
                            {product.name}
                          </td>
                          <td className="px-6 py-3 text-gray-600">
                            {Math.round(product.stock)} units
                          </td>
                          <td className="px-6 py-3">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                product.stock > 50
                                  ? "bg-green-100 text-green-700"
                                  : product.stock > 10
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-red-100 text-red-700"
                              }`}
                            >
                              {product.stock > 50
                                ? "Good"
                                : product.stock > 10
                                  ? "Low"
                                  : "Critical"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-12 text-center text-gray-500">No stock records</div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="low" className="space-y-4 mt-4">
              <div className={reportsTableWrapClass}>
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-gray-900">Low Stock Alerts</h3>
                  <span className="text-xs text-gray-500">
                    {lowStock?.total_count ?? 0} items
                  </span>
                </div>
                {lowStock && lowStock.items.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          {[
                            "Product",
                            "SKU",
                            "Current",
                            "Reorder",
                            "Shortage",
                            "Status",
                          ].map((h) => (
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
                        {lowStock.items.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50/50">
                            <td className="px-6 py-3 font-medium text-gray-900">
                              {item.name}
                            </td>
                            <td className="px-6 py-3 font-mono text-xs text-gray-600">
                              {item.sku}
                            </td>
                            <td className="px-6 py-3 text-gray-600">
                              {item.current_stock} {item.unit}
                            </td>
                            <td className="px-6 py-3 text-gray-600">
                              {item.reorder_level}
                            </td>
                            <td className="px-6 py-3 text-gray-600">{item.shortage}</td>
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
                  <div className="p-12 text-center text-gray-500">
                    All products are adequately stocked
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="valuation" className="space-y-4 mt-4">
              {valuation && <SummaryCards cards={valuationStats} />}

              <div className={`${reportsCardClass} p-6`}>
                <h3 className="text-sm font-semibold text-gray-700 mb-4">
                  Valuation by SKU (Top 10)
                </h3>
                {valuation && valuation.valuation_data.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={valuation.valuation_data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => formatNPR(Number(v ?? 0))} />
                      <Bar dataKey="value" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-sm text-gray-400">
                    No valuation data
                  </div>
                )}
              </div>

              <div className={reportsTableWrapClass}>
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">Inventory Valuation</h3>
                </div>
                {valuation && valuation.items.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          {[
                            "Product",
                            "SKU",
                            "Stock",
                            "Cost",
                            "Sale Price",
                            "Cost Value",
                          ].map((h) => (
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
                        {valuation.items.slice(0, 50).map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50/50">
                            <td className="px-6 py-3 font-medium text-gray-900">
                              {item.name}
                            </td>
                            <td className="px-6 py-3 font-mono text-xs">{item.sku}</td>
                            <td className="px-6 py-3 text-gray-600">
                              {item.stock} {item.unit}
                            </td>
                            <td className="px-6 py-3">{formatNPR(item.cost_price)}</td>
                            <td className="px-6 py-3">{formatNPR(item.selling_price)}</td>
                            <td className="px-6 py-3 font-medium">
                              {formatNPR(item.total_cost_value)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-12 text-center text-gray-500">No valued inventory</div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </ReportsPageShell>
  );
}
