"use client";

import { PageLoading } from "@/components/shared/PageLoading";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Search, Download } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/shared/DateInput";
import { FormattedDate } from "@/components/shared/FormattedDate";
import { Label } from "@/components/ui/label";
import { DashHeader } from "@/components/dashboard/dash-header";
import { AccountTypeBadge } from "@/components/accounting/AccountTypeBadge";
import { accountsAPI, type Account, type LedgerEntry } from "@/lib/api/accounting";

const fmt = (n: number) => `Rs. ${n.toLocaleString("en-IN")}`;

export default function AccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [account, setAccount] = useState<Account | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const params: { from_date?: string; to_date?: string } = {};
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;

      const [accountData, ledgerData] = await Promise.all([
        accountsAPI.get(id),
        accountsAPI.ledger(id, params),
      ]);
      setAccount(accountData);
      setLedgerEntries(Array.isArray(ledgerData) ? ledgerData : []);
    } catch (error: unknown) {
      console.error("Failed to load account:", error);
      toast.error("Failed to load account details");
    } finally {
      setLoading(false);
    }
  }, [id, fromDate, toDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = ledgerEntries.filter(
    (e) =>
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      e.reference.toLowerCase().includes(search.toLowerCase())
  );

  const totalDebits = ledgerEntries.reduce((s, e) => s + e.debit, 0);
  const totalCredits = ledgerEntries.reduce((s, e) => s + e.credit, 0);
  const closing = ledgerEntries[ledgerEntries.length - 1]?.balance ?? account?.balance ?? 0;
  const opening =
    ledgerEntries[0]
      ? ledgerEntries[0].balance - ledgerEntries[0].debit + ledgerEntries[0].credit
      : account?.balance ?? 0;

  const handleExportCSV = () => {
    if (!account || ledgerEntries.length === 0) return;
    const headers = ["Date", "Reference", "Description", "Debit", "Credit", "Balance", "Source"];
    const csvRows = [
      headers.join(","),
      ...ledgerEntries.map((entry) =>
        [
          entry.date,
          entry.reference,
          `"${entry.description}"`,
          entry.debit.toFixed(2),
          entry.credit.toFixed(2),
          entry.balance.toFixed(2),
          entry.source,
        ].join(",")
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ledger-${account.code}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Ledger exported");
  };

  if (loading && !account) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Account Ledger" subtitle="Loading..." />
        <PageLoading message="Loading…" />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Account Not Found" subtitle="" />
        <div className="flex-1 p-6">
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <p className="text-gray-500">This account could not be found.</p>
            <Link href="/dashboard/accounting/chart-of-accounts">
              <Button className="mt-4 bg-[#22C55E] hover:bg-[#16A34A] text-white">Back to Chart of Accounts</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title={`${account.code} — ${account.name}`} subtitle="Account Ledger" />
      <div className="flex-1 p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <AccountTypeBadge type={account.type} />
          <Link href={`/dashboard/accounting/chart-of-accounts/${account.id}/edit`}>
            <Button variant="outline" size="sm" className="h-8 border-gray-200 text-gray-600">
              Edit Account
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Opening Balance", value: fmt(opening) },
            { label: "Total Debits", value: fmt(totalDebits) },
            { label: "Total Credits", value: fmt(totalCredits) },
            { label: "Closing Balance", value: fmt(closing) },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div>
              <Label className="text-sm mb-1.5 block">From Date</Label>
              <DateInput value={fromDate} onChange={setFromDate} />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">To Date</Label>
              <DateInput value={toDate} onChange={setToDate} />
            </div>
            <Button
              onClick={fetchData}
              disabled={loading}
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white"
            >
              {loading ? "Loading..." : "Apply Filter"}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 w-52 text-sm border-gray-200 bg-white"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-gray-600 border-gray-200"
            onClick={handleExportCSV}
            disabled={ledgerEntries.length === 0}
          >
            <Download className="h-3.5 w-3.5" /> CSV
          </Button>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm">No transactions found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Date", "Reference", "Description", "Debit (Rs.)", "Credit (Rs.)", "Balance (Rs.)", "Source"].map(
                    (h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((entry, i) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-gray-600">
                      <FormattedDate value={entry.date} />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#22C55E]">{entry.reference}</td>
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
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
