"use client";

import { useState, useEffect, useCallback } from "react";
import { reportsAPI } from "@/lib/api/reports";
import { ReportsPageShell, reportsCardClass, reportsTableWrapClass } from "@/components/reports/ReportsPageShell";
import { SummaryCards } from "@/components/reports/SummaryCards";
import { ExportButtons } from "@/components/reports/ExportButtons";
import { formatNPR } from "@/lib/utils";
import toast from "react-hot-toast";
import type { ExportTableData } from "@/lib/utils/export";
import { PrintableReport } from "@/components/reports/PrintableReport";

interface ItemSales {
  product_id: string;
  product_name: string;
  qty: number;
  unit: string;
  amount: number;
  avg_price: number;
}

export default function ItemSalesPage() {
  const [sales, setSales] = useState<ItemSales[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await reportsAPI.salesByProduct();
      setSales(result?.sales_by_product || []);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { detail?: string } } };
      console.error("Failed to fetch item sales:", err);
      setError(apiErr.response?.data?.detail || "Failed to load item sales");
      toast.error("Failed to load item sales");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const stats = [
    { label: "Total Items Sold", value: String(sales.length) },
    { label: "Total Quantity", value: String(sales.reduce((sum, s) => sum + s.qty, 0)) },
    { label: "Total Revenue", value: formatNPR(sales.reduce((sum, s) => sum + s.amount, 0)) },
    {
      label: "Avg Item Revenue",
      value: sales.length > 0 ? formatNPR(sales.reduce((sum, s) => sum + s.amount, 0) / sales.length) : formatNPR(0),
    },
  ];

  const topSales = sales.sort((a, b) => b.amount - a.amount).slice(0, 10);

  const getExportData = useCallback((): ExportTableData | null => {
    if (!sales.length) return null;
    return {
      filename: "item-sales",
      title: "Item-wise Sales Report",
      headers: ["Product", "Quantity", "Unit", "Total Sales", "Avg Price"],
      rows: sales.map((item) => [
        item.product_name,
        String(item.qty),
        item.unit,
        formatNPR(item.amount),
        formatNPR(item.avg_price),
      ]),
    };
  }, [sales]);

  return (
    <ReportsPageShell
      title="Item-wise Sales"
      subtitle="Sales breakdown by product"
      loading={loading && !sales.length}
      error={error}
      onRetry={() => void fetchData()}
      action={<ExportButtons getExportData={getExportData} disabled={loading} />}
    >
      {!sales.length ? (
        <div className={`${reportsCardClass} p-12 text-center text-gray-500`}>
          No sales data available
        </div>
      ) : (
        <>
          <SummaryCards cards={stats} />

          <div className={reportsTableWrapClass}>
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Top 10 Items by Sales</h3>
            </div>
            {topSales.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {["Rank", "Product", "Quantity", "Unit", "Total Sales", "Avg Price", "% of Total"].map((h) => (
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
                    {topSales.map((item, idx) => {
                      const totalRevenue = sales.reduce((sum, s) => sum + s.amount, 0);
                      const percentage = (item.amount / totalRevenue) * 100;
                      return (
                        <tr key={item.product_id} className="hover:bg-gray-50/50">
                          <td className="px-6 py-3 font-medium">{idx + 1}</td>
                          <td className="px-6 py-3 font-medium text-gray-900">{item.product_name}</td>
                          <td className="px-6 py-3 text-gray-600">{item.qty}</td>
                          <td className="px-6 py-3 text-gray-600">{item.unit}</td>
                          <td className="px-6 py-3 font-medium">{formatNPR(item.amount)}</td>
                          <td className="px-6 py-3 text-gray-600">{formatNPR(item.avg_price)}</td>
                          <td className="px-6 py-3">
                            <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-700">
                              {percentage.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-12 text-center text-gray-500">No item data</div>
            )}
          </div>

          <div className={reportsTableWrapClass}>
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">All Items by Sales ({sales.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["Product", "Quantity", "Unit", "Total Sales", "Avg Price"].map((h) => (
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
                  {sales.map((item) => (
                    <tr key={item.product_id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-3 font-medium text-gray-900">{item.product_name}</td>
                      <td className="px-6 py-3 text-gray-600">{item.qty}</td>
                      <td className="px-6 py-3 text-gray-600">{item.unit}</td>
                      <td className="px-6 py-3 font-medium">{formatNPR(item.amount)}</td>
                      <td className="px-6 py-3 text-gray-600">{formatNPR(item.avg_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <PrintableReport reportTitle="Item-wise Sales Report">
            <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "12px", color: "#000" }}>
              Top 10 Items by Sales
            </h3>
            <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #d1d5db", marginBottom: "20px" }}>
              <thead style={{ backgroundColor: "#f3f4f6" }}>
                <tr>
                  {["Rank", "Product", "Quantity", "Unit", "Total Sales", "Avg Price", "% of Total"].map((h) => (
                    <th
                      key={h}
                      style={{ padding: "8px", textAlign: "left", fontWeight: "600", borderBottom: "1px solid #d1d5db", color: "#000" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topSales.map((item, idx) => {
                  const totalRevenue = sales.reduce((sum, s) => sum + s.amount, 0);
                  const percentage = (item.amount / totalRevenue) * 100;
                  return (
                    <tr key={item.product_id} style={{ borderBottom: "1px solid #d1d5db" }}>
                      <td style={{ padding: "8px", color: "#000" }}>{idx + 1}</td>
                      <td style={{ padding: "8px", color: "#000" }}>{item.product_name}</td>
                      <td style={{ padding: "8px", textAlign: "right", color: "#000" }}>{item.qty}</td>
                      <td style={{ padding: "8px", textAlign: "right", color: "#000" }}>{item.unit}</td>
                      <td style={{ padding: "8px", textAlign: "right", color: "#000" }}>{formatNPR(item.amount)}</td>
                      <td style={{ padding: "8px", textAlign: "right", color: "#000" }}>{formatNPR(item.avg_price)}</td>
                      <td style={{ padding: "8px", textAlign: "right", color: "#000" }}>{percentage.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "12px", color: "#000" }}>
              All Items by Sales
            </h3>
            <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #d1d5db" }}>
              <thead style={{ backgroundColor: "#f3f4f6" }}>
                <tr>
                  {["Product", "Quantity", "Unit", "Total Sales", "Avg Price"].map((h) => (
                    <th
                      key={h}
                      style={{ padding: "8px", textAlign: "left", fontWeight: "600", borderBottom: "1px solid #d1d5db", color: "#000" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sales.map((item) => (
                  <tr key={item.product_id} style={{ borderBottom: "1px solid #d1d5db" }}>
                    <td style={{ padding: "8px", color: "#000" }}>{item.product_name}</td>
                    <td style={{ padding: "8px", textAlign: "right", color: "#000" }}>{item.qty}</td>
                    <td style={{ padding: "8px", textAlign: "right", color: "#000" }}>{item.unit}</td>
                    <td style={{ padding: "8px", textAlign: "right", color: "#000" }}>{formatNPR(item.amount)}</td>
                    <td style={{ padding: "8px", textAlign: "right", color: "#000" }}>{formatNPR(item.avg_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </PrintableReport>
        </>
      )}
    </ReportsPageShell>
  );
}
