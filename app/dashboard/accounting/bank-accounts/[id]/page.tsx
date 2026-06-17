"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, CreditCard, Loader2, AlertCircle, Download, Filter } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashHeader } from "@/components/dashboard/dash-header";
import { bankAccountsAPI, bankTransactionsAPI, type BankAccount, type BankTransaction } from "@/lib/api/accounting";

const fmt = (n: number) => `Rs. ${n.toLocaleString("en-IN")}`;

function formatDate(dateString: string) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return dateString;
  }
}

export default function BankAccountDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<BankAccount | null>(null);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (id) {
      fetchAccountDetails();
    }
  }, [id]);

  const fetchAccountDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch account details
      const accountData = await bankAccountsAPI.get(id);
      setAccount(accountData);

      // Fetch transactions
      try {
        const transactionsData = await bankTransactionsAPI.list({ bank_account: id });
        const txData = Array.isArray(transactionsData) ? transactionsData : (transactionsData as any).results || [];
        setTransactions(txData);
      } catch (txError) {
        console.error('Failed to load transactions:', txError);
        // Don't fail the whole page if transactions fail
        setTransactions([]);
      }
    } catch (error: any) {
      console.error('Failed to load bank account:', error);
      if (error.response?.status === 404) {
        setError('Bank account not found');
      } else {
        setError('Failed to load bank account details');
      }
      toast.error('Failed to load bank account');
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesType = filterType === "all" || tx.type === filterType;
    const matchesSearch = !searchTerm || 
      tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.reference.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Bank Account" subtitle="Loading..." />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#22C55E] mx-auto mb-2" />
            <p className="text-sm text-gray-500">Loading account details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Bank Account" subtitle="Error" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-4">{error || 'Account not found'}</p>
            <Button onClick={() => router.push('/dashboard/accounting/bank-accounts')} size="sm" className="bg-[#22C55E] hover:bg-[#16A34A] text-white">
              Back to Bank Accounts
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader 
        title={account.bank_name} 
        subtitle={`${account.account_name} - ${account.account_number}`} 
      />
      
      <div className="flex-1 p-6 space-y-6">
        {/* Account Summary Card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-[#22C55E]/10 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-[#22C55E]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">{account.bank_name}</h2>
                <p className="text-sm text-gray-500">{account.account_name}</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              account.status === "active" 
                ? "bg-green-100 text-green-700" 
                : account.status === "closed"
                ? "bg-red-100 text-red-700"
                : "bg-gray-100 text-gray-500"
            }`}>
              {account.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-gray-500 mb-1">Account Number</p>
              <p className="text-sm font-medium text-gray-800">{account.account_number}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Account Type</p>
              <p className="text-sm font-medium text-gray-800">{account.type}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Branch</p>
              <p className="text-sm font-medium text-gray-800">{account.branch || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">SWIFT Code</p>
              <p className="text-sm font-medium text-gray-800">{account.swift_code || 'N/A'}</p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Current Balance</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{fmt(account.balance)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">GL Account</p>
                <p className="text-sm font-medium text-gray-800 mt-1">
                  {account.gl_account_code} - {account.gl_account_name}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Last reconciled: {account.last_reconciled ? formatDate(account.last_reconciled) : 'Never'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Section */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Bank Statement</h3>
              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs">
                <Download className="h-3.5 w-3.5" /> Export
              </Button>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <Select value={filterType} onValueChange={(value) => setFilterType(value || "all")}>
                <SelectTrigger className="w-40 h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Credit">Credit</SelectItem>
                  <SelectItem value="Debit">Debit</SelectItem>
                  <SelectItem value="Transfer">Transfer</SelectItem>
                  <SelectItem value="Opening">Opening</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            {filteredTransactions.length === 0 ? (
              <div className="p-12 text-center">
                <Filter className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No Transactions</h3>
                <p className="text-sm text-gray-500">
                  {transactions.length === 0 
                    ? 'No transactions recorded for this account yet' 
                    : 'No transactions match your filters'}
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Debit</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Credit</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(tx.date)}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-800">{tx.reference}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{tx.description}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          tx.type === "Credit" ? "bg-green-100 text-green-700" :
                          tx.type === "Debit" ? "bg-red-100 text-red-700" :
                          "bg-blue-100 text-blue-700"
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-red-600">
                        {tx.debit > 0 ? fmt(tx.debit) : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-green-600">
                        {tx.credit > 0 ? fmt(tx.credit) : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-medium text-gray-800">
                        {fmt(tx.balance)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          tx.reconciled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                        }`}>
                          {tx.reconciled ? 'Reconciled' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/dashboard/accounting/bank-accounts')} 
            className="gap-1.5 text-gray-500"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Bank Accounts
          </Button>
          <div className="flex-1" />
          <Button 
            variant="outline"
            onClick={() => router.push(`/dashboard/accounting/bank-accounts/${id}/edit`)}
            className="border-gray-200"
          >
            Edit Account
          </Button>
        </div>
      </div>
    </div>
  );
}
