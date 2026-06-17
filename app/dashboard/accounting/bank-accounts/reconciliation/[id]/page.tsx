"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashHeader } from "@/components/dashboard/dash-header";
import { mockBankAccounts, mockBankTransactions } from "@/lib/mock-data/accounting";

const fmt = (n: number) => `Rs. ${n.toLocaleString("en-IN")}`;

export default function BankReconciliationPage() {
  const { id } = useParams<{ id: string }>();
  const bank = mockBankAccounts.find((b) => b.id === id) ?? mockBankAccounts[0];
  const [bankStatementBalance, setBankStatementBalance] = useState("380000");
  const [checked, setChecked] = useState<Set<string>>(new Set(["BT001", "BT002", "BT003"]));

  const toggle = (txId: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(txId) ? next.delete(txId) : next.add(txId);
      return next;
    });
  };

  const bookBalance = mockBankTransactions[mockBankTransactions.length - 1]?.balance ?? 0;
  const outstanding = mockBankTransactions.filter((t) => !checked.has(t.id) && t.type === "Credit").reduce((s, t) => s + t.debit, 0);
  const outstandingCheques = mockBankTransactions.filter((t) => !checked.has(t.id) && t.type === "Debit").reduce((s, t) => s + t.credit, 0);
  const adjustedBook = bookBalance + outstanding - outstandingCheques;
  const stmtBal = parseFloat(bankStatementBalance) || 0;
  const difference = adjustedBook - stmtBal;
  const reconciled = Math.abs(difference) < 1;

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Bank Reconciliation" subtitle={bank.bankName + " - " + bank.accountName} />
      <div className="flex-1 p-6 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">Book Balance (Khata System)</h3>
            </div>
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
                {mockBankTransactions.map((t) => (
                  <tr key={t.id} className={"hover:bg-gray-50/50 " + (!checked.has(t.id) ? "bg-yellow-50/50" : "")}>
                    <td className="px-3 py-2.5 text-center">
                      <input type="checkbox" checked={checked.has(t.id)} onChange={() => toggle(t.id)} className="accent-[#22C55E]" />
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 text-xs">{t.date}</td>
                    <td className="px-3 py-2.5 text-gray-700 text-xs">{t.description}</td>
                    <td className={"px-3 py-2.5 text-right text-xs font-medium " + (t.type === "Credit" ? "text-[#22C55E]" : "text-red-500")}>
                      {t.type === "Credit" ? "+" : "-"}{fmt(t.type === "Credit" ? t.debit : t.credit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-5 py-3 border-t border-gray-100 flex justify-between text-sm font-semibold">
              <span className="text-gray-600">Closing Book Balance</span>
              <span className="text-gray-800">{fmt(bookBalance)}</span>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Bank Statement</h3>
            <div>
              <Label className="text-sm mb-1.5 block">Bank Statement Closing Balance</Label>
              <Input type="number" value={bankStatementBalance} onChange={(e) => setBankStatementBalance(e.target.value)} className="h-9 text-sm border-gray-200 w-48" />
            </div>
            <p className="text-xs text-gray-400">Enter the closing balance from your bank statement.</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 max-w-lg">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Reconciliation Summary</h3>
          <div className="space-y-2 font-mono text-sm">
            <div className="flex justify-between"><span className="text-gray-600">Book Balance (Khata):</span><span className="text-gray-800">{fmt(bookBalance)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Add: Outstanding Deposits:</span><span className="text-[#22C55E]">{fmt(outstanding)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Less: Outstanding Cheques:</span><span className="text-red-500">({fmt(outstandingCheques)})</span></div>
            <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold"><span className="text-gray-700">Adjusted Book Balance:</span><span className="text-gray-800">{fmt(adjustedBook)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Bank Statement Balance:</span><span className="text-gray-800">{fmt(stmtBal)}</span></div>
            <div className="border-t border-gray-200 pt-2 flex justify-between font-bold"><span className="text-gray-700">Difference:</span><span className={reconciled ? "text-[#22C55E]" : "text-red-600"}>{fmt(Math.abs(difference))}</span></div>
          </div>
          <div className={"mt-4 flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium " + (reconciled ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700")}>
            {reconciled ? "Reconciled" : "Not yet reconciled - unmatched items highlighted in yellow"}
          </div>
          <Button disabled={!reconciled} className={"mt-4 w-full text-white " + (reconciled ? "bg-[#22C55E] hover:bg-[#16A34A]" : "bg-gray-300 cursor-not-allowed")}>
            Complete Reconciliation
          </Button>
        </div>
      </div>
    </div>
  );
}