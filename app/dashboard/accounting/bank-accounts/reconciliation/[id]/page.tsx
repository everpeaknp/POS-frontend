"use client";

import { PageLoading } from "@/components/shared/PageLoading";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashHeader } from "@/components/dashboard/dash-header";
import {
  bankAccountsAPI,
  bankTransactionsAPI,
  type BankAccount,
  type BankTransaction } from "@/lib/api/accounting";
import { FormattedDate } from "@/components/shared/FormattedDate";

const fmt = (n: number) => `Rs. ${n.toLocaleString("en-IN")}`;

export default function BankReconciliationPage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bank, setBank] = useState<BankAccount | null>(null);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [bankStatementBalance, setBankStatementBalance] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        setLoading(true);
        const [accountData, txData] = await Promise.all([
          bankAccountsAPI.get(id),
          bankTransactionsAPI.list({ bank_account: id }),
        ]);
        setBank(accountData);
        const txs = Array.isArray(txData) ? txData : [];
        setTransactions(txs);
        setSelected(new Set(txs.filter((t) => t.reconciled).map((t) => t.id)));
        setBankStatementBalance(String(accountData.balance));
      } catch (error) {
        console.error("Failed to load reconciliation data:", error);
        toast.error("Failed to load bank account");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const toggle = (txId: string, reconciled: boolean) => {
    if (reconciled) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(txId)) next.delete(txId);
      else next.add(txId);
      return next;
    });
  };

  const bookBalance = bank?.balance ?? 0;
  const unreconciledCredits = transactions
    .filter((t) => !selected.has(t.id) && t.credit > 0)
    .reduce((s, t) => s + t.credit, 0);
  const unreconciledDebits = transactions
    .filter((t) => !selected.has(t.id) && t.debit > 0)
    .reduce((s, t) => s + t.debit, 0);
  const adjustedBook = bookBalance + unreconciledCredits - unreconciledDebits;
  const stmtBal = parseFloat(bankStatementBalance) || 0;
  const difference = adjustedBook - stmtBal;
  const isBalanced = Math.abs(difference) < 1;

  const pendingReconcile = transactions.filter((t) => selected.has(t.id) && !t.reconciled);

  const handleComplete = async () => {
    if (!bank || pendingReconcile.length === 0) return;
    setSubmitting(true);
    try {
      const result = await bankAccountsAPI.completeReconciliation(bank.id, {
        statement_balance: stmtBal,
        transaction_ids: pendingReconcile.map((t) => t.id),
      });
      setBank(result.bank_account);
      const txData = await bankTransactionsAPI.list({ bank_account: id });
      const txs = Array.isArray(txData) ? txData : [];
      setTransactions(txs);
      setSelected(new Set(txs.filter((t) => t.reconciled).map((t) => t.id)));
      if (result.adjustment_entry_id) {
        toast.success("Reconciliation completed with adjusting journal entry");
      } else {
        toast.success("Reconciliation completed");
      }
    } catch (error) {
      console.error("Reconciliation failed:", error);
      toast.error("Failed to complete reconciliation");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Bank Reconciliation" subtitle="Loading..." />
        <PageLoading message="Loading…" />
      </div>
    );
  }

  if (!bank) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Bank Reconciliation" subtitle="Account not found" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Bank Reconciliation" subtitle={`${bank.bank_name} - ${bank.account_name}`} />
      <div className="flex-1 p-6 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">Book Balance (Khata System)</h3>
            </div>
            {transactions.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">No transactions found.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="w-8 px-3 py-2.5" />
                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500">Date</th>
                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500">Description</th>
                    <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-500">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {transactions.map((t) => {
                    const amount = t.credit > 0 ? t.credit : t.debit;
                    const isCredit = t.credit > 0;
                    const isChecked = selected.has(t.id);
                    return (
                      <tr
                        key={t.id}
                        className={`hover:bg-gray-50/50 ${!isChecked && !t.reconciled ? "bg-yellow-50/50" : ""}`}
                      >
                        <td className="px-3 py-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={t.reconciled}
                            onChange={() => toggle(t.id, t.reconciled)}
                            className="accent-[#22C55E]"
                          />
                        </td>
                        <td className="px-3 py-2.5 text-gray-600 text-xs">
                          <FormattedDate value={t.date} />
                        </td>
                        <td className="px-3 py-2.5 text-gray-700 text-xs">{t.description}</td>
                        <td
                          className={`px-3 py-2.5 text-right text-xs font-medium ${isCredit ? "text-[#22C55E]" : "text-red-500"}`}
                        >
                          {isCredit ? "+" : "-"}
                          {fmt(amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            <div className="px-5 py-3 border-t border-gray-100 flex justify-between text-sm font-semibold">
              <span className="text-gray-600">Book Balance</span>
              <span className="text-gray-800">{fmt(bookBalance)}</span>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Bank Statement</h3>
            <div>
              <Label className="text-sm mb-1.5 block">Bank Statement Closing Balance</Label>
              <Input
                type="number"
                value={bankStatementBalance}
                onChange={(e) => setBankStatementBalance(e.target.value)}
                className="h-9 text-sm border-gray-200 w-48"
              />
            </div>
            <p className="text-xs text-gray-400">Enter the closing balance from your bank statement.</p>
            {bank.last_reconciled && (
              <p className="text-xs text-gray-500">
                Last reconciled: <FormattedDate value={bank.last_reconciled} fallback="Never" />
              </p>
            )}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 max-w-lg">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Reconciliation Summary</h3>
          <div className="space-y-2 font-mono text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Book Balance (Khata):</span>
              <span className="text-gray-800">{fmt(bookBalance)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Add: Unreconciled Deposits:</span>
              <span className="text-[#22C55E]">{fmt(unreconciledCredits)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Less: Unreconciled Withdrawals:</span>
              <span className="text-red-500">({fmt(unreconciledDebits)})</span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold">
              <span className="text-gray-700">Adjusted Book Balance:</span>
              <span className="text-gray-800">{fmt(adjustedBook)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Bank Statement Balance:</span>
              <span className="text-gray-800">{fmt(stmtBal)}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between font-bold">
              <span className="text-gray-700">Difference:</span>
              <span className={isBalanced ? "text-[#22C55E]" : "text-red-600"}>{fmt(Math.abs(difference))}</span>
            </div>
          </div>
          <div
            className={`mt-4 flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium ${
              isBalanced ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"
            }`}
          >
            {isBalanced
              ? "Balances match — ready to complete reconciliation"
              : "Difference will be posted as an adjusting journal entry when you complete reconciliation"}
          </div>
          <Button
            disabled={pendingReconcile.length === 0 || submitting}
            onClick={handleComplete}
            className={`mt-4 w-full text-white ${
              pendingReconcile.length > 0
                ? "bg-[#22C55E] hover:bg-[#16A34A]"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            {submitting ? "Saving..." : `Complete Reconciliation (${pendingReconcile.length} items)`}
          </Button>
        </div>
      </div>
    </div>
  );
}
