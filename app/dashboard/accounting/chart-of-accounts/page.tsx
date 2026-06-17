"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashHeader } from "@/components/dashboard/dash-header";
import { AccountTypeBadge } from "@/components/accounting/AccountTypeBadge";
import { accountsAPI, Account } from "@/lib/api/accounting";
import toast from "react-hot-toast";

const TYPES = ["All", "Assets", "Liabilities", "Equity", "Income", "Expense"];
const fmt = (n: number) => `Rs. ${n.toLocaleString("en-IN")}`;

export default function ChartOfAccountsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const data = await accountsAPI.list();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Failed to fetch accounts:', error);
      toast.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const filtered = accounts.filter((a) => {
    const ms = a.name.toLowerCase().includes(search.toLowerCase()) || a.code.includes(search);
    return ms && (typeFilter === "All" || a.type === typeFilter);
  });

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Chart of Accounts" subtitle="Loading..." />
        <div className="flex-1 p-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22C55E] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading accounts...</p>
          </div>
        </div>
      </div>
    );
  }

  if (accounts.length === 0 && !loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Chart of Accounts" subtitle="0 accounts" />
        <div className="flex-1 p-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No accounts</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating your first account.</p>
            <div className="mt-6">
              <Link href="/dashboard/accounting/chart-of-accounts/new">
                <Button className="bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5">
                  <Plus className="h-4 w-4" /> Add Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Chart of Accounts" subtitle={`${accounts.length} accounts`} />
      <div className="flex-1 p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search accounts..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 w-52 text-sm border-gray-200 bg-white" />
            </div>
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              {TYPES.map((t) => (
                <button key={t} onClick={() => setTypeFilter(t)} className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${typeFilter === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>{t}</button>
              ))}
            </div>
          </div>
          <Link href="/dashboard/accounting/chart-of-accounts/new">
            <Button size="sm" className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5">
              <Plus className="h-4 w-4" /> Add Account
            </Button>
          </Link>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No accounts found matching "{search}"</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Code", "Account Name", "Type", "Sub Type", "Balance", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((acc) => (
                  <tr key={acc.id} className={`hover:bg-gray-50/50 transition-colors ${acc.level === 0 ? "bg-gray-50/80" : ""}`}>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{acc.code}</td>
                    <td className="px-4 py-3">
                      <div style={{ paddingLeft: `${acc.level * 20}px` }} className="flex items-center gap-1">
                        {acc.level > 0 && <ChevronRight className="h-3 w-3 text-gray-300 shrink-0" />}
                        <Link href={`/dashboard/accounting/chart-of-accounts/${acc.id}`} className={`hover:underline ${acc.level === 0 ? "font-bold text-gray-800" : "text-[#22C55E] font-medium"}`}>
                          {acc.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3"><AccountTypeBadge type={acc.type} /></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{acc.sub_type}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{fmt(acc.balance)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-xs">
                        <Link href={`/dashboard/accounting/chart-of-accounts/${acc.id}`} className="text-[#22C55E] hover:underline">Ledger</Link>
                        <span className="text-gray-300">|</span>
                        <Link href={`/dashboard/accounting/chart-of-accounts/${acc.id}/edit`} className="text-gray-500 hover:text-gray-700">Edit</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
