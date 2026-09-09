"use client";

import { useState, useEffect, useCallback } from "react";
import { ReportsPageShell, reportsCardClass, reportsTableWrapClass } from "@/components/reports/ReportsPageShell";
import { SummaryCards } from "@/components/reports/SummaryCards";
import { ExportButtons } from "@/components/reports/ExportButtons";
import { formatNPR } from "@/lib/utils";
import apiClient from "@/lib/api/client";
import toast from "react-hot-toast";
import type { ExportTableData } from "@/lib/utils/export";

interface BankAccount {
  id: number;
  account_name: string;
  account_number: string;
  balance: number;
  account_type: string;
  status: string;
}

interface BankAccountsResponse {
  count: number;
  results: BankAccount[];
}

export default function CashInHandPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<BankAccountsResponse>("/accounting/bank-accounts/");
      setAccounts(response.data.results || []);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { detail?: string } } };
      console.error("Failed to fetch cash in hand:", err);
      setError(apiErr.response?.data?.detail || "Failed to load cash in hand");
      toast.error("Failed to load cash in hand");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const totalCash = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const activeAccounts = accounts.filter((a) => a.status === "active" || a.status === "Active").length;

  const stats = [
    { label: "Total Cash & Bank", value: formatNPR(totalCash) },
    { label: "Total Accounts", value: String(accounts.length) },
    { label: "Active Accounts", value: String(activeAccounts) },
    { label: "Avg Balance", value: accounts.length > 0 ? formatNPR(totalCash / accounts.length) : formatNPR(0) },
  ];

  const getExportData = useCallback((): ExportTableData | null => {
    if (!accounts.length) return null;
    return {
      filename: "cash-in-hand",
      title: "Cash in Hand Report",
      headers: ["Account", "Account #", "Type", "Balance", "Status"],
      rows: accounts.map((acc) => [
        acc.account_name,
        acc.account_number,
        acc.account_type,
        formatNPR(acc.balance),
        acc.status,
      ]),
    };
  }, [accounts]);

  return (
    <ReportsPageShell
      title="Cash in Hand"
      subtitle="Current cash position"
      loading={loading && !accounts.length}
      error={error}
      onRetry={() => void fetchData()}
      action={<ExportButtons getExportData={getExportData} disabled={loading} />}
    >
      {!accounts.length ? (
        <div className={`${reportsCardClass} p-12 text-center text-gray-500`}>
          No bank accounts found
        </div>
      ) : (
        <>
          <SummaryCards cards={stats} />

          <div className={reportsTableWrapClass}>
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Bank & Cash Accounts</h3>
            </div>
            {accounts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {["Account Name", "Account #", "Type", "Balance", "Status"].map((h) => (
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
                    {accounts.map((account) => (
                      <tr key={account.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-3 font-medium text-gray-900">{account.account_name}</td>
                        <td className="px-6 py-3 text-gray-600 font-mono text-xs">{account.account_number}</td>
                        <td className="px-6 py-3">
                          <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-700">
                            {account.account_type}
                          </span>
                        </td>
                        <td className="px-6 py-3 font-semibold text-lg text-green-600">
                          {formatNPR(account.balance)}
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              account.status === "active" || account.status === "Active"
                                ? "bg-green-50 text-green-700"
                                : "bg-gray-50 text-gray-700"
                            }`}
                          >
                            {account.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 font-semibold">
                      <td colSpan={3} className="px-6 py-3 text-right">
                        Total Cash & Bank:
                      </td>
                      <td className="px-6 py-3 text-lg text-green-600">{formatNPR(totalCash)}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-12 text-center text-gray-500">No accounts found</div>
            )}
          </div>
        </>
      )}
    </ReportsPageShell>
  );
}
