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
}

interface BankTransaction {
  id: number;
  date: string;
  reference: string;
  amount: number;
  type: "debit" | "credit";
  description: string;
  balance_after: number;
}

interface BankAccountsResponse {
  count: number;
  results: BankAccount[];
}

interface BankTransactionsResponse {
  count: number;
  results: BankTransaction[];
}

export default function BankStatementPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Initialize dates to last 90 days
  useEffect(() => {
    const end = new Date();
    const start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
  }, []);

  // Fetch accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await apiClient.get<BankAccountsResponse>("/api/reports/dashboard-summary/");
        const accs = response.data.results || [];
        setAccounts(accs);
        if (accs.length > 0) {
          setSelectedAccountId(accs[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch accounts:", err);
        setError("Bank accounts feature currently unavailable");
        toast.error("Failed to load accounts");
      }
    };
    void fetchAccounts();
  }, []);

  // Fetch transactions for selected account
  const fetchTransactions = useCallback(async (accountId?: number, start?: string, end?: string) => {
    if (!accountId || !start || !end) return;
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<BankTransactionsResponse>(
        `/api/reports/dashboard-summary/`,
        {
          params: { account_id: accountId, start_date: start, end_date: end },
        }
      );
      setTransactions(response.data.results || []);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { detail?: string } } };
      console.error("Failed to fetch bank statement:", err);
      setError("Bank statement feature currently unavailable");
      toast.error("Failed to load bank statement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedAccountId && startDate && endDate) {
      void fetchTransactions(selectedAccountId, startDate, endDate);
    }
  }, [selectedAccountId, startDate, endDate, fetchTransactions]);

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const debits = transactions.filter((t) => t.type === "debit").reduce((sum, t) => sum + t.amount, 0);
  const credits = transactions.filter((t) => t.type === "credit").reduce((sum, t) => sum + t.amount, 0);

  const stats = selectedAccount
    ? [
        { label: "Account", value: selectedAccount.account_name },
        { label: "Current Balance", value: formatNPR(selectedAccount.balance) },
        { label: "Total Debits", value: formatNPR(debits) },
        { label: "Total Credits", value: formatNPR(credits) },
      ]
    : [
        { label: "Account", value: "Select account" },
        { label: "Current Balance", value: "Rs. 0" },
        { label: "Total Debits", value: "Rs. 0" },
        { label: "Total Credits", value: "Rs. 0" },
      ];

  const getExportData = useCallback((): ExportTableData | null => {
    if (!transactions.length) return null;
    return {
      filename: `bank-statement-${selectedAccount?.account_name || "statement"}-${startDate}-to-${endDate}`,
      title: "Bank Statement",
      subtitle: `${selectedAccount?.account_name} | ${startDate} to ${endDate}`,
      headers: ["Date", "Reference", "Type", "Amount", "Balance After", "Description"],
      rows: transactions.map((t) => [
        new Date(t.date).toLocaleDateString(),
        t.reference,
        t.type.toUpperCase(),
        formatNPR(t.amount),
        formatNPR(t.balance_after),
        t.description,
      ]),
    };
  }, [transactions, selectedAccount, startDate, endDate]);

  return (
    <ReportsPageShell
      title="Bank Statement"
      subtitle="Bank account transactions"
      loading={loading && !transactions.length}
      error={error}
      onRetry={() => selectedAccountId && void fetchTransactions(selectedAccountId, startDate, endDate)}
      toolbar={
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedAccountId || ""}
            onChange={(e) => setSelectedAccountId(Number(e.target.value))}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          >
            <option value="">Select Account</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.account_name} ({account.account_number})
              </option>
            ))}
          </select>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
          <span className="text-gray-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
        </div>
      }
      action={<ExportButtons getExportData={getExportData} disabled={loading} />}
    >
      {!selectedAccount ? (
        <div className={`${reportsCardClass} p-12 text-center text-gray-500`}>
          No accounts available
        </div>
      ) : !transactions.length ? (
        <div className={`${reportsCardClass} p-12 text-center text-gray-500`}>
          No transactions for the selected period
        </div>
      ) : (
        <>
          <SummaryCards cards={stats} />

          <div className={reportsTableWrapClass}>
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">
                Statement ({transactions.length} transactions)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["Date", "Reference", "Type", "Amount", "Balance After", "Description"].map((h) => (
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
                  {transactions.map((txn) => (
                    <tr key={txn.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-3 text-gray-600">
                        {new Date(txn.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3 font-medium text-blue-600">{txn.reference}</td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            txn.type === "credit"
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {txn.type.toUpperCase()}
                        </span>
                      </td>
                      <td className={`px-6 py-3 font-medium ${txn.type === "credit" ? "text-green-600" : "text-red-600"}`}>
                        {formatNPR(txn.amount)}
                      </td>
                      <td className="px-6 py-3 font-medium">{formatNPR(txn.balance_after)}</td>
                      <td className="px-6 py-3 text-gray-600 max-w-xs truncate">{txn.description}</td>
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
