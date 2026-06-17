"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { Search, Download } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashHeader } from "@/components/dashboard/dash-header";
import { AccountTypeBadge } from "@/components/accounting/AccountTypeBadge";
import { mockChartOfAccounts, mockLedgerEntries } from "@/lib/mock-data/accounting";
const fmt = (n: number) => `Rs. ${n.toLocaleString("en-IN")}`;
export default function AccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const account = mockChartOfAccounts.find((a) => a.id === id) ?? mockChartOfAccounts[2];
  const [search, setSearch] = useState("");
  const filtered = mockLedgerEntries.filter((e) => e.description.toLowerCase().includes(search.toLowerCase()) || e.reference.toLowerCase().includes(search.toLowerCase()));
  const totalDebits = mockLedgerEntries.reduce((s, e) => s + e.debit, 0);
  const totalCredits = mockLedgerEntries.reduce((s, e) => s + e.credit, 0);
  const closing = mockLedgerEntries[mockLedgerEntries.length - 1]?.balance ?? 0;
  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title={account.code + " — " + account.name} subtitle="Account Ledger" />
      <div className="flex-1 p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <AccountTypeBadge type={account.type} />
          <Link href={"/dashboard/accounting/chart-of-accounts/" + account.id + "/edit"}>
            <Button variant="outline" size="sm" className="h-8 border-gray-200 text-gray-600">Edit Account</Button>
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[{ label: "Opening Balance", value: fmt(mockLedgerEntries[0]?.debit ?? 0) }, { label: "Total Debits", value: fmt(totalDebits) }, { label: "Total Credits", value: fmt(totalCredits) }, { label: "Closing Balance", value: fmt(closing) }].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm"><p className="text-xs text-gray-500">{s.label}</p><p className="text-lg font-bold text-gray-900 mt-1">{s.value}</p></div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="Search transactions..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 w-52 text-sm border-gray-200 bg-white" /></div>
          <div className="flex gap-2"><Button variant="outline" size="sm" className="h-8 gap-1.5 text-gray-600 border-gray-200"><Download className="h-3.5 w-3.5" /> CSV</Button><Button variant="outline" size="sm" className="h-8 gap-1.5 text-gray-600 border-gray-200"><Download className="h-3.5 w-3.5" /> PDF</Button></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100"><tr>{["Date","Reference","Description","Debit (Rs.)","Credit (Rs.)","Balance (Rs.)","Source"].map((h) => (<th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>))}</tr></thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((entry, i) => (
                <tr key={i} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-gray-600">{entry.date}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[#22C55E]">{entry.reference}</td>
                  <td className="px-4 py-3 text-gray-700">{entry.description}</td>
                  <td className="px-4 py-3 text-gray-800">{entry.debit > 0 ? fmt(entry.debit) : "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{entry.credit > 0 ? fmt(entry.credit) : "—"}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{fmt(entry.balance)}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">{entry.source}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}