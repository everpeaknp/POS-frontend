"use client";

import { useState, useEffect, useCallback } from "react";
import { ReportsPageShell, reportsCardClass, reportsTableWrapClass } from "@/components/reports/ReportsPageShell";
import { SummaryCards } from "@/components/reports/SummaryCards";
import { ExportButtons } from "@/components/reports/ExportButtons";
import { formatNPR } from "@/lib/utils";
import apiClient from "@/lib/api/client";
import toast from "react-hot-toast";
import type { ExportTableData } from "@/lib/utils/export";

interface CashAccount {
  id: number;
  account_name: string;
  account_type: string;
  balance: number;
  currency: string;
  last_updated: string;
}

interface CashResponse {
  count: number;
  results: CashAccount[];
  total_cash: number;
}

export default function CashInHandReportPage() {
  const [cashData, setCashData] = useState<CashResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<CashResponse>("/api/reports/dashboard-summary/", {
        params: { type: "cash_in_hand" }
      });
      setCashData(response.data);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { detail?: string } } };
      console.error("Failed to fetch cash in hand:", err);
      setError("Cash in hand report - feature currently unavailable");
      toast.error("Failed to load cash in hand");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const stats = cashData
    ? [
        {
          label: "Total Cash",
          value: formatNPR(cashData.total_cash || 0),
        },
        {
          label: "Cash Accounts",
          value: String(cashData.count || 0),
        },
      ]
    : [
        {
          label: "Total Cash",
          value: "Rs. 0",
        },
        {
          label: "Cash Accounts",
          value: "0",
        },
      ];

  const getExportData = useCallback((): ExportTableData | null => {
    if (!cashData?.results?.length) return null;
    return {
      filename: "cash-in-hand",
      title: "Cash in Hand Report",
      headers: ["Account", "Type", "Balance", "Last Updated"],
      rows: cashData.results.map((account) => [
        account.account_name,
        account.account_type,
        formatNPR(account.balance),
        new Date(account.last_updated).toLocaleDateString(),
      ]),
    };
  }, [cashData]);

  return (
    <ReportsPageShell
      title="Cash in Hand"
      subtitle="Current cash position"
      loading={loading && !cashData}
      error={error}
      onRetry={() => void fetchData()}
      action={<ExportButtons getExportData={getExportData} disabled={loading} />}
    >
      {!cashData?.results?.length ? (
        <div className={`${reportsCardClass} p-12 text-center text-gray-500`}>
          No cash accounts available
        </div>
      ) : (
        <>
          <SummaryCards cards={stats} />

          <div className={reportsTableWrapClass}>
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">
                Cash Accounts ({cashData.count})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["Account", "Type", "Balance", "Last Updated"].map((h) => (
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
                  {cashData.results.map((account) => (
                    <tr key={account.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-3 font-medium text-gray-900">{account.account_name}</td>
                      <td className="px-6 py-3 text-gray-600">{account.account_type}</td>
                      <td className="px-6 py-3 font-semibold text-green-600">
                        {formatNPR(account.balance)}
                      </td>
                      <td className="px-6 py-3 text-gray-600 text-xs">
                        {new Date(account.last_updated).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </ReportsPageShell>
  );
}

