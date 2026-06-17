"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
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

  const stats = reportData ? [
    { label: "Total Purchases", value: `Rs. ${reportData.summary.total_purchases.toLocaleString()}` },
    { label: "Total POs", value: reportData.summary.total_orders.toString() },
    { label: "Avg PO Value", value: `Rs. ${reportData.summary.avg_order_value.toLocaleString()}` },
    { label: "Payment Rate", value: `${reportData.summary.payment_rate_percentage.toFixed(1)}%` },
  ] : [
    { label: "Total Purchases", value: "Rs. 0" },
    { label: "Total POs", value: "0" },
    { label: "Avg PO Value", value: "Rs. 0" },
    { label: "Payment Rate", value: "0%" },
  ];

  if (loading && !reportData) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <DashHeader title="Purchase Report" subtitle="Purchase history and analysis" />
        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center w-full min-h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22C55E] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading purchase reports...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader title="Purchase Report" subtitle="Purchase history and analysis" />
      <div className="flex-1 overflow-y-auto p-6 space-y-4 w-full">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 lg:p-6 w-full">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ReportFilter
              embedded
              period={period}
              onPeriodChange={(p) => setPeriod(p as "week" | "month" | "quarter" | "year")}
              onGenerate={fetchData}
            />
            <ExportButtons />
          </div>
        </div>

        {!reportData ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center w-full">
            <p className="text-gray-500">No data available</p>
          </div>
        ) : (
          <>
            <div className="w-full">
              <SummaryCards cards={stats} />
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 w-full">
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Purchase Trend</h3>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={reportData.monthly_trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: any) => `Rs. ${value.toLocaleString()}`} />
                  <Line type="monotone" dataKey="purchases" stroke="#22C55E" strokeWidth={2} dot={{ fill: "#22C55E" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden w-full">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">Top Suppliers</h3>
              </div>
              {reportData.by_supplier.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {["Rank", "Supplier", "Orders", "Total Amount", "Outstanding", "Status"].map((h) => (
                          <th key={h} className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {reportData.by_supplier.map((supplier, index) => (
                        <tr key={supplier.supplier_id} className="hover:bg-gray-50/50">
                          <td className="px-6 py-3 font-medium text-gray-900 whitespace-nowrap">{index + 1}</td>
                          <td className="px-6 py-3 font-medium text-gray-900 whitespace-nowrap">{supplier.supplier_name}</td>
                          <td className="px-6 py-3 text-gray-600 whitespace-nowrap">{supplier.orders}</td>
                          <td className="px-6 py-3 text-gray-800 font-medium whitespace-nowrap">Rs. {supplier.amount.toLocaleString()}</td>
                          <td className="px-6 py-3 text-gray-600 whitespace-nowrap">Rs. {supplier.outstanding.toLocaleString()}</td>
                          <td className="px-6 py-3 whitespace-nowrap">
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
                </div>
              ) : (
                <div className="px-6 py-12 text-center text-gray-500">No supplier data available</div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden w-full">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">Purchase by Product</h3>
              </div>
              {reportData.by_product.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {["Product", "Quantity", "Unit", "Total Amount", "Avg Price"].map((h) => (
                          <th key={h} className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {reportData.by_product.map((product) => (
                        <tr key={product.product_id} className="hover:bg-gray-50/50">
                          <td className="px-6 py-3 font-medium text-gray-900 whitespace-nowrap">{product.product_name}</td>
                          <td className="px-6 py-3 text-gray-600 whitespace-nowrap">{product.qty}</td>
                          <td className="px-6 py-3 text-gray-600 whitespace-nowrap">{product.unit}</td>
                          <td className="px-6 py-3 text-gray-800 font-medium whitespace-nowrap">Rs. {product.amount.toLocaleString()}</td>
                          <td className="px-6 py-3 text-gray-600 whitespace-nowrap">Rs. {product.avg_price.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-6 py-12 text-center text-gray-500">No product data available</div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden w-full">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">Tax Report (VAT 13%)</h3>
              </div>
              <div className="p-6 lg:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-xs text-gray-500 mb-1">Total Taxable</div>
                    <div className="text-lg font-semibold text-gray-900">Rs. {reportData.tax_report.total_taxable.toLocaleString()}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-xs text-gray-500 mb-1">Total VAT</div>
                    <div className="text-lg font-semibold text-gray-900">Rs. {reportData.tax_report.total_vat.toLocaleString()}</div>
                  </div>
                </div>
                {reportData.tax_report.monthly_data.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          {["Month", "Taxable Amount", "VAT Amount"].map((h) => (
                            <th key={h} className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {reportData.tax_report.monthly_data.map((item) => (
                          <tr key={item.month} className="hover:bg-gray-50/50">
                            <td className="px-6 py-3 font-medium text-gray-900 whitespace-nowrap">{item.month}</td>
                            <td className="px-6 py-3 text-gray-600 whitespace-nowrap">Rs. {item.taxable.toLocaleString()}</td>
                            <td className="px-6 py-3 text-gray-800 font-medium whitespace-nowrap">Rs. {item.vat.toLocaleString()}</td>
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
      </div>
    </div>
  );
}
