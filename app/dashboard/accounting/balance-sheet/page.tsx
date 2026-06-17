"use client";

import React, { useState } from "react";
import { Download } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashHeader } from "@/components/dashboard/dash-header";
import { accountsAPI } from "@/lib/api/accounting";

const fmt = (n: number) => `Rs. ${n.toLocaleString("en-IN")}`;

interface BSAccount {
  id: string;
  code: string;
  name: string;
  sub_type: string;
  amount: number;
}

interface BalanceSheetData {
  as_of_date: string;
  assets: {
    current: BSAccount[];
    fixed: BSAccount[];
    other: BSAccount[];
    total_current: number;
    total_fixed: number;
    total_other: number;
    total: number;
  };
  liabilities: {
    current: BSAccount[];
    long_term: BSAccount[];
    other: BSAccount[];
    total_current: number;
    total_long_term: number;
    total_other: number;
    total: number;
  };
  equity: {
    accounts: BSAccount[];
    total: number;
  };
  total_liabilities_equity: number;
  is_balanced: boolean;
}

function Section({ title }: { title: string }) {
  return <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-5 mb-2">{title}</p>;
}

function Row({ label, amount, bold, indent }: { label: string; amount: number; bold?: boolean; indent?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-1.5 ${bold ? "border-t border-gray-200 mt-1" : ""}`} style={{ paddingLeft: indent ? "24px" : "0" }}>
      <span className={`text-sm ${bold ? "font-bold text-gray-900" : "text-gray-700"}`}>{label}</span>
      <span className={`text-sm font-mono ${bold ? "font-bold text-gray-900" : "text-gray-800"}`}>{fmt(amount)}</span>
    </div>
  );
}

export default function BalanceSheetPage() {
  const [asOf, setAsOf] = useState("");
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bsData, setBsData] = useState<BalanceSheetData | null>(null);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      const params: { as_of_date?: string } = {};
      if (asOf) params.as_of_date = asOf;

      const data = await accountsAPI.balanceSheet(params);
      setBsData(data);
      setGenerated(true);
      toast.success('Balance sheet generated successfully');
    } catch (error: any) {
      console.error('Failed to generate balance sheet:', error);
      toast.error(error.response?.data?.detail || 'Failed to generate balance sheet');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!bsData) return;

    const rows = [
      ['Balance Sheet'],
      [`As of: ${bsData.as_of_date ? new Date(bsData.as_of_date).toLocaleDateString('en-GB') : 'Current Date'}`],
      [''],
      ['ASSETS'],
      ['Current Assets'],
      ...bsData.assets.current.map(acc => [acc.name, acc.amount.toFixed(2)]),
      ['Total Current Assets', bsData.assets.total_current.toFixed(2)],
      [''],
      ['Fixed Assets'],
      ...bsData.assets.fixed.map(acc => [acc.name, acc.amount.toFixed(2)]),
      ['Total Fixed Assets', bsData.assets.total_fixed.toFixed(2)],
      [''],
      ['TOTAL ASSETS', bsData.assets.total.toFixed(2)],
      [''],
      ['LIABILITIES'],
      ['Current Liabilities'],
      ...bsData.liabilities.current.map(acc => [acc.name, acc.amount.toFixed(2)]),
      ['Total Current Liabilities', bsData.liabilities.total_current.toFixed(2)],
      [''],
      ['TOTAL LIABILITIES', bsData.liabilities.total.toFixed(2)],
      [''],
      ['EQUITY'],
      ...bsData.equity.accounts.map(acc => [acc.name, acc.amount.toFixed(2)]),
      ['TOTAL EQUITY', bsData.equity.total.toFixed(2)],
      [''],
      ['TOTAL LIABILITIES + EQUITY', bsData.total_liabilities_equity.toFixed(2)],
    ];

    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `balance-sheet-${bsData.as_of_date || new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Balance sheet exported successfully');
  };

  const totalAssets = bsData?.assets.total || 0;
  const totalLiabilities = bsData?.liabilities.total || 0;
  const totalEquity = bsData?.equity.total || 0;
  const totalLiabEquity = bsData?.total_liabilities_equity || 0;
  const balanced = bsData?.is_balanced ?? true;

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Balance Sheet" subtitle="Assets, liabilities and equity" />
        <div className="flex-1 p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22C55E]"></div>
            <span className="ml-3 text-gray-600">Loading balance sheet...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Balance Sheet" subtitle="Assets, liabilities and equity" />
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
                disabled={loading}
              />
            </div>
            <Button 
              onClick={handleGenerate} 
              disabled={loading}
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white px-6"
            >
              {loading ? 'Generating...' : 'Generate'}
            </Button>
            {generated && bsData && (
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

        {generated && bsData && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 max-w-2xl">
            <div className="text-center mb-6">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Balance Sheet</p>
              <p className="text-lg font-bold text-gray-900">Statement of Financial Position</p>
              <p className="text-sm text-gray-500">
                As of {bsData.as_of_date ? new Date(bsData.as_of_date).toLocaleDateString('en-GB') : 'Current Date'}
              </p>
            </div>

            <Section title="ASSETS" />
            {bsData.assets.current.length > 0 && (
              <>
                <p className="text-xs font-semibold text-gray-600 mb-1">Current Assets</p>
                {bsData.assets.current.map((a) => <Row key={a.id} label={a.name} amount={a.amount} indent />)}
                <Row label="Total Current Assets" amount={bsData.assets.total_current} bold />
              </>
            )}

            {bsData.assets.fixed.length > 0 && (
              <>
                <p className="text-xs font-semibold text-gray-600 mt-4 mb-1">Fixed Assets</p>
                {bsData.assets.fixed.map((a) => <Row key={a.id} label={a.name} amount={a.amount} indent />)}
                <Row label="Total Fixed Assets" amount={bsData.assets.total_fixed} bold />
              </>
            )}

            {bsData.assets.other.length > 0 && (
              <>
                <p className="text-xs font-semibold text-gray-600 mt-4 mb-1">Other Assets</p>
                {bsData.assets.other.map((a) => <Row key={a.id} label={a.name} amount={a.amount} indent />)}
                <Row label="Total Other Assets" amount={bsData.assets.total_other} bold />
              </>
            )}

            <div className="mt-2 bg-blue-50 rounded-lg px-4 py-3 flex items-center justify-between">
              <span className="font-bold text-gray-900">TOTAL ASSETS</span>
              <span className="font-bold text-blue-700 text-lg">{fmt(totalAssets)}</span>
            </div>

            <Section title="LIABILITIES" />
            {bsData.liabilities.current.length > 0 && (
              <>
                <p className="text-xs font-semibold text-gray-600 mb-1">Current Liabilities</p>
                {bsData.liabilities.current.map((l) => <Row key={l.id} label={l.name} amount={l.amount} indent />)}
                <Row label="Total Current Liabilities" amount={bsData.liabilities.total_current} bold />
              </>
            )}

            {bsData.liabilities.long_term.length > 0 && (
              <>
                <p className="text-xs font-semibold text-gray-600 mt-4 mb-1">Long-term Liabilities</p>
                {bsData.liabilities.long_term.map((l) => <Row key={l.id} label={l.name} amount={l.amount} indent />)}
                <Row label="Total Long-term Liabilities" amount={bsData.liabilities.total_long_term} bold />
              </>
            )}

            {bsData.liabilities.other.length > 0 && (
              <>
                <p className="text-xs font-semibold text-gray-600 mt-4 mb-1">Other Liabilities</p>
                {bsData.liabilities.other.map((l) => <Row key={l.id} label={l.name} amount={l.amount} indent />)}
                <Row label="Total Other Liabilities" amount={bsData.liabilities.total_other} bold />
              </>
            )}

            <div className="mt-2 bg-red-50 rounded-lg px-4 py-3 flex items-center justify-between">
              <span className="font-bold text-gray-900">TOTAL LIABILITIES</span>
              <span className="font-bold text-red-600 text-lg">{fmt(totalLiabilities)}</span>
            </div>

            <Section title="EQUITY" />
            {bsData.equity.accounts.map((e) => <Row key={e.id} label={e.name} amount={e.amount} indent />)}
            {bsData.equity.accounts.length === 0 && (
              <p className="text-sm text-gray-400 italic px-6 py-2">No equity accounts</p>
            )}
            <div className="mt-2 bg-purple-50 rounded-lg px-4 py-3 flex items-center justify-between">
              <span className="font-bold text-gray-900">TOTAL EQUITY</span>
              <span className="font-bold text-purple-700 text-lg">{fmt(totalEquity)}</span>
            </div>

            <div className={`mt-4 rounded-lg px-4 py-3 flex items-center justify-between ${balanced ? "bg-green-50" : "bg-red-50"}`}>
              <span className="font-bold text-gray-900">TOTAL LIABILITIES + EQUITY</span>
              <span className={`font-bold text-lg ${balanced ? "text-[#22C55E]" : "text-red-600"}`}>{fmt(totalLiabEquity)}</span>
            </div>

            <div className={`mt-3 flex items-center gap-2 text-sm font-medium px-2 ${balanced ? "text-green-700" : "text-red-600"}`}>
              {balanced ? "✓ Balance Sheet is balanced" : `⚠ Difference: ${fmt(Math.abs(totalAssets - totalLiabEquity))}`}
            </div>
          </div>
        )}

        {!generated && !loading && (
          <div className="bg-white rounded-xl border border-gray-100 p-12 shadow-sm text-center">
            <p className="text-gray-400 text-sm">Select a date and click Generate to view the balance sheet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
