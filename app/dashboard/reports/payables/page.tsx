"use client";

import { useState, useEffect, useCallback } from "react";
import {
  PieChart,
  Pie,
  Cell,
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
import { reportsAPI, type PayablesData } from "@/lib/api/reports";
import { formatNPR } from "@/lib/utils";
import toast from "react-hot-toast";
import type { ExportTableData } from "@/lib/utils/export";

export default function PayablesPage() {
  const [reportData, setReportData] = useState<PayablesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await reportsAPI.payables();
      setReportData(result);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { detail?: string } } };
      console.error("Failed to fetch payables:", err);
      setError(apiErr.response?.data?.detail || "Failed to load payables");
      toast.error("Failed to load payables");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const stats = reportData
    ? [
        {
          label: "Total Payable",
          value: formatNPR(reportData.summary.total_payable),
        },
        {
          label: "Suppliers",
          value: String(reportData.summary.total_suppliers),
        },
        {
          label: "With Balance",
          value: String(reportData.summary.suppliers_with_balance),
        },
        {
          label: "Avg Payable",
          value: reportData.summary.suppliers_with_balance > 0 
            ? formatNPR(reportData.summary.total_payable / reportData.summary.suppliers_with_balance)
            : formatNPR(0),
        },
      ]
    : [
        { label: "Total Payable", value: "Rs. 0" },
        { label: "Suppliers", value: "0" },
        { label: "With Balance", value: "0" },
        { label: "Avg Payable", value: "Rs. 0" },
      ];

  const chartData = reportData?.suppliers.slice(0, 5).map(s => ({
    name: s.supplier_name,
    value: s.outstanding,
  })) || [];

  const colors = ['#4A5D7A', '#6B7FA3', '#8B9FCC', '#ABB8D8', '#CBD1E4'];

  const getExportData = useCallback((): ExportTableData | null => {
    if (!reportData?.suppliers.length) return null;
    return {
      filename: "payables-report",
      title: "Payables Report",
      headers: ["Rank", "Supplier", "Contact", "Outstanding", "Invoices", "Status"],
      rows: reportData.suppliers.map((supplier, index) => [
        String(index + 1),
        supplier.supplier_name,
        supplier.contact,
        formatNPR(supplier.outstanding),
        String(supplier.invoices_count),
        supplier.status,
      ]),
    };
  }, [reportData]);

  return (
    <ReportsPageShell
      title="Payables"
      subtitle="Money owed to suppliers"
      loading={loading && !reportData}
      error={error}
      onRetry={() => void fetchData()}
    >
      {!reportData ? (
        <div className={`${reportsCardClass} p-12 text-center text-gray-500`}>
          No payables data available
        </div>
      ) : (
        <>
          <SummaryCards cards={stats} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {chartData.length > 0 && (
              <div className={reportsCardClass}>
                <h3 className="px-6 py-4 border-b border-gray-100 text-sm font-semibold text-gray-700">
                  Top Payables
                </h3>
                <div className="p-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${formatNPR(value)}`}
                        outerRadius={100}
                        fill="#4A5D7A"
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div className={reportsCardClass}>
              <h3 className="px-6 py-4 border-b border-gray-100 text-sm font-semibold text-gray-700">
                Summary
              </h3>
              <div className="p-6 space-y-4">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Total Suppliers</span>
                  <span className="font-medium">{reportData.summary.total_suppliers}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">With Outstanding</span>
                  <span className="font-medium">{reportData.summary.suppliers_with_balance}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Total Payable</span>
                  <span className="font-semibold text-lg">{formatNPR(reportData.summary.total_payable)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Average Per Supplier</span>
                  <span className="font-medium">
                    {reportData.summary.suppliers_with_balance > 0
                      ? formatNPR(reportData.summary.total_payable / reportData.summary.suppliers_with_balance)
                      : formatNPR(0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className={reportsTableWrapClass}>
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-gray-900">All Suppliers</h3>
              <ExportButtons getExportData={getExportData} disabled={loading} />
            </div>
            {reportData.suppliers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {["Rank", "Supplier", "Contact", "Outstanding", "Invoices", "Status"].map((h) => (
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
                    {reportData.suppliers.map((supplier, index) => (
                      <tr key={supplier.supplier_id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-3 font-medium">{index + 1}</td>
                        <td className="px-6 py-3 font-medium text-gray-900">
                          {supplier.supplier_name}
                        </td>
                        <td className="px-6 py-3 text-gray-600 text-xs">{supplier.contact}</td>
                        <td className="px-6 py-3 font-medium text-red-600">
                          {formatNPR(supplier.outstanding)}
                        </td>
                        <td className="px-6 py-3 text-gray-600">{supplier.invoices_count}</td>
                        <td className="px-6 py-3">
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              supplier.status === "active"
                                ? "bg-slate-50 text-slate-700"
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
              <div className="px-6 py-12 text-center text-gray-500">No payables to display</div>
            )}
          </div>
        </>
      )}
    </ReportsPageShell>
  );
}
