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
  return <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">{title}</p>;
}

function Row({ label, amount, bold, indent }: { label: string; amount: number; bold?: boolean; indent?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-1.5 ${bold ? "border-t border-gray-200 mt-1" : ""}`} style={{ paddingLeft: indent ? "24px" : "0" }}>
      <span className={`text-sm ${bold ? "font-bold text-gray-900" : "text-gray-700"}`}>{label}</span>
      <span className={`text-sm font-mono ${bold ? "font-bold text-gray-900" : "text-gray-800"}`}>{fmt(amount)}</span>
    </div>
  );
}

function AssetSection({ data }: { data: BalanceSheetData }) {
  return (
    <div className="space-y-1">
      <Section title="Assets" />
      {data.assets.current.length > 0 && (
        <>
          <p className="text-xs font-semibold text-gray-600 mb-1">Current Assets</p>
          {data.assets.current.map((a) => <Row key={a.id} label={a.name} amount={a.amount} indent />)}
          <Row label="Total Current Assets" amount={data.assets.total_current} bold />
        </>
      )}
      {data.assets.fixed.length > 0 && (
        <>
          <p className="text-xs font-semibold text-gray-600 mt-4 mb-1">Fixed Assets</p>
          {data.assets.fixed.map((a) => <Row key={a.id} label={a.name} amount={a.amount} indent />)}
          <Row label="Total Fixed Assets" amount={data.assets.total_fixed} bold />
        </>
      )}
      {data.assets.other.length > 0 && (
        <>
          <p className="text-xs font-semibold text-gray-600 mt-4 mb-1">Other Assets</p>
          {data.assets.other.map((a) => <Row key={a.id} label={a.name} amount={a.amount} indent />)}
          <Row label="Total Other Assets" amount={data.assets.total_other} bold />
        </>
      )}
      <div className="mt-4 bg-blue-50 rounded-lg px-4 py-3 flex items-center justify-between">
        <span className="font-bold text-gray-900">Total Assets</span>
        <span className="font-bold text-blue-700 text-lg">{fmt(data.assets.total)}</span>
      </div>
    </div>
  );
}

function LiabilitiesEquitySection({ data }: { data: BalanceSheetData }) {
  return (
    <div className="space-y-1">
      <Section title="Liabilities" />
      {data.liabilities.current.length > 0 && (
        <>
          <p className="text-xs font-semibold text-gray-600 mb-1">Current Liabilities</p>
          {data.liabilities.current.map((l) => <Row key={l.id} label={l.name} amount={l.amount} indent />)}
          <Row label="Total Current Liabilities" amount={data.liabilities.total_current} bold />
        </>
      )}
      {data.liabilities.long_term.length > 0 && (
        <>
          <p className="text-xs font-semibold text-gray-600 mt-4 mb-1">Long-term Liabilities</p>
          {data.liabilities.long_term.map((l) => <Row key={l.id} label={l.name} amount={l.amount} indent />)}
          <Row label="Total Long-term Liabilities" amount={data.liabilities.total_long_term} bold />
        </>
      )}
      {data.liabilities.other.length > 0 && (
        <>
          <p className="text-xs font-semibold text-gray-600 mt-4 mb-1">Other Liabilities</p>
          {data.liabilities.other.map((l) => <Row key={l.id} label={l.name} amount={l.amount} indent />)}
          <Row label="Total Other Liabilities" amount={data.liabilities.total_other} bold />
        </>
      )}
      <div className="mt-4 bg-red-50 rounded-lg px-4 py-3 flex items-center justify-between">
        <span className="font-bold text-gray-900">Total Liabilities</span>
        <span className="font-bold text-red-600 text-lg">{fmt(data.liabilities.total)}</span>
      </div>

      <div className="mt-6">
        <Section title="Equity" />
        {data.equity.accounts.map((e) => <Row key={e.id} label={e.name} amount={e.amount} indent />)}
        {data.equity.accounts.length === 0 && (
          <p className="text-sm text-gray-400 italic px-6 py-2">No equity accounts</p>
        )}
        <div className="mt-4 bg-purple-50 rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="font-bold text-gray-900">Total Equity</span>
          <span className="font-bold text-purple-700 text-lg">{fmt(data.equity.total)}</span>
        </div>
      </div>
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
  const totalLiabEquity = bsData?.total_liabilities_equity || 0;
  const balanced = bsData?.is_balanced ?? true;

  if (loading) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <DashHeader title="Balance Sheet" subtitle="Assets, liabilities and equity" />
        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center w-full min-h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22C55E] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading balance sheet...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader title="Balance Sheet" subtitle="Assets, liabilities and equity" />
      <div className="flex-1 overflow-y-auto p-6 space-y-4 w-full">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 lg:p-6 w-full">
          <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Generate Report</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-end">
            <div className="sm:col-span-2 lg:col-span-2">
              <Label className="text-sm mb-1.5 block">As of Date</Label>
              <Input 
                type="date"
                value={asOf} 
                onChange={(e) => {
                  setAsOf(e.target.value);
                  setGenerated(false);
                }} 
                className="h-9 text-sm border-gray-200 w-full" 
                disabled={loading}
              />
            </div>
            <div>
              <Button 
                onClick={handleGenerate} 
                disabled={loading}
                className="w-full h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white"
              >
                {loading ? 'Generating...' : 'Generate'}
              </Button>
            </div>
            {generated && bsData && (
              <div>
                <Button 
                  variant="outline" 
                  className="w-full h-9 gap-1.5 text-gray-600 border-gray-200"
                  onClick={handleExportCSV}
                >
                  <Download className="h-4 w-4" /> Export CSV
                </Button>
              </div>
            )}
          </div>
        </div>

        {generated && bsData && (
          <div className="space-y-4 w-full">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 w-full text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Balance Sheet</p>
              <p className="text-lg font-bold text-gray-900">Statement of Financial Position</p>
              <p className="text-sm text-gray-500">
                As of {bsData.as_of_date ? new Date(bsData.as_of_date).toLocaleDateString('en-GB') : 'Current Date'}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 w-full">
                <AssetSection data={bsData} />
              </div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 w-full">
                <LiabilitiesEquitySection data={bsData} />
              </div>
            </div>

            <div className={`bg-white rounded-xl border shadow-sm p-6 lg:p-8 w-full ${balanced ? "border-green-100" : "border-red-100"}`}>
              <div className={`rounded-lg px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${balanced ? "bg-green-50" : "bg-red-50"}`}>
                <div>
                  <span className="font-bold text-gray-900 text-lg block">Total Liabilities + Equity</span>
                  <span className={`text-sm font-medium ${balanced ? "text-green-700" : "text-red-600"}`}>
                    {balanced ? "✓ Balance sheet is balanced" : `⚠ Difference: ${fmt(Math.abs(totalAssets - totalLiabEquity))}`}
                  </span>
                </div>
                <div className="sm:text-right">
                  <span className={`font-bold text-2xl ${balanced ? "text-[#22C55E]" : "text-red-600"}`}>{fmt(totalLiabEquity)}</span>
                  <p className="text-sm text-gray-500 mt-1">Total Assets: {fmt(totalAssets)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!generated && !loading && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center w-full">
            <p className="text-gray-400 text-sm">Select a date and click Generate to view the balance sheet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
