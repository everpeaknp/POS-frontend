"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { DashHeader } from "@/components/dashboard/dash-header";
import { accountsAPI } from "@/lib/api/accounting";

const PERIODS = ["This Month", "This Quarter", "This Year", "Custom"];
const fmt = (n: number) => `Rs. ${n.toLocaleString("en-IN")}`;

interface PLAccount {
  id: string;
  code: string;
  name: string;
  sub_type: string;
  amount: number;
}

interface PLData {
  from_date: string;
  to_date: string;
  income: {
    accounts: PLAccount[];
    total: number;
  };
  expenses: {
    accounts: PLAccount[];
    total: number;
  };
  net_profit: number;
  net_margin: number;
}

function ReportRow({ label, amount, bold, indent, link }: { label: string; amount: number; bold?: boolean; indent?: boolean; link?: string }) {
  const amtStr = amount < 0 ? `(${fmt(Math.abs(amount))})` : fmt(amount);
  return (
    <div className={`flex items-center justify-between py-2 ${bold ? "border-t border-gray-200 mt-1" : ""}`} style={{ paddingLeft: indent ? "24px" : "0" }}>
      <span className={`text-sm ${bold ? "font-bold text-gray-900" : "text-gray-700"}`}>
        {link ? <Link href={`/dashboard/accounting/chart-of-accounts`} className="text-[#22C55E] hover:underline">{label}</Link> : label}
      </span>
      <span className={`text-sm font-mono ${bold ? "font-bold text-gray-900" : amount < 0 ? "text-red-600" : "text-gray-800"}`}>{amtStr}</span>
    </div>
  );
}

function Divider() {
  return <div className="border-t border-gray-200 my-1" />;
}

export default function ProfitLossPage() {
  const [period, setPeriod] = useState("This Month");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [plData, setPlData] = useState<PLData | null>(null);

  useEffect(() => {
    const today = new Date();
    let from = new Date();
    let to = new Date();

    switch (period) {
      case "This Month":
        from = new Date(today.getFullYear(), today.getMonth(), 1);
        to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case "This Quarter":
        const quarter = Math.floor(today.getMonth() / 3);
        from = new Date(today.getFullYear(), quarter * 3, 1);
        to = new Date(today.getFullYear(), quarter * 3 + 3, 0);
        break;
      case "This Year":
        from = new Date(today.getFullYear(), 0, 1);
        to = new Date(today.getFullYear(), 11, 31);
        break;
      case "Custom":
        return;
    }

    setFromDate(from.toISOString().split('T')[0]);
    setToDate(to.toISOString().split('T')[0]);
  }, [period]);

  useEffect(() => {
    if (fromDate && toDate && period !== "Custom") {
      fetchProfitLoss();
    }
  }, [fromDate, toDate]);

  const fetchProfitLoss = async () => {
    if (!fromDate || !toDate) {
      toast.error('Please select date range');
      return;
    }

    try {
      setLoading(true);
      const data = await accountsAPI.profitLoss({ from_date: fromDate, to_date: toDate });
      setPlData(data);
    } catch (error: any) {
      console.error('Failed to generate P&L:', error);
      toast.error(error.response?.data?.detail || 'Failed to generate profit & loss statement');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!plData) return;

    const rows = [
      ['Profit & Loss Statement'],
      [`Period: ${new Date(plData.from_date).toLocaleDateString('en-GB')} to ${new Date(plData.to_date).toLocaleDateString('en-GB')}`],
      [''],
      ['INCOME'],
      ...plData.income.accounts.map(acc => [acc.name, acc.amount.toFixed(2)]),
      ['Total Income', plData.income.total.toFixed(2)],
      [''],
      ['EXPENSES'],
      ...plData.expenses.accounts.map(acc => [acc.name, acc.amount.toFixed(2)]),
      ['Total Expenses', plData.expenses.total.toFixed(2)],
      [''],
      ['NET PROFIT', plData.net_profit.toFixed(2)],
      ['Net Margin', `${plData.net_margin.toFixed(2)}%`],
    ];

    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profit-loss-${plData.from_date}-to-${plData.to_date}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('P&L exported successfully');
  };

  const totalIncome = plData?.income.total || 0;
  const totalExpenses = plData?.expenses.total || 0;
  const netProfit = plData?.net_profit || 0;
  const netMargin = plData?.net_margin || 0;

  if (loading) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <DashHeader title="Profit & Loss Statement" subtitle="Income and expense summary" />
        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center w-full min-h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22C55E] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading profit & loss...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader title="Profit & Loss Statement" subtitle="Income and expense summary" />
      <div className="flex-1 overflow-y-auto p-6 space-y-4 w-full">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 lg:p-6 w-full">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              {PERIODS.map((p) => (
                <button 
                  key={p} 
                  onClick={() => setPeriod(p)} 
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${period === p ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                  {p}
                </button>
              ))}
            </div>
            {period === "Custom" && (
              <div className="flex flex-wrap gap-2 items-center">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-9 px-3 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                />
                <span className="text-sm text-gray-500">to</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-9 px-3 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                />
                <Button 
                  onClick={fetchProfitLoss}
                  className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white"
                >
                  Generate
                </Button>
              </div>
            )}
            <Button 
              variant="outline" 
              className="h-9 gap-1.5 text-gray-600 border-gray-200"
              onClick={handleExportCSV}
              disabled={!plData}
            >
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>

        {plData && (
          <div className="space-y-4 w-full">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 w-full text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Profit & Loss Statement</p>
              <p className="text-lg font-bold text-gray-900">Income & Expense Summary</p>
              <p className="text-sm text-gray-500">
                {new Date(plData.from_date).toLocaleDateString('en-GB')} to {new Date(plData.to_date).toLocaleDateString('en-GB')}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 w-full">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Income</p>
                <div className="space-y-0.5">
                  {plData.income.accounts.map((acc) => (
                    <ReportRow key={acc.id} label={acc.name} amount={acc.amount} indent link={acc.id} />
                  ))}
                  {plData.income.accounts.length === 0 && (
                    <p className="text-sm text-gray-400 italic px-6 py-2">No income accounts</p>
                  )}
                  <Divider />
                  <ReportRow label="Total Income" amount={totalIncome} bold />
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 w-full">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Operating Expenses</p>
                <div className="space-y-0.5">
                  {plData.expenses.accounts.map((acc) => (
                    <ReportRow key={acc.id} label={acc.name} amount={acc.amount} indent link={acc.id} />
                  ))}
                  {plData.expenses.accounts.length === 0 && (
                    <p className="text-sm text-gray-400 italic px-6 py-2">No expense accounts</p>
                  )}
                  <Divider />
                  <ReportRow label="Total Expenses" amount={totalExpenses} bold />
                </div>
              </div>
            </div>

            <div className={`bg-white rounded-xl border shadow-sm p-6 lg:p-8 w-full ${netProfit >= 0 ? "border-green-100" : "border-red-100"}`}>
              <div className={`rounded-lg px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${netProfit >= 0 ? "bg-green-50" : "bg-red-50"}`}>
                <span className="font-bold text-gray-900 text-lg">Net Profit</span>
                <div className="sm:text-right">
                  <span className={`font-bold text-2xl ${netProfit >= 0 ? "text-[#22C55E]" : "text-red-600"}`}>{fmt(netProfit)}</span>
                  <p className="text-sm text-gray-500 mt-1">Margin: {netMargin.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!plData && !loading && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center w-full">
            <p className="text-gray-400 text-sm">Select a period to view the profit & loss statement.</p>
          </div>
        )}
      </div>
    </div>
  );
}
