"use client";

import { PageLoading } from "@/components/shared/PageLoading";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Download, FileText } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { DashHeader } from "@/components/dashboard/dash-header";
import { DateInput } from "@/components/shared/DateInput";
import { useDateSystem } from "@/lib/context/DateSystemContext";
import { useAuth } from "@/lib/context/AuthContext";
import { accountsAPI } from "@/lib/api/accounting";
import {
  exportTableAsCsv,
  exportTableAsPdf,
  tenantToExportOrg,
  type ExportRow,
  type ExportTableData,
} from "@/lib/utils/export";

const PERIODS = ["This Month", "This Quarter", "This Year", "Custom"] as const;
const fmt = (n: number) =>
  `Rs. ${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
  cogs?: {
    accounts: PLAccount[];
    total: number;
  };
  gross_profit?: number;
  operating_expenses_total?: number;
  expenses: {
    accounts: PLAccount[];
    total: number;
  };
  net_profit: number;
  net_margin: number;
}

function normalizePLData(data: PLData): PLData {
  const normalizeAccounts = (accounts: PLAccount[]) =>
    (accounts || []).map((acc) => ({
      ...acc,
      amount: Number(acc.amount) || 0 }));

  return {
    ...data,
    income: {
      accounts: normalizeAccounts(data.income?.accounts),
      total: Number(data.income?.total) || 0 },
    cogs: data.cogs
      ? {
          accounts: normalizeAccounts(data.cogs.accounts),
          total: Number(data.cogs.total) || 0,
        }
      : undefined,
    gross_profit: data.gross_profit != null ? Number(data.gross_profit) : undefined,
    operating_expenses_total:
      data.operating_expenses_total != null ? Number(data.operating_expenses_total) : undefined,
    expenses: {
      accounts: normalizeAccounts(data.expenses?.accounts),
      total: Number(data.expenses?.total) || 0 },
    net_profit: Number(data.net_profit) || 0,
    net_margin: Number(data.net_margin) || 0 };
}

function getPeriodDates(period: (typeof PERIODS)[number]): { from: string; to: string } | null {
  const today = new Date();
  let from = new Date();
  let to = new Date();

  switch (period) {
    case "This Month":
      from = new Date(today.getFullYear(), today.getMonth(), 1);
      to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      break;
    case "This Quarter": {
      const quarter = Math.floor(today.getMonth() / 3);
      from = new Date(today.getFullYear(), quarter * 3, 1);
      to = new Date(today.getFullYear(), quarter * 3 + 3, 0);
      break;
    }
    case "This Year":
      from = new Date(today.getFullYear(), 0, 1);
      to = new Date(today.getFullYear(), 11, 31);
      break;
    case "Custom":
      return null;
  }

  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0] };
}

function ReportRow({
  label,
  amount,
  bold,
  indent,
  accountId }: {
  label: string;
  amount: number;
  bold?: boolean;
  indent?: boolean;
  accountId?: string;
}) {
  const amtStr = amount < 0 ? `(${fmt(Math.abs(amount))})` : fmt(amount);
  return (
    <div
      className={`flex items-center justify-between py-2 ${bold ? "border-t border-gray-200 mt-1" : ""}`}
      style={{ paddingLeft: indent ? "24px" : "0" }}
    >
      <span className={`text-sm ${bold ? "font-bold text-gray-900" : "text-gray-700"}`}>
        {accountId ? (
          <Link href={`/dashboard/accounting/chart-of-accounts/${accountId}`} className="text-[#22C55E] hover:underline">
            {label}
          </Link>
        ) : (
          label
        )}
      </span>
      <span className={`text-sm font-mono ${bold ? "font-bold text-gray-900" : amount < 0 ? "text-red-600" : "text-gray-800"}`}>
        {amtStr}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="border-t border-gray-200 my-1" />;
}

export default function ProfitLossPage() {
  const { formatDate } = useDateSystem();
  const { user } = useAuth();
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>("This Month");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [plData, setPlData] = useState<PLData | null>(null);

  useEffect(() => {
    const dates = getPeriodDates(period);
    if (dates) {
      setFromDate(dates.from);
      setToDate(dates.to);
    }
  }, [period]);

  const fetchProfitLoss = useCallback(async () => {
    if (!fromDate || !toDate) {
      toast.error("Please select a date range");
      return;
    }

    try {
      setLoading(true);
      const data = await accountsAPI.profitLoss({ from_date: fromDate, to_date: toDate });
      setPlData(normalizePLData(data));
    } catch (error: unknown) {
      console.error("Failed to generate P&L:", error);
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || "Failed to generate profit & loss statement");
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    if (fromDate && toDate && period !== "Custom") {
      fetchProfitLoss();
    }
  }, [fromDate, toDate, period, fetchProfitLoss]);

  const totalIncome = plData?.income.total || 0;
  const totalCogs = plData?.cogs?.total || 0;
  const grossProfit = plData?.gross_profit ?? totalIncome - totalCogs;
  const totalExpenses = plData?.operating_expenses_total ?? plData?.expenses.total ?? 0;
  const netProfit = plData?.net_profit || 0;
  const netMargin = plData?.net_margin || 0;
  const hasActivity =
    totalIncome > 0 || totalExpenses > 0 || totalCogs > 0;

  const getExportData = useCallback((): ExportTableData | null => {
    if (!plData || !hasActivity) return null;

    const org = user?.tenant
      ? tenantToExportOrg({
          name: user.tenant.name,
          workspace_name: user.tenant.workspace_name,
          address: user.tenant.address,
          email: user.tenant.email,
        })
      : undefined;

    const rows: ExportRow[] = [
      { cells: ["INCOME", "", ""], style: "section" },
      ...plData.income.accounts.map((acc) => ({
        cells: ["", `${acc.code} — ${acc.name}`, acc.amount.toFixed(2)],
      })),
      { cells: ["", "Total Income", totalIncome.toFixed(2)], style: "subtotal" },
    ];

    if (plData.cogs && plData.cogs.accounts.length > 0) {
      rows.push(
        { cells: ["COST OF GOODS SOLD", "", ""], style: "section" },
        ...plData.cogs.accounts.map((acc) => ({
          cells: ["", `${acc.code} — ${acc.name}`, acc.amount.toFixed(2)],
        })),
        { cells: ["", "Total COGS", totalCogs.toFixed(2)], style: "subtotal" },
        { cells: ["", "Gross Profit", grossProfit.toFixed(2)], style: "subtotal" }
      );
    }

    rows.push(
      { cells: ["OPERATING EXPENSES", "", ""], style: "section" },
      ...plData.expenses.accounts.map((acc) => ({
        cells: ["", `${acc.code} — ${acc.name}`, acc.amount.toFixed(2)],
      })),
      { cells: ["", "Total Expenses", totalExpenses.toFixed(2)], style: "subtotal" },
      {
        cells: [
          netProfit >= 0 ? "NET PROFIT" : "NET LOSS",
          "",
          Math.abs(netProfit).toFixed(2),
        ],
        style: "total",
      },
      { cells: ["", "Net Margin", `${netMargin.toFixed(1)}%`] }
    );

    return {
      filename: `profit-loss-${plData.from_date}-to-${plData.to_date}`,
      title: "Profit & Loss Statement",
      subtitle: `${formatDate(plData.from_date)} to ${formatDate(plData.to_date)}`,
      reportType: "Profit & Loss",
      template: "financial",
      headers: ["Category", "Account", "Amount"],
      rightAlignColumns: [2],
      org,
      rows,
    };
  }, [
    plData,
    hasActivity,
    totalIncome,
    totalCogs,
    grossProfit,
    totalExpenses,
    netProfit,
    netMargin,
    formatDate,
    user?.tenant,
  ]);

  const handleExport = (format: "csv" | "pdf") => {
    const data = getExportData();
    if (!data) {
      toast.error("No data to export");
      return;
    }

    try {
      if (format === "csv") {
        exportTableAsCsv(data);
        toast.success("CSV exported");
      } else {
        exportTableAsPdf(data);
        toast.success("Print dialog opened — choose Save as PDF as the destination");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to export";
      toast.error(message);
    }
  };

  if (loading && !plData) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <DashHeader title="Profit & Loss Statement" subtitle="Income and expense summary" />
        <PageLoading message="Loading profit & loss…" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader title="Profit & Loss Statement" subtitle="Income and expense summary" />
      <div className="flex-1 overflow-y-auto p-6 space-y-4 w-full">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 lg:p-6 w-full">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 flex-1 min-w-0">
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg shrink-0 self-start sm:self-auto">
                {PERIODS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      period === p ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              {period === "Custom" ? (
                <div className="flex flex-row flex-nowrap items-end gap-2 min-w-0">
                  <DateInput
                    value={fromDate}
                    onChange={setFromDate}
                    disabled={loading}
                    className="w-auto min-w-[150px]"
                  />
                  <span className="text-sm text-gray-500 shrink-0 pb-2.5">to</span>
                  <DateInput
                    value={toDate}
                    onChange={setToDate}
                    disabled={loading}
                    className="w-auto min-w-[150px]"
                  />
                  <Button
                    onClick={fetchProfitLoss}
                    disabled={loading}
                    className="h-9 shrink-0 bg-[#22C55E] hover:bg-[#16A34A] text-white px-6"
                  >
                    {loading ? "Generating..." : "Generate"}
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-gray-500 pb-2">
                  {fromDate && toDate ? `${formatDate(fromDate)} – ${formatDate(toDate)}` : ""}
                </p>
              )}
            </div>
            <div className="flex gap-2 shrink-0 lg:ml-4">
              <Button
                variant="outline"
                className="h-9 gap-1.5 text-gray-600 border-gray-200"
                onClick={() => handleExport("csv")}
                disabled={!plData || !hasActivity}
              >
                <Download className="h-3.5 w-3.5" /> CSV
              </Button>
              <Button
                variant="outline"
                className="h-9 gap-1.5 text-gray-600 border-gray-200"
                onClick={() => handleExport("pdf")}
                disabled={!plData || !hasActivity}
              >
                <FileText className="h-3.5 w-3.5" /> PDF
              </Button>
            </div>
          </div>
        </div>

        {plData && (
          <div className="space-y-4 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Total Income</p>
                <p className="text-xl font-bold text-gray-800 mt-1">{fmt(totalIncome)}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Cost of Goods Sold</p>
                <p className="text-xl font-bold text-gray-800 mt-1">{fmt(totalCogs)}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Gross Profit</p>
                <p className="text-xl font-bold text-[#22C55E] mt-1">{fmt(grossProfit)}</p>
              </div>
              <div
                className={`rounded-xl border shadow-sm p-4 ${netProfit >= 0 ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"}`}
              >
                <p className="text-xs text-gray-500 uppercase tracking-wide">Net Profit</p>
                <p className={`text-xl font-bold mt-1 ${netProfit >= 0 ? "text-green-700" : "text-red-600"}`}>{fmt(netProfit)}</p>
                <p className="text-xs text-gray-500 mt-1">Margin: {netMargin.toFixed(1)}%</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 w-full text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Profit & Loss Statement</p>
              <p className="text-lg font-bold text-gray-900">Income & Expense Summary</p>
              <p className="text-sm text-gray-500">
                {formatDate(plData.from_date)} to {formatDate(plData.to_date)}
              </p>
            </div>

            {!hasActivity ? (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center w-full">
                <p className="text-gray-500 text-sm font-medium">No income or expense activity in this period</p>
                <p className="text-gray-400 text-sm mt-2">
                  Post journal entries to Income or Expense accounts, or try a wider date range.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 w-full">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Income</p>
                  <div className="space-y-0.5">
                    {plData.income.accounts.map((acc) => (
                      <ReportRow
                        key={acc.id}
                        label={`${acc.code} — ${acc.name}`}
                        amount={acc.amount}
                        indent
                        accountId={String(acc.id)}
                      />
                    ))}
                    {plData.income.accounts.length === 0 && (
                      <p className="text-sm text-gray-400 italic px-6 py-2">No income in this period</p>
                    )}
                    <Divider />
                    <ReportRow label="Total Income" amount={totalIncome} bold />
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 w-full">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Operating Expenses</p>
                  <div className="space-y-0.5">
                    {plData.expenses.accounts.map((acc) => (
                      <ReportRow
                        key={acc.id}
                        label={`${acc.code} — ${acc.name}`}
                        amount={acc.amount}
                        indent
                        accountId={String(acc.id)}
                      />
                    ))}
                    {plData.expenses.accounts.length === 0 && (
                      <p className="text-sm text-gray-400 italic px-6 py-2">No expenses in this period</p>
                    )}
                    <Divider />
                    <ReportRow label="Total Expenses" amount={totalExpenses} bold />
                  </div>
                </div>
              </div>
            )}

            {hasActivity && (
              <div
                className={`bg-white rounded-xl border shadow-sm p-6 lg:p-8 w-full ${netProfit >= 0 ? "border-green-100" : "border-red-100"}`}
              >
                <div
                  className={`rounded-lg px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${netProfit >= 0 ? "bg-green-50" : "bg-red-50"}`}
                >
                  <span className="font-bold text-gray-900 text-lg">Net Profit</span>
                  <div className="sm:text-right">
                    <span className={`font-bold text-2xl ${netProfit >= 0 ? "text-[#22C55E]" : "text-red-600"}`}>
                      {fmt(netProfit)}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">Margin: {netMargin.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {!plData && !loading && period === "Custom" && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center w-full">
            <p className="text-gray-400 text-sm">Select a custom date range and click Generate.</p>
          </div>
        )}
      </div>
    </div>
  );
}
