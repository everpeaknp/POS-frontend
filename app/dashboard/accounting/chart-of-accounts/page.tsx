"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  ChevronRight,
  Trash2,
  Pencil,
  BookOpen,
  Layers,
  Loader2,
  AlertCircle,
  FolderTree,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashHeader } from "@/components/dashboard/dash-header";
import { AccountTypeBadge } from "@/components/accounting/AccountTypeBadge";
import { accountsAPI, Account } from "@/lib/api/accounting";
import toast from "react-hot-toast";

const TYPES = ["All", "Assets", "Liabilities", "Equity", "Income", "Expense"] as const;
const TYPE_ORDER = ["Assets", "Liabilities", "Equity", "Income", "Expense"];

const TYPE_ACCENT: Record<string, string> = {
  Assets: "border-l-blue-500",
  Liabilities: "border-l-red-500",
  Equity: "border-l-purple-500",
  Income: "border-l-green-500",
  Expense: "border-l-orange-500",
};

const fmt = (n: number) => `Rs. ${n.toLocaleString("en-IN")}`;

function sortByCode(a: Account, b: Account) {
  return a.code.localeCompare(b.code, undefined, { numeric: true });
}

export default function ChartOfAccountsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<(typeof TYPES)[number]>("All");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await accountsAPI.list({ ordering: "code" });
      setAccounts(data);
    } catch (err: unknown) {
      console.error("Failed to fetch accounts:", err);
      setAccounts([]);
      const axiosErr = err as { response?: { status?: number } };
      if (axiosErr.response?.status === 401) {
        setError("Session expired. Please log in again.");
      } else {
        setError("Failed to load accounts. Check that the backend is running.");
      }
      toast.error("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (acc: Account) => {
    if (!confirm(`Delete account "${acc.code} — ${acc.name}"? This cannot be undone.`)) return;
    try {
      await accountsAPI.delete(acc.id);
      toast.success("Account deleted");
      fetchAccounts();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string; error?: string } } };
      const message = axiosErr.response?.data?.detail || axiosErr.response?.data?.error || "Failed to delete account";
      toast.error(message);
    }
  };

  const filtered = useMemo(() => {
    return accounts
      .filter((a) => {
        const q = search.toLowerCase();
        const matchesSearch =
          a.name.toLowerCase().includes(q) ||
          a.code.includes(search) ||
          a.sub_type.toLowerCase().includes(q);
        const matchesType = typeFilter === "All" || a.type === typeFilter;
        return matchesSearch && matchesType;
      })
      .sort(sortByCode);
  }, [accounts, search, typeFilter]);

  const grouped = useMemo(() => {
    if (typeFilter !== "All") {
      return [{ type: typeFilter, accounts: filtered }];
    }
    return TYPE_ORDER.map((type) => ({
      type,
      accounts: filtered.filter((a) => a.type === type),
    })).filter((g) => g.accounts.length > 0);
  }, [filtered, typeFilter]);

  const stats = useMemo(() => {
    const active = accounts.filter((a) => a.status === "active").length;
    const byType = TYPE_ORDER.map((type) => ({
      type,
      count: accounts.filter((a) => a.type === type).length,
      balance: accounts.filter((a) => a.type === type).reduce((s, a) => s + (a.balance || 0), 0),
    }));
    return { total: accounts.length, active, byType };
  }, [accounts]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Chart of Accounts" subtitle="Loading..." />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#22C55E] mx-auto mb-2" />
            <p className="text-sm text-gray-500">Loading accounts...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Chart of Accounts" subtitle="Could not load" />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchAccounts} className="bg-[#22C55E] hover:bg-[#16A34A] text-white">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader
        title="Chart of Accounts"
        subtitle={`${stats.total} accounts · ${stats.active} active`}
      />

      <div className="flex-1 p-6 space-y-5">
        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="col-span-2 sm:col-span-1 bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Layers className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Total Accounts</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          {stats.byType.map(({ type, count, balance }) => (
            <button
              key={type}
              type="button"
              onClick={() => setTypeFilter(type as (typeof TYPES)[number])}
              className={`text-left bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:border-[#22C55E]/40 transition-colors ${
                typeFilter === type ? "ring-2 ring-[#22C55E]/30 border-[#22C55E]/40" : ""
              }`}
            >
              <p className="text-xs text-gray-500 mb-1">{type}</p>
              <p className="text-lg font-semibold text-gray-900">{count}</p>
              <p className="text-xs text-gray-400 mt-0.5 truncate">{fmt(balance)}</p>
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by code, name, or sub-type..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 text-sm border-gray-200 bg-gray-50/50 focus:bg-white"
                />
              </div>
              <div className="overflow-x-auto -mx-1 px-1">
                <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-max min-w-0">
                  {TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTypeFilter(t)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                        typeFilter === t
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <Link href="/dashboard/accounting/chart-of-accounts/new" className="shrink-0">
              <Button className="h-9 w-full sm:w-auto bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5">
                <Plus className="h-4 w-4" /> Add Account
              </Button>
            </Link>
          </div>
        </div>

        {/* Account list */}
        {accounts.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
            <FolderTree className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-1">No accounts yet</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
              Build your chart of accounts to track assets, liabilities, income, and expenses.
            </p>
            <Link href="/dashboard/accounting/chart-of-accounts/new">
              <Button className="bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5">
                <Plus className="h-4 w-4" /> Add Account
              </Button>
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-1">No matches</h3>
            <p className="text-sm text-gray-500">
              No accounts match your search{typeFilter !== "All" ? ` in ${typeFilter}` : ""}.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearch("");
                setTypeFilter("All");
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {grouped.map(({ type, accounts: groupAccounts }) => (
              <div
                key={type}
                className={`bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden border-l-4 ${TYPE_ACCENT[type] ?? "border-l-gray-300"}`}
              >
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/60 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AccountTypeBadge type={type} />
                    <span className="text-sm text-gray-500">
                      {groupAccounts.length} account{groupAccounts.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">
                    {fmt(groupAccounts.reduce((s, a) => s + (a.balance || 0), 0))}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[720px]">
                    <thead>
                      <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                        <th className="text-left font-semibold px-4 py-2.5 w-24">Code</th>
                        <th className="text-left font-semibold px-4 py-2.5">Account Name</th>
                        <th className="text-left font-semibold px-4 py-2.5 w-36 hidden md:table-cell">Sub Type</th>
                        <th className="text-left font-semibold px-4 py-2.5 w-24 hidden sm:table-cell">Status</th>
                        <th className="text-right font-semibold px-4 py-2.5 w-36">Balance</th>
                        <th className="text-right font-semibold px-4 py-2.5 w-28">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {groupAccounts.map((acc) => (
                        <tr
                          key={acc.id}
                          className={`hover:bg-gray-50/80 transition-colors ${
                            acc.status === "inactive" ? "opacity-60" : ""
                          } ${acc.level === 0 ? "bg-gray-50/40" : ""}`}
                        >
                          <td className="px-4 py-3">
                            <span className="inline-flex font-mono text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                              {acc.code}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div
                              style={{ paddingLeft: `${acc.level * 16}px` }}
                              className="flex items-center gap-1.5 min-w-0"
                            >
                              {acc.level > 0 && (
                                <ChevronRight className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                              )}
                              <Link
                                href={`/dashboard/accounting/chart-of-accounts/${acc.id}`}
                                className={`truncate hover:underline ${
                                  acc.level === 0
                                    ? "font-semibold text-gray-900"
                                    : "font-medium text-[#22C55E]"
                                }`}
                              >
                                {acc.name}
                              </Link>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">
                            {acc.sub_type}
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                acc.status === "active"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-500"
                              }`}
                            >
                              {acc.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-gray-900 tabular-nums">
                            {fmt(acc.balance)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-0.5">
                              <Link
                                href={`/dashboard/accounting/chart-of-accounts/${acc.id}`}
                                title="View ledger"
                              >
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500 hover:text-[#22C55E]">
                                  <BookOpen className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Link
                                href={`/dashboard/accounting/chart-of-accounts/${acc.id}/edit`}
                                title="Edit account"
                              >
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500 hover:text-gray-800">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                                title="Delete account"
                                onClick={() => handleDelete(acc)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
