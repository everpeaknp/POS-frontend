"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Wallet, Search } from "lucide-react";

import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AccountingPageShell,
  accountingCardClass,
} from "@/components/dashboard/AccountingPageShell";
import { EmptyState } from "@/components/shared/EmptyState";
import { cashAccountsAPI, type CashAccount } from "@/lib/api/accounting";
import { useDateSystem } from "@/lib/context/DateSystemContext";

const fmt = (n: number) => `Rs. ${n.toLocaleString("en-IN")}`;

export default function CashAccountsPage() {
  const { formatDate } = useDateSystem();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<CashAccount[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCashAccounts();
  }, []);

  const fetchCashAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await cashAccountsAPI.list();
      setAccounts(data);
    } catch (error: any) {
      console.error("Failed to load cash accounts:", error);
      setError("Failed to load cash accounts. Please try again.");
      toast.error("Failed to load cash accounts");
    } finally {
      setLoading(false);
    }
  };

  const filteredAccounts = useMemo(() => {
    return accounts.filter((cashAcct) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !q ||
        cashAcct.user_name?.toLowerCase().includes(q) ||
        cashAcct.user_username?.toLowerCase().includes(q);

      return matchesSearch;
    });
  }, [accounts, searchTerm]);

  if (!loading && !error && accounts.length === 0) {
    return (
      <AccountingPageShell title="Cash Accounts" subtitle="View cash account balances">
        <EmptyState
          icon={Wallet}
          title="No Cash Accounts"
          description="Cash accounts will appear here when cashiers process cash transactions"
        />
      </AccountingPageShell>
    );
  }

  return (
    <AccountingPageShell
      title="Cash Accounts"
      subtitle={`${accounts.length} account${accounts.length !== 1 ? "s" : ""}`}
      loading={loading}
      error={error}
      onRetry={fetchCashAccounts}
    >
      <div className="flex gap-3 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by cashier name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-sm border-gray-200"
          />
        </div>
      </div>

      {filteredAccounts.length === 0 ? (
        <div className={`${accountingCardClass} p-12 text-center`}>
          <p className="text-gray-500">No cash accounts found matching your search</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAccounts.map((cashAcct) => (
            <div
              key={cashAcct.id}
              className={`${accountingCardClass} p-5 space-y-4 hover:border-[#4A5D7A]/30 transition-colors`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#4A5D7A]/10 flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-[#4A5D7A]" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{cashAcct.user_name}</p>
                    <p className="text-xs text-gray-500">@{cashAcct.user_username}</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500">Current Balance</p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">{fmt(cashAcct.balance)}</p>
              </div>

              <div className="text-xs text-gray-400">
                Last transaction: {formatDate(cashAcct.last_transaction_date, "Never")}
              </div>

              <div className="flex gap-2 pt-1 border-t border-gray-100">
                <Link href={`/dashboard/accounting/cash-accounts/${cashAcct.id}`} className="flex-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-8 text-xs border-gray-200 text-gray-600"
                  >
                    Statement
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </AccountingPageShell>
  );
}
