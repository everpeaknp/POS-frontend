"use client";

import React, { useState } from "react";
import { Download } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashHeader } from "@/components/dashboard/dash-header";
import { AccountTypeBadge } from "@/components/accounting/AccountTypeBadge";
import { accountsAPI } from "@/lib/api/accounting";

const fmt = (n: number) => `Rs. ${n.toLocaleString("en-IN")}`;
const TYPES = ["Assets", "Liabilities", "Equity", "Income", "Expense"];

interface TrialBalanceAccount {
  id: string;
  code: string;
  name: string;
  type: string;
  level: number;
  debit: number;
  credit: number;
  balance: number;
}

interface TrialBalanceData {
  as_of_date: string;
  accounts: TrialBalanceAccount[];
  total_debit: number;
  total_credit: number;
  is_balanced: boolean;
}

export default function TrialBalancePage() {
  const [asOf, setAsOf] = useState("");
  const [generated, setGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [trialBalanceData, setTrialBalanceData] = useState<TrialBalanceData | null>(null);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const params: { as_of_date?: string } = {};
      if (asOf) params.as_of_date = asOf;

      const data = await accountsAPI.trialBalance(params);
      setTrialBalanceData(data);
      setGenerated(true);
      toast.success('Trial balance generated successfully');
    } catch (error: any) {
      console.error('Failed to generate trial balance:', error);
      toast.error(error.response?.data?.detail || 'Failed to generate trial balance');
    } finally {
      setGenerating(false);
    }
  };

  const handleExportCSV = () => {
    if (!trialBalanceData) return;

    const headers = ['Code', 'Account Name', 'Type', 'Debit', 'Credit'];
    const csvRows = [
      headers.join(','),
      ...trialBalanceData.accounts.map(acc => [
        acc.code,
        `"${acc.name}"`,
        acc.type,
        acc.debit.toFixed(2),
        acc.credit.toFixed(2),
      ].join(','))
    ];

    csvRows.push(['', '', 'Grand Total', trialBalanceData.total_debit.toFixed(2), trialBalanceData.total_credit.toFixed(2)].join(','));

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trial-balance-${trialBalanceData.as_of_date || new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Trial balance exported successfully');
  };

  const leafAccounts = trialBalanceData?.accounts || [];
  const grandDebit = trialBalanceData?.total_debit || 0;
  const grandCredit = trialBalanceData?.total_credit || 0;
  const balanced = trialBalanceData?.is_balanced ?? true;

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Trial Balance" subtitle="Verify debit and credit totals" />
      <div className="flex-1 p-6 space-y-4">

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <Label className="text-sm mb-1.5 block">As of Date</Label>
              <Input 
                type="date"
                value={asOf} 
                onChange={(e) => {
                  setAsOf(e.target.value);
                  setGenerated(false);
                }} 
                className="h-9 text-sm border-gray-200 w-44" 
                disabled={generating}
              />
            </div>
            <Button 
              onClick={handleGenerate} 
              disabled={generating}
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white px-6"
            >
              {generating ? 'Generating...' : 'Generate'}
            </Button>
            {generated && trialBalanceData && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-9 gap-1.5 text-gray-600 border-gray-200"
                  onClick={handleExportCSV}
                >
                  <Download className="h-3.5 w-3.5" /> CSV
                </Button>
              </>
            )}
          </div>
        </div>

        {generated && trialBalanceData && leafAccounts.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Trial Balance Report</p>
              <p className="font-semibold text-gray-800">
                As of {trialBalanceData.as_of_date ? new Date(trialBalanceData.as_of_date).toLocaleDateString('en-GB') : 'Current Date'}
              </p>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Code", "Account Name", "Type", "Debit (Rs.)", "Credit (Rs.)"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TYPES.map((type) => {
                  const accounts = leafAccounts.filter((a) => a.type === type);
                  if (accounts.length === 0) return null;
                  
                  const subtotalDebit = accounts.reduce((s, a) => s + a.debit, 0);
                  const subtotalCredit = accounts.reduce((s, a) => s + a.credit, 0);
                  
                  return (
                    <React.Fragment key={type}>
                      <tr className="bg-gray-50/80">
                        <td colSpan={5} className="px-4 py-2 text-xs font-bold text-gray-600 uppercase tracking-wide">{type}</td>
                      </tr>
                      {accounts.map((acc) => (
                        <tr key={acc.id} className="hover:bg-gray-50/50 border-t border-gray-50">
                          <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{acc.code}</td>
                          <td className="px-4 py-2.5 text-gray-700" style={{ paddingLeft: `${16 + acc.level * 16}px` }}>{acc.name}</td>
                          <td className="px-4 py-2.5"><AccountTypeBadge type={acc.type} /></td>
                          <td className="px-4 py-2.5 text-gray-800">{acc.debit > 0 ? fmt(acc.debit) : "—"}</td>
                          <td className="px-4 py-2.5 text-gray-600">{acc.credit > 0 ? fmt(acc.credit) : "—"}</td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 border-t border-gray-200">
                        <td colSpan={3} className="px-4 py-2 text-xs font-semibold text-gray-600">Total {type}</td>
                        <td className="px-4 py-2 font-semibold text-gray-800">{subtotalDebit > 0 ? fmt(subtotalDebit) : "—"}</td>
                        <td className="px-4 py-2 font-semibold text-gray-800">{subtotalCredit > 0 ? fmt(subtotalCredit) : "—"}</td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
              <tfoot className="border-t-2 border-gray-300">
                <tr className="bg-gray-100">
                  <td colSpan={3} className="px-4 py-3 font-bold text-gray-800">Grand Total</td>
                  <td className="px-4 py-3 font-bold text-gray-800">{fmt(grandDebit)}</td>
                  <td className="px-4 py-3 font-bold text-gray-800">{fmt(grandCredit)}</td>
                </tr>
              </tfoot>
            </table>
            <div className={`px-5 py-3 flex items-center gap-2 text-sm font-medium ${balanced ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
              {balanced ? "✓ Trial Balance is balanced" : `⚠ Difference: ${fmt(Math.abs(grandDebit - grandCredit))}`}
            </div>
          </div>
        )}

        {generated && trialBalanceData && leafAccounts.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-12 shadow-sm text-center">
            <p className="text-gray-400 text-sm">No accounts with balances found for the selected date.</p>
          </div>
        )}

        {!generated && (
          <div className="bg-white rounded-xl border border-gray-100 p-12 shadow-sm text-center">
            <p className="text-gray-400 text-sm">Select a date and click Generate to view the trial balance.</p>
          </div>
        )}
      </div>
    </div>
  );
}
