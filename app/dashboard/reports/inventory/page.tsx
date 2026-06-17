"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { DashHeader } from "@/components/dashboard/dash-header";
import { ExportButtons } from "@/components/reports/ExportButtons";
import { SummaryCards } from "@/components/reports/SummaryCards";
import { inventoryApi } from "@/lib/api/inventory";
import toast from "react-hot-toast";

export default function InventoryReportPage() {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await inventoryApi.reports.stockSummary();
      setReportData(response.data);
    } catch (error: any) {
      console.error("Failed to fetch inventory reports:", error);
      toast.error(error.response?.data?.detail || "Failed to load inventory reports");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Inventory Report" subtitle="Stock levels and valuation" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading inventory reports...</div>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Inventory Report" subtitle="Stock levels and valuation" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">No data available</div>
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Total Products", value: reportData.summary.total_products.toString() },
    { label: "Total Units", value: Math.round(reportData.summary.total_units).toString() },
    { label: "Low Stock", value: reportData.summary.low_stock.toString() },
    { label: "Out of Stock", value: reportData.summary.out_of_stock.toString() },
  ];

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Inventory Report" subtitle="Stock levels and valuation" />
      <div className="flex-1 p-6 space-y-6">
        {/* Export Buttons */}
        <div className="flex justify-end">
          <ExportButtons />
        </div>

        {/* Summary Cards */}
        <SummaryCards cards={stats} />

        {/* Stock by Product Chart */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Stock by Product</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData.stock_data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="stock" fill="#22C55E" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Stock Summary Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Top Products by Stock</h3>
          </div>
          {reportData.stock_data.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["SKU", "Current Stock", "Status"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reportData.stock_data.map((product: any) => (
                  <tr key={product.name} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{product.name}</td>
                    <td className="px-4 py-3 text-gray-600">{Math.round(product.stock)} units</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        product.stock > 50 
                          ? "bg-green-100 text-green-700" 
                          : product.stock > 10 
                          ? "bg-yellow-100 text-yellow-700" 
                          : "bg-red-100 text-red-700"
                      }`}>
                        {product.stock > 50 ? "Good" : product.stock > 10 ? "Low" : "Critical"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-4 py-8 text-center text-gray-500">No stock data available</div>
          )}
        </div>
      </div>
    </div>
  );
}
