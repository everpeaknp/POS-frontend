"use client";

import { useState, useEffect, useMemo } from "react";
import { Download } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { DashHeader } from "@/components/dashboard/dash-header";
import { AccountTypeBadge } from "@/components/accounting/AccountTypeBadge";
import { DateInput } from "@/components/shared/DateInput";
import { FormattedDate } from "@/components/shared/FormattedDate";
import { useDateSystem } from "@/lib/context/DateSystemContext";
import { accountsAPI, type Account, type LedgerEntry } from "@/lib/api/accounting";

const fmt = (n: number) => `Rs. ${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function normalizeLedgerEntries(data: LedgerEntry[]): LedgerEntry[] {
  return (Array.isArray(data) ? data : []).map((entry) => ({
    ...entry,
    debit: Number(entry.debit) || 0,
    credit: Number(entry.credit) || 0,
    balance: Number(entry.balance) || 0,
  }));
}

export default function GeneralLedgerPage() {
  const { formatDate } = useDateSystem();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);

  const postableAccounts = useMemo(
    () =>
      accounts
        .filter((a) => a.status === "active")
        .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true })),
    [accounts]
  );

  const accountOptions = useMemo(
    () =>
      postableAccounts.map((a) => ({
        value: String(a.id),
        label: `${a.code} — ${a.name}`,
        subtitle: a.type,
      })),
    [postableAccounts]
  );

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const data = await accountsAPI.list({ status: "active", ordering: "code" });
      setAccounts(Array.isArray(data) ? data : []);
    } catch (error: unknown) {
      console.error("Failed to load accounts:", error);
      toast.error("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!accountId) {
      toast.error("Please select an account");
      return;
    }

    try {
      setGenerating(true);
      const params: { from_date?: string; to_date?: string } = {};
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;

      const data = await accountsAPI.ledger(accountId, params);
      setLedgerEntries(normalizeLedgerEntries(data));
      setGenerated(true);
      toast.success("Ledger generated successfully");
    } catch (error: unknown) {
      console.error("Failed to generate ledger:", error);
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || "Failed to generate ledger");
    } finally {
      setGenerating(false);
    }
  };

  const account = postableAccounts.find((a) => String(a.id) === accountId);
  const totalDebits = ledgerEntries.reduce((s, e) => s + e.debit, 0);
  const totalCredits = ledgerEntries.reduce((s, e) => s + e.credit, 0);
  const closing = ledgerEntries[ledgerEntries.length - 1]?.balance ?? 0;
  const openingEntry = ledgerEntries.find((e) => e.source === "Opening");
  const openingBalance = openingEntry
    ? openingEntry.balance
    : ledgerEntries.length > 0
      ? ledgerEntries[0].balance - (account?.type === "Assets" || account?.type === "Expense"
          ? ledgerEntries[0].debit - ledgerEntries[0].credit
          : ledgerEntries[0].credit - ledgerEntries[0].debit)
      : 0;

  const handleExportCSV = () => {
    if (!account || ledgerEntries.length === 0) return;

    const headers = ["Date", "Reference", "Description", "Debit", "Credit", "Balance", "Source"];
    const csvRows = [
      headers.join(","),
      ...ledgerEntries.map((entry) =>
        [
          entry.date,
          entry.reference,
          `"${entry.description.replace(/"/g, '""')}"`,
          entry.debit.toFixed(2),
          entry.credit.toFixed(2),
          entry.balance.toFixed(2),
          entry.source,
        ].join(",")
      ),
    ];

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ledger-${account.code}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Ledger exported successfully");
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="General Ledger" subtitle="Account transaction history" />
        <div className="flex-1 p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22C55E]" />
            <span className="ml-3 text-gray-600">Loading accounts...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="General Ledger" subtitle="Account transaction history" />
      <div className="flex-1 p-6 space-y-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
            <div className="sm:col-span-2">
              <Label className="text-sm mb-1.5 block">
                Account <span className="text-red-500">*</span>
              </Label>
              {postableAccounts.length === 0 ? (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                  No active accounts. Add accounts in Chart of Accounts first.
                </p>
              ) : (
                <Combobox
                  options={accountOptions}
                  value={accountId || undefined}
                  onValueChange={(v) => {
                    setAccountId(v);
                    setGenerated(false);
                  }}
                  placeholder="Search account..."
                  searchPlaceholder="Code or name..."
                  emptyText="No account found."
                  disabled={generating}
                />
              )}
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">From Date</Label>
              <DateInput
                value={fromDate}
                onChange={(v) => {
                  setFromDate(v);
                  setGenerated(false);
                }}
                disabled={generating}
              />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">To Date</Label>
              <DateInput
                value={toDate}
                onChange={(v) => {
                  setToDate(v);
                  setGenerated(false);
                }}
                disabled={generating}
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              onClick={handleGenerate}
              disabled={!accountId || generating || postableAccounts.length === 0}
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white px-6"
            >
              {generating ? "Generating..." : "Generate"}
            </Button>
            {generated && ledgerEntries.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 text-gray-600 border-gray-200"
                onClick={handleExportCSV}
              >
                <Download className="h-3.5 w-3.5" /> CSV
              </Button>
            )}
          </div>
        </div>

        {generated && account && ledgerEntries.length > 0 && (
          <>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-wrap items-center gap-4">
              <div>
                <p className="text-xs text-gray-500">Account</p>
                <p className="font-semibold text-gray-800">
                  {account.code} — {account.name}
                </p>
              </div>
              <AccountTypeBadge type={account.type} />
              <div className="ml-auto text-right">
                <p className="text-xs text-gray-500">Opening Balance</p>
                <p className="font-semibold text-gray-800">{fmt(openingBalance)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Closing Balance</p>
                <p className="font-semibold text-[#22C55E]">{fmt(closing)}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["Date", "Reference", "Description", "Debit (Rs.)", "Credit (Rs.)", "Balance (Rs.)", "Source"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {ledgerEntries.map((entry, i) => (
                    <tr
                      key={`${entry.reference}-${entry.date}-${i}`}
                      className={`hover:bg-gray-50/50 ${entry.source === "Opening" ? "bg-blue-50/40" : ""}`}
                    >
                      <td className="px-4 py-3 text-gray-600">
                        <FormattedDate value={entry.date} />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[#22C55E]">{entry.reference || "—"}</td>
                      <td className="px-4 py-3 text-gray-700">{entry.description}</td>
                      <td className="px-4 py-3 text-gray-800">{entry.debit > 0 ? fmt(entry.debit) : "—"}</td>
                      <td className="px-4 py-3 text-gray-500">{entry.credit > 0 ? fmt(entry.credit) : "—"}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{fmt(entry.balance)}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">{entry.source}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-xs font-semibold text-gray-600">
                      Period Totals
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-800">{fmt(totalDebits)}</td>
                    <td className="px-4 py-3 font-bold text-gray-800">{fmt(totalCredits)}</td>
                    <td className="px-4 py-3 font-bold text-[#22C55E]">{fmt(closing)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}

        {generated && account && ledgerEntries.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-12 shadow-sm text-center">
            <p className="text-gray-400 text-sm">
              No posted transactions found for this account in the selected date range.
            </p>
          </div>
        )}

        {!generated && (
          <div className="bg-white rounded-xl border border-gray-100 p-12 shadow-sm text-center">
            <p className="text-gray-400 text-sm">
              Select an account and optional date range, then click Generate to view the ledger.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
