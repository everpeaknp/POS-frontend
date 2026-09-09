"use client";

import { useState, useEffect, useCallback } from "react";
import { ExportButtons } from "@/components/reports/ExportButtons";
import { SummaryCards } from "@/components/reports/SummaryCards";
import {
  ReportsPageShell,
  reportsTableWrapClass,
} from "@/components/reports/ReportsPageShell";
import { formatNPR } from "@/lib/utils";
import toast from "react-hot-toast";
import type { ExportTableData } from "@/lib/utils/export";
import apiClient from "@/lib/api/client";

interface ReceivablesData {
  total_outstanding: number;
  total_credit_limit: number;
  customers_with_balance: number;
  customers_over_limit: number;
  utilization_rate: number;
  customers: Array<{
    customer_id: string;
    name: string;
    phone: string;
    current_balance: number;
    credit_limit: number;
    available_credit: number;
    is_over_limit: boolean;
  }>;
}

export default function ReceivablesReportPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [receivablesData, setReceivablesData] = useState<ReceivablesData | null>(null);

  const loadReportData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<ReceivablesData>('/api/reports/payables/');
      setReceivablesData(response.data);
    } catch (err) {
      console.error("Error loading receivables:", err);
      setError("Unable to load receivables - feature currently unavailable");
      toast.error("Unable to load receivables");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  const stats = [
    {
      label: "Total Receivables",
      value: formatNPR(receivablesData?.total_outstanding ?? 0),
    },
    {
      label: "Customers with Balance",
      value: String(receivablesData?.customers_with_balance ?? 0),
    },
    {
      label: "Credit Utilization",
      value: `${(receivablesData?.utilization_rate ?? 0).toFixed(1)}%`,
    },
    {
      label: "Over Limit",
      value: String(receivablesData?.customers_over_limit ?? 0),
    },
  ];

  const getExportData = useCallback((): ExportTableData | null => {
    if (!receivablesData?.customers?.length) return null;
    return {
      filename: `receivables-report-${new Date().toISOString().split('T')[0]}`,
      title: "Receivables Report",
      subtitle: `Money owed by customers`,
      headers: ["Rank", "Customer", "Phone", "Balance", "Credit Limit", "Available", "Status"],
      rows: receivablesData.customers.map((customer, index) => [
        String(index + 1),
        customer.name,
        customer.phone,
        formatNPR(customer.current_balance),
        formatNPR(customer.credit_limit),
        formatNPR(customer.available_credit),
        customer.is_over_limit ? "Over Limit" : "Within Limit",
      ]),
    };
  }, [receivablesData]);

  return (
    <ReportsPageShell
      title="Receivables (Udhaaro)"
      subtitle="Money owed by customers"
      loading={loading && !receivablesData}
      error={error}
      onRetry={loadReportData}
      action={<ExportButtons getExportData={getExportData} disabled={loading} />}
    >
      <SummaryCards cards={stats} />

      <div className={reportsTableWrapClass}>
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Customers with Outstanding Balance</h3>
        </div>
        {receivablesData && receivablesData.customers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Rank", "Customer", "Phone", "Balance", "Credit Limit", "Available", "Status"].map(
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
                {receivablesData.customers.map((customer, index) => (
                  <tr key={customer.customer_id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3 font-medium text-gray-900">{index + 1}</td>
                    <td className="px-6 py-3 font-medium text-gray-900">{customer.name}</td>
                    <td className="px-6 py-3 text-gray-600">{customer.phone}</td>
                    <td className="px-6 py-3 font-semibold text-amber-600">
                      {formatNPR(customer.current_balance)}
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {formatNPR(customer.credit_limit)}
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {formatNPR(customer.available_credit)}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        customer.is_over_limit
                          ? 'bg-red-100 text-red-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {customer.is_over_limit ? 'Over Limit' : 'Within Limit'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                <tr className="font-semibold">
                  <td colSpan={3} className="px-6 py-3 text-right text-gray-900">
                    Total Outstanding:
                  </td>
                  <td colSpan={4} className="px-6 py-3 text-amber-600">
                    {formatNPR(receivablesData.total_outstanding)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500">
            No outstanding receivables
          </div>
        )}
      </div>
    </ReportsPageShell>
  );
}
