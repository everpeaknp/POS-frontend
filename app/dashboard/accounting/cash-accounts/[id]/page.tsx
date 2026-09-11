"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Wallet } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { AccountingPageShell, accountingCardClass } from "@/components/dashboard/AccountingPageShell";
import { cashAccountsAPI, type CashAccount, type CashTransaction } from "@/lib/api/accounting";
import { useDateSystem } from "@/lib/context/DateSystemContext";

const fmt = (n: number) => `Rs. ${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function CashAccountStatementPage() {
  const params = useParams();
  const router = useRouter();
  const { formatDate } = useDateSystem();
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<CashAccount | null>(null);
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  const accountId = params?.id as string;

  useEffect(() => {
    if (accountId) {
      fetchAccountAndStatement();
    }
  }, [accountId]);

  const fetchAccountAndStatement = async () => {
    try {
      setLoading(true);
      setError(null);
      const [accountData, statementData] = await Promise.all([
        cashAccountsAPI.get(accountId),
        cashAccountsAPI.statement(accountId),
      ]);
      setAccount(accountData);
      setTransactions(statementData);
    } catch (error: any) {
      console.error("Failed to load cash account statement:", error);
      setError("Failed to load cash account statement. Please try again.");
      toast.error("Failed to load cash account statement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AccountingPageShell
      title={account ? `${account.user_name} - Cash Account` : "Cash Account Statement"}
      subtitle={account ? `Current Balance: ${fmt(account.balance)}` : ""}
      loading={loading}
      error={error}
      onRetry={fetchAccountAndStatement}
    >
      <div className="mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/dashboard/accounting/cash-accounts")}
          className="h-8 text-xs border-gray-200 text-gray-600"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
          Back to Cash Accounts
        </Button>
      </div>

      {account && (
        <div className={`${accountingCardClass} p-5 mb-4`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-[#4A5D7A]/10 flex items-center justify-center">
              <Wallet className="h-6 w-6 text-[#4A5D7A]" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{account.user_name}</h3>
              <p className="text-sm text-gray-500">@{account.user_username}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Current Balance</p>
              <p className="text-2xl font-bold text-gray-900">{fmt(account.balance)}</p>
            </div>
          </div>
        </div>
      )}

      <div className={accountingCardClass}>
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Transaction History</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
          </p>
        </div>

        {transactions.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">No transactions yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Debit
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Credit
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {transactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                      {formatDate(txn.date)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono whitespace-nowrap">
                      {txn.reference}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                      {txn.description}
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          txn.type === "Credit"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {txn.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-red-600 whitespace-nowrap">
                      {txn.debit > 0 ? fmt(txn.debit) : "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-green-600 whitespace-nowrap">
                      {txn.credit > 0 ? fmt(txn.credit) : "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900 whitespace-nowrap">
                      {fmt(txn.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AccountingPageShell>
  );
}
