"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { DashHeader } from "@/components/dashboard/dash-header";
import { ReportFilter } from "@/components/reports/ReportFilter";
import { ExportButtons } from "@/components/reports/ExportButtons";
import { SummaryCards } from "@/components/reports/SummaryCards";
import { reportsAPI, PurchaseReportsData } from "@/lib/api/reports";
import toast from "react-hot-toast";

export default function PurchaseReportPage() {
  const [period, setPeriod] = useState<"week" | "month" | "quarter" | "year">("month");
  const [reportData, setReportData] = useState<PurchaseReportsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await reportsAPI.purchaseReports({ date_range: period });
      setReportData(result);
    } catch (error: any) {
      console.error("Failed to fetch purchase reports:", error);
      toast.error(error.response?.data?.detail || "Failed to load purchase reports");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Purchase Report" subtitle="Purchase history and analysis" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading purchase reports...</div>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Purchase Report" subtitle="Purchase history and analysis" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">No data available</div>
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Total Purchases", value: `Rs. ${reportData.summary.total_purchases.toLocaleString()}` },
    { label: "Total POs", value: reportData.summary.total_orders.toString() },
    { label: "Avg PO Value", value: `Rs. ${reportData.summary.avg_order_value.toLocaleString()}` },
    { label: "Payment Rate", value: `${reportData.summary.payment_rate_percentage.toFixed(1)}%` },
  ];

  const COLORS = ["#22C55E", "#3B82F6", "#F59E0B"];

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Purchase Report" subtitle="Purchase history and analysis" />
      <ReportFilter period={period} onPeriodChange={(p) => setPeriod(p as any)} onGenerate={fetchData} />

      <div className="flex-1 p-6 space-y-6">
        {/* Export Buttons */}
        <div className="flex justify-end">
          <ExportButtons />
        </div>

        {/* Summary Cards */}
        <SummaryCards cards={stats} />

        {/* Purchase Trend Chart */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Purchase Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={reportData.monthly_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: any) => `Rs. ${value.toLocaleString()}`} />
              <Line type="monotone" dataKey="purchases" stroke="#22C55E" strokeWidth={2} dot={{ fill: "#22C55E" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Suppliers */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Top Suppliers</h3>
          </div>
          {reportData.by_supplier.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Rank", "Supplier", "Orders", "Total Amount", "Outstanding", "Status"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reportData.by_supplier.map((supplier, index) => (
                  <tr key={supplier.supplier_id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-900">{index + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{supplier.supplier_name}</td>
                    <td className="px-4 py-3 text-gray-600">{supplier.orders}</td>
                    <td className="px-4 py-3 text-gray-800 font-medium">Rs. {supplier.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-600">Rs. {supplier.outstanding.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        supplier.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'
                      }`}>
                        {supplier.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-4 py-8 text-center text-gray-500">No supplier data available</div>
          )}
        </div>

        {/* Purchase by Product */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Purchase by Product</h3>
          </div>
          {reportData.by_product.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Product", "Quantity", "Unit", "Total Amount", "Avg Price"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reportData.by_product.map((product) => (
                  <tr key={product.product_id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-900">{product.product_name}</td>
                    <td className="px-4 py-3 text-gray-600">{product.qty}</td>
                    <td className="px-4 py-3 text-gray-600">{product.unit}</td>
                    <td className="px-4 py-3 text-gray-800 font-medium">Rs. {product.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-600">Rs. {product.avg_price.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-4 py-8 text-center text-gray-500">No product data available</div>
          )}
        </div>

        {/* Tax Report */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Tax Report (VAT 13%)</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Total Taxable</div>
                <div className="text-lg font-semibold text-gray-900">Rs. {reportData.tax_report.total_taxable.toLocaleString()}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Total VAT</div>
                <div className="text-lg font-semibold text-gray-900">Rs. {reportData.tax_report.total_vat.toLocaleString()}</div>
              </div>
            </div>
            {reportData.tax_report.monthly_data.length > 0 && (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["Month", "Taxable Amount", "VAT Amount"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {reportData.tax_report.monthly_data.map((item) => (
                    <tr key={item.month} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-900">{item.month}</td>
                      <td className="px-4 py-3 text-gray-600">Rs. {item.taxable.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-800 font-medium">Rs. {item.vat.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
