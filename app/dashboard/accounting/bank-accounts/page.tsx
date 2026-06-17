"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, CreditCard, Loader2, AlertCircle, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { DashHeader } from "@/components/dashboard/dash-header";
import { bankAccountsAPI, type BankAccount } from "@/lib/api/accounting";

const fmt = (n: number) => `Rs. ${n.toLocaleString("en-IN")}`;

function maskAccount(num: string) {
  if (!num) return "XXXX XXXX XXXX";
  return "XXXX XXXX " + num.slice(-4);
}

function formatDate(dateString?: string) {
  if (!dateString) return "Never";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "Never";
  }
}

export default function BankAccountsPage() {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    fetchBankAccounts();
  }, []);

  const fetchBankAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await bankAccountsAPI.list();
      const accountsData = Array.isArray(data) ? data : (data as any).results || [];
      setAccounts(accountsData);
    } catch (error: any) {
      console.error('Failed to load bank accounts:', error);
      setError('Failed to load bank accounts. Please try again.');
      toast.error('Failed to load bank accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, accountName: string) => {
    setConfirmDelete({ id, name: accountName });
  };

  const confirmDeleteAction = async () => {
    if (!confirmDelete) return;

    try {
      setDeletingId(confirmDelete.id);
      await bankAccountsAPI.delete(confirmDelete.id);
      toast.success('Bank account deleted successfully');
      setAccounts(accounts.filter(acc => acc.id !== confirmDelete.id));
      setConfirmDelete(null);
    } catch (error: any) {
      console.error('Failed to delete bank account:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to delete bank account';
      toast.error(errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Bank Accounts" subtitle="Loading..." />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#22C55E] mx-auto mb-2" />
            <p className="text-sm text-gray-500">Loading bank accounts...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Bank Accounts" subtitle="Error" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchBankAccounts} size="sm" className="bg-[#22C55E] hover:bg-[#16A34A] text-white">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Bank Accounts" subtitle={`${accounts.length} account${accounts.length !== 1 ? 's' : ''}`} />
      <div className="flex-1 p-6 space-y-4">
        <div className="flex justify-end">
          <Link href="/dashboard/accounting/bank-accounts/new">
            <Button size="sm" className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5">
              <Plus className="h-4 w-4" /> Add Bank Account
            </Button>
          </Link>
        </div>

        {accounts.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
            <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Bank Accounts</h3>
            <p className="text-sm text-gray-500 mb-6">Get started by adding your first bank account</p>
            <Link href="/dashboard/accounting/bank-accounts/new">
              <Button size="sm" className="bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5">
                <Plus className="h-4 w-4" /> Add Bank Account
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((bank) => (
              <div key={bank.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4 hover:border-[#22C55E]/30 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#22C55E]/10 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-[#22C55E]" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{bank.bank_name}</p>
                      <p className="text-xs text-gray-500">{bank.account_name}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    bank.status === "active" 
                      ? "bg-green-100 text-green-700" 
                      : bank.status === "closed"
                      ? "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-500"
                  }`}>
                    {bank.status}
                  </span>
                </div>

                <div>
                  <p className="text-xs text-gray-400 font-mono">{maskAccount(bank.account_number)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{bank.type} Account</p>
                  {bank.branch && <p className="text-xs text-gray-400 mt-0.5">{bank.branch}</p>}
                </div>

                <div>
                  <p className="text-xs text-gray-500">Current Balance</p>
                  <p className="text-2xl font-bold text-gray-900 mt-0.5">{fmt(bank.balance)}</p>
                </div>

                <div className="text-xs text-gray-400">
                  Last reconciled: {formatDate(bank.last_reconciled)}
                </div>

                <div className="flex gap-2 pt-1 border-t border-gray-100">
                  <Link href={`/dashboard/accounting/bank-accounts/${bank.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full h-8 text-xs border-gray-200 text-gray-600">
                      Statement
                    </Button>
                  </Link>
                  <Link href={`/dashboard/accounting/bank-accounts/${bank.id}/edit`}>
                    <Button variant="outline" size="sm" className="h-8 text-xs border-gray-200 text-gray-600 px-3">
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs px-2 border-gray-200 text-gray-600"
                    onClick={() => handleDelete(bank.id, bank.account_name)}
                    disabled={deletingId === bank.id}
                  >
                    {deletingId === bank.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {confirmDelete && (
        <>
          <div 
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setConfirmDelete(null)}
          />
          <div 
            className="fixed left-1/2 -translate-x-1/2 z-50 bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
            style={{ top: '40vh' }}
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Delete Bank Account</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Are you sure you want to delete <span className="font-medium">{confirmDelete.name}</span>? This action cannot be undone.
                </p>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmDelete(null)}
                    className="border-gray-300 text-gray-700"
                    disabled={deletingId !== null}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={confirmDeleteAction}
                    className="bg-red-600 hover:bg-red-700 text-white"
                    disabled={deletingId !== null}
                  >
                    {deletingId ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
