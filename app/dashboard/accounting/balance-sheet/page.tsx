"use client";

import { PageLoading } from "@/components/shared/PageLoading";
import React, { useState, useCallback } from "react";
import Link from "next/link";
import { Download, FileText } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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

const fmt = (n: number) =>
  `Rs. ${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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

function normalizeAccount(acc: BSAccount): BSAccount {
  return { ...acc, amount: Number(acc.amount) || 0 };
}

function normalizeBalanceSheet(data: BalanceSheetData): BalanceSheetData {
  return {
    ...data,
    assets: {
      current: (data.assets?.current || []).map(normalizeAccount),
      fixed: (data.assets?.fixed || []).map(normalizeAccount),
      other: (data.assets?.other || []).map(normalizeAccount),
      total_current: Number(data.assets?.total_current) || 0,
      total_fixed: Number(data.assets?.total_fixed) || 0,
      total_other: Number(data.assets?.total_other) || 0,
      total: Number(data.assets?.total) || 0 },
    liabilities: {
      current: (data.liabilities?.current || []).map(normalizeAccount),
      long_term: (data.liabilities?.long_term || []).map(normalizeAccount),
      other: (data.liabilities?.other || []).map(normalizeAccount),
      total_current: Number(data.liabilities?.total_current) || 0,
      total_long_term: Number(data.liabilities?.total_long_term) || 0,
      total_other: Number(data.liabilities?.total_other) || 0,
      total: Number(data.liabilities?.total) || 0 },
    equity: {
      accounts: (data.equity?.accounts || []).map(normalizeAccount),
      total: Number(data.equity?.total) || 0 },
    total_liabilities_equity: Number(data.total_liabilities_equity) || 0,
    is_balanced: Boolean(data.is_balanced) };
}

function Section({ title }: { title: string }) {
  return <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">{title}</p>;
}

function Row({
  label,
  amount,
  bold,
  indent,
  accountId,
  italic }: {
  label: string;
  amount: number;
  bold?: boolean;
  indent?: boolean;
  accountId?: string;
  italic?: boolean;
}) {
  const amtStr = amount < 0 ? `(${fmt(Math.abs(amount))})` : fmt(amount);
  return (
    <div
      className={`flex items-center justify-between py-1.5 ${bold ? "border-t border-gray-200 mt-1" : ""}`}
      style={{ paddingLeft: indent ? "24px" : "0" }}
    >
      <span className={`text-sm ${bold ? "font-bold text-gray-900" : italic ? "italic text-gray-600" : "text-gray-700"}`}>
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

function AssetSection({ data }: { data: BalanceSheetData }) {
  const hasAssets =
    data.assets.current.length > 0 || data.assets.fixed.length > 0 || data.assets.other.length > 0;

  return (
    <div className="space-y-1">
      <Section title="Assets" />
      {!hasAssets && <p className="text-sm text-gray-400 italic px-2 py-2">No asset balances</p>}
      {data.assets.current.length > 0 && (
        <>
          <p className="text-xs font-semibold text-gray-600 mb-1">Current Assets</p>
          {data.assets.current.map((a) => (
            <Row key={a.id} label={`${a.code} — ${a.name}`} amount={a.amount} indent accountId={String(a.id)} />
          ))}
          <Row label="Total Current Assets" amount={data.assets.total_current} bold />
        </>
      )}
      {data.assets.fixed.length > 0 && (
        <>
          <p className="text-xs font-semibold text-gray-600 mt-4 mb-1">Fixed Assets</p>
          {data.assets.fixed.map((a) => (
            <Row key={a.id} label={`${a.code} — ${a.name}`} amount={a.amount} indent accountId={String(a.id)} />
          ))}
          <Row label="Total Fixed Assets" amount={data.assets.total_fixed} bold />
        </>
      )}
      {data.assets.other.length > 0 && (
        <>
          <p className="text-xs font-semibold text-gray-600 mt-4 mb-1">Other Assets</p>
          {data.assets.other.map((a) => (
            <Row key={a.id} label={`${a.code} — ${a.name}`} amount={a.amount} indent accountId={String(a.id)} />
          ))}
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
  const hasLiabilities =
    data.liabilities.current.length > 0 ||
    data.liabilities.long_term.length > 0 ||
    data.liabilities.other.length > 0;

  return (
    <div className="space-y-1">
      <Section title="Liabilities" />
      {!hasLiabilities && <p className="text-sm text-gray-400 italic px-2 py-2">No liability balances</p>}
      {data.liabilities.current.length > 0 && (
        <>
          <p className="text-xs font-semibold text-gray-600 mb-1">Current Liabilities</p>
          {data.liabilities.current.map((l) => (
            <Row key={l.id} label={`${l.code} — ${l.name}`} amount={l.amount} indent accountId={String(l.id)} />
          ))}
          <Row label="Total Current Liabilities" amount={data.liabilities.total_current} bold />
        </>
      )}
      {data.liabilities.long_term.length > 0 && (
        <>
          <p className="text-xs font-semibold text-gray-600 mt-4 mb-1">Long-term Liabilities</p>
          {data.liabilities.long_term.map((l) => (
            <Row key={l.id} label={`${l.code} — ${l.name}`} amount={l.amount} indent accountId={String(l.id)} />
          ))}
          <Row label="Total Long-term Liabilities" amount={data.liabilities.total_long_term} bold />
        </>
      )}
      {data.liabilities.other.length > 0 && (
        <>
          <p className="text-xs font-semibold text-gray-600 mt-4 mb-1">Other Liabilities</p>
          {data.liabilities.other.map((l) => (
            <Row key={l.id} label={`${l.code} — ${l.name}`} amount={l.amount} indent accountId={String(l.id)} />
          ))}
          <Row label="Total Other Liabilities" amount={data.liabilities.total_other} bold />
        </>
      )}
      <div className="mt-4 bg-red-50 rounded-lg px-4 py-3 flex items-center justify-between">
        <span className="font-bold text-gray-900">Total Liabilities</span>
        <span className="font-bold text-red-600 text-lg">{fmt(data.liabilities.total)}</span>
      </div>

      <div className="mt-6">
        <Section title="Equity" />
        {data.equity.accounts.map((e) => (
          <Row
            key={e.id}
            label={e.code ? `${e.code} — ${e.name}` : e.name}
            amount={e.amount}
            indent
            accountId={e.id !== "current-earnings" ? String(e.id) : undefined}
            italic={e.id === "current-earnings"}
          />
        ))}
        {data.equity.accounts.length === 0 && (
          <p className="text-sm text-gray-400 italic px-6 py-2">No equity balances</p>
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
  const { formatDate } = useDateSystem();
  const { user } = useAuth();
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
      setBsData(normalizeBalanceSheet(data));
      setGenerated(true);
      toast.success("Balance sheet generated successfully");
    } catch (error: unknown) {
      console.error("Failed to generate balance sheet:", error);
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || "Failed to generate balance sheet");
    } finally {
      setLoading(false);
    }
  };

  const totalAssets = bsData?.assets.total || 0;
  const totalLiabEquity = bsData?.total_liabilities_equity || 0;
  const balanced = bsData?.is_balanced ?? true;
  const hasActivity =
    (bsData?.assets.total || 0) !== 0 ||
    (bsData?.liabilities.total || 0) !== 0 ||
    (bsData?.equity.accounts.length || 0) > 0;

  const getExportData = useCallback((): ExportTableData | null => {
    if (!bsData || !hasActivity) return null;

    const asOfLabel = bsData.as_of_date ? formatDate(bsData.as_of_date) : "Today";
    const org = user?.tenant
      ? tenantToExportOrg({
          name: user.tenant.name,
          workspace_name: user.tenant.workspace_name,
          address: user.tenant.address,
          email: user.tenant.email,
        })
      : undefined;

    const rows: ExportRow[] = [];

    const addAccounts = (
      title: string,
      accounts: BSAccount[],
      subtotal: number,
      subtotalLabel: string
    ) => {
      if (accounts.length === 0) return;
      rows.push({ cells: [title, "", ""], style: "section" });
      for (const acc of accounts) {
        rows.push({
          cells: ["", `${acc.code} — ${acc.name}`, acc.amount.toFixed(2)],
        });
      }
      rows.push({
        cells: ["", subtotalLabel, subtotal.toFixed(2)],
        style: "subtotal",
      });
    };

    rows.push({ cells: ["ASSETS", "", ""], style: "section" });
    addAccounts("Current Assets", bsData.assets.current, bsData.assets.total_current, "Total Current Assets");
    addAccounts("Fixed Assets", bsData.assets.fixed, bsData.assets.total_fixed, "Total Fixed Assets");
    addAccounts("Other Assets", bsData.assets.other, bsData.assets.total_other, "Total Other Assets");
    rows.push({
      cells: ["", "Total Assets", bsData.assets.total.toFixed(2)],
      style: "total",
    });

    rows.push({ cells: ["LIABILITIES", "", ""], style: "section" });
    addAccounts(
      "Current Liabilities",
      bsData.liabilities.current,
      bsData.liabilities.total_current,
      "Total Current Liabilities"
    );
    addAccounts(
      "Long-term Liabilities",
      bsData.liabilities.long_term,
      bsData.liabilities.total_long_term,
      "Total Long-term Liabilities"
    );
    addAccounts(
      "Other Liabilities",
      bsData.liabilities.other,
      bsData.liabilities.total_other,
      "Total Other Liabilities"
    );
    rows.push({
      cells: ["", "Total Liabilities", bsData.liabilities.total.toFixed(2)],
      style: "subtotal",
    });

    rows.push({ cells: ["EQUITY", "", ""], style: "section" });
    for (const acc of bsData.equity.accounts) {
      rows.push({
        cells: ["", acc.code ? `${acc.code} — ${acc.name}` : acc.name, acc.amount.toFixed(2)],
      });
    }
    rows.push({
      cells: ["", "Total Equity", bsData.equity.total.toFixed(2)],
      style: "subtotal",
    });

    rows.push({
      cells: ["", "Total Liabilities + Equity", bsData.total_liabilities_equity.toFixed(2)],
      style: "total",
    });

    return {
      filename: `balance-sheet-${bsData.as_of_date || new Date().toISOString().split("T")[0]}`,
      title: "Balance Sheet",
      subtitle: `As of ${asOfLabel}${balanced ? "" : ` · Off by ${Math.abs(totalAssets - totalLiabEquity).toFixed(2)}`}`,
      reportType: "Balance Sheet",
      template: "financial",
      headers: ["Section", "Account", "Amount"],
      rightAlignColumns: [2],
      org,
      rows,
    };
  }, [bsData, hasActivity, formatDate, balanced, totalAssets, totalLiabEquity, user?.tenant]);

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

  if (loading && !bsData) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <DashHeader title="Balance Sheet" subtitle="Assets, liabilities and equity" />
        <PageLoading message="Loading balance sheet…" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader title="Balance Sheet" subtitle="Assets, liabilities and equity" />
      <div className="flex-1 overflow-y-auto p-6 space-y-4 w-full">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 lg:p-6 w-full">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="w-full sm:w-auto sm:min-w-[150px]">
                <Label className="text-sm mb-1.5 block">As of Date</Label>
                <DateInput
                  value={asOf}
                  onChange={(v) => {
                    setAsOf(v);
                    setGenerated(false);
                  }}
                  disabled={loading}
                />
              </div>
              <Button
                onClick={handleGenerate}
                disabled={loading}
                className="bg-[#22C55E] hover:bg-[#16A34A] text-white px-6 h-9 shrink-0"
              >
                {loading ? "Generating..." : "Generate"}
              </Button>
            </div>
            <div className="flex gap-2 shrink-0 sm:ml-auto">
              <Button
                variant="outline"
                className="h-9 gap-1.5 text-gray-600 border-gray-200"
                disabled={!generated || !hasActivity}
                onClick={() => handleExport("csv")}
              >
                <Download className="h-3.5 w-3.5" /> CSV
              </Button>
              <Button
                variant="outline"
                className="h-9 gap-1.5 text-gray-600 border-gray-200"
                disabled={!generated || !hasActivity}
                onClick={() => handleExport("pdf")}
              >
                <FileText className="h-3.5 w-3.5" /> PDF
              </Button>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1.5">Leave blank for today</p>
        </div>

        {generated && bsData && (
          <div className="space-y-4 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Total Assets</p>
                <p className="text-xl font-bold text-blue-700 mt-1">{fmt(totalAssets)}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Liabilities + Equity</p>
                <p className="text-xl font-bold text-purple-700 mt-1">{fmt(totalLiabEquity)}</p>
              </div>
              <div
                className={`rounded-xl border shadow-sm p-4 ${balanced ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"}`}
              >
                <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
                <p className={`text-xl font-bold mt-1 ${balanced ? "text-green-700" : "text-red-600"}`}>
                  {balanced ? "Balanced" : `Off by ${fmt(Math.abs(totalAssets - totalLiabEquity))}`}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 w-full text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Balance Sheet</p>
              <p className="text-lg font-bold text-gray-900">Statement of Financial Position</p>
              <p className="text-sm text-gray-500">
                As of {bsData.as_of_date ? formatDate(bsData.as_of_date) : "Today"}
              </p>
            </div>

            {!hasActivity ? (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center w-full">
                <p className="text-gray-500 text-sm font-medium">No balance sheet activity found</p>
                <p className="text-gray-400 text-sm mt-2">
                  Post journal entries to Assets, Liabilities, or Equity accounts, or try a different date.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 w-full">
                  <AssetSection data={bsData} />
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 w-full">
                  <LiabilitiesEquitySection data={bsData} />
                </div>
              </div>
            )}

            {hasActivity && (
              <div className={`bg-white rounded-xl border shadow-sm p-6 lg:p-8 w-full ${balanced ? "border-green-100" : "border-red-100"}`}>
                <div
                  className={`rounded-lg px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${balanced ? "bg-green-50" : "bg-red-50"}`}
                >
                  <div>
                    <span className="font-bold text-gray-900 text-lg block">Total Liabilities + Equity</span>
                    <span className={`text-sm font-medium ${balanced ? "text-green-700" : "text-red-600"}`}>
                      {balanced ? "✓ Balance sheet is balanced" : `⚠ Difference: ${fmt(Math.abs(totalAssets - totalLiabEquity))}`}
                    </span>
                  </div>
                  <div className="sm:text-right">
                    <span className={`font-bold text-2xl ${balanced ? "text-[#22C55E]" : "text-red-600"}`}>
                      {fmt(totalLiabEquity)}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">Total Assets: {fmt(totalAssets)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {!generated && !loading && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center w-full">
            <p className="text-gray-400 text-sm">Optionally set an as-of date, then click Generate to view the balance sheet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
