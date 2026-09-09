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
import type { ExportTableData } from "@/lib/utils/export";

interface ValuationData {
  total_value: number;
  total_quantity: number;
  by_category?: Array<{
    category: string;
    value: number;
    quantity: number;
    avg_unit_cost: number;
  }>;
}

export default function StockValuationPage() {
  const [data, setData] = useState<ValuationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await reportsAPI.inventoryReports();
      if (result && result.summary) {
        setData({
          total_value: result.summary.total_value || 0,
          total_quantity: result.summary.total_quantity || 0,
          by_category: result.stock_data?.reduce(
            (acc: any[], item: any) => {
              const existing = acc.find((c) => c.category === item.category_name);
              const value = (item.quantity || 0) * (item.unit_cost || 0);
              if (existing) {
                existing.value += value;
                existing.quantity += item.quantity || 0;
              } else {
                acc.push({
                  category: item.category_name || "Uncategorized",
                  value,
                  quantity: item.quantity || 0,
                  avg_unit_cost: item.unit_cost || 0,
                });
              }
              return acc;
            },
            []
          ),
        });
      }
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { detail?: string } } };
      console.error("Failed to fetch stock valuation:", err);
      setError(apiErr.response?.data?.detail || "Failed to load stock valuation");
      toast.error("Failed to load stock valuation");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const stats = data
    ? [
        { label: "Total Stock Value", value: formatNPR(data.total_value) },
        { label: "Total Units", value: String(data.total_quantity) },
        {
          label: "Avg Unit Value",
          value: data.total_quantity > 0 ? formatNPR(data.total_value / data.total_quantity) : formatNPR(0),
        },
        {
          label: "Categories",
          value: String(data.by_category?.length || 0),
        },
      ]
    : [
        { label: "Total Stock Value", value: "Rs. 0" },
        { label: "Total Units", value: "0" },
        { label: "Avg Unit Value", value: "Rs. 0" },
        { label: "Categories", value: "0" },
      ];

  const chartData = data?.by_category?.slice(0, 8) || [];

  const getExportData = useCallback((): ExportTableData | null => {
    if (!data?.by_category?.length) return null;
    return {
      filename: "stock-valuation",
      title: "Stock Valuation Report",
      headers: ["Category", "Quantity", "Avg Unit Cost", "Total Value"],
      rows: data.by_category.map((cat) => [
        cat.category,
        String(cat.quantity),
        formatNPR(cat.avg_unit_cost),
        formatNPR(cat.value),
      ]),
    };
  }, [data]);

  return (
    <ReportsPageShell
      title="Stock Valuation"
      subtitle="Inventory value summary"
      loading={loading && !data}
      error={error}
      onRetry={() => void fetchData()}
      action={<ExportButtons getExportData={getExportData} disabled={loading} />}
    >
      {!data ? (
        <div className={`${reportsCardClass} p-12 text-center text-gray-500`}>
          No stock data available
        </div>
      ) : (
        <>
          <SummaryCards cards={stats} />

          {chartData.length > 0 && (
            <div className={`${reportsCardClass} p-6`}>
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">
                Valuation by Category
              </h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="category" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => formatNPR(Number(value))} />
                  <Bar dataKey="value" fill="#4A5D7A" name="Stock Value" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className={reportsTableWrapClass}>
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Stock by Category</h3>
            </div>
            {data.by_category && data.by_category.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {["Category", "Quantity", "Avg Unit Cost", "Total Value", "% of Total"].map((h) => (
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
                    {data.by_category.map((cat) => (
                      <tr key={cat.category} className="hover:bg-gray-50/50">
                        <td className="px-6 py-3 font-medium text-gray-900">{cat.category}</td>
                        <td className="px-6 py-3 text-gray-600">{cat.quantity}</td>
                        <td className="px-6 py-3 text-gray-600">{formatNPR(cat.avg_unit_cost)}</td>
                        <td className="px-6 py-3 font-medium">{formatNPR(cat.value)}</td>
                        <td className="px-6 py-3 text-gray-600">
                          {((cat.value / data.total_value) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-12 text-center text-gray-500">No category data</div>
            )}
          </div>
        </>
      )}
    </ReportsPageShell>
  );
}
