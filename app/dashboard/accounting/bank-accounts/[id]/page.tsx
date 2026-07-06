"use client";

import { PageLoading } from "@/components/shared/PageLoading";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, CreditCard, AlertCircle, Filter, Plus, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"
import { DateInput } from "@/components/shared/DateInput";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashHeader } from "@/components/dashboard/dash-header";
import { bankAccountsAPI, bankTransactionsAPI, type BankAccount, type BankTransaction } from "@/lib/api/accounting";
import { useDateSystem } from "@/lib/context/DateSystemContext";

const fmt = (n: number) => `Rs. ${n.toLocaleString("en-IN")}`;


export default function BankAccountDetailPage() {
  const { formatDate } = useDateSystem();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<BankAccount | null>(null);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddTx, setShowAddTx] = useState(false);
  const [savingTx, setSavingTx] = useState(false);
  const [txForm, setTxForm] = useState({
    date: new Date().toISOString().split("T")[0],
    reference: "",
    description: "",
    type: "Credit" as BankTransaction["type"],
    amount: "" });

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

      const transactionsData = await bankAccountsAPI.statement(id);
      setTransactions(transactionsData);
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

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(txForm.amount);
    if (!txForm.reference.trim() || !txForm.description.trim() || Number.isNaN(amount) || amount <= 0) {
      toast.error("Reference, description, and a positive amount are required");
      return;
    }

    setSavingTx(true);
    try {
      const isCredit = txForm.type === "Credit" || txForm.type === "Opening";
      await bankTransactionsAPI.create({
        bank_account: id,
        date: txForm.date,
        reference: txForm.reference.trim(),
        description: txForm.description.trim(),
        type: txForm.type,
        debit: isCredit ? 0 : amount,
        credit: isCredit ? amount : 0 });
      toast.success("Transaction recorded");
      setShowAddTx(false);
      setTxForm({
        date: new Date().toISOString().split("T")[0],
        reference: "",
        description: "",
        type: "Credit",
        amount: "" });
      fetchAccountDetails();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || "Failed to record transaction");
    } finally {
      setSavingTx(false);
    }
  };

  const handleReconcile = async (txId: string) => {
    try {
      await bankTransactionsAPI.reconcile(txId);
      toast.success("Transaction reconciled");
      fetchAccountDetails();
    } catch {
      toast.error("Failed to reconcile transaction");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Bank Account" subtitle="Loading..." />
        <PageLoading message="Loading account details…" />
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
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 h-8 text-xs"
                  onClick={() => router.push(`/dashboard/accounting/bank-accounts/reconciliation/${id}`)}
                >
                  <CheckCircle className="h-3.5 w-3.5" /> Reconcile
                </Button>
                <Button size="sm" className="gap-1.5 h-8 text-xs bg-[#22C55E] hover:bg-[#16A34A] text-white" onClick={() => setShowAddTx((v) => !v)}>
                  <Plus className="h-3.5 w-3.5" /> Add Transaction
                </Button>
              </div>
            </div>

            {showAddTx && (
              <form onSubmit={handleAddTransaction} className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                <div>
                  <Label className="text-xs">Date</Label>
                  <DateInput  className="h-9 text-sm mt-1" value={txForm.date} onChange={(date) => setTxForm((f) => ({ ...f, date: date}))} />
                </div>
                <div>
                  <Label className="text-xs">Type</Label>
                  <Select value={txForm.type} onValueChange={(v) => setTxForm((f) => ({ ...f, type: (v || "Credit") as BankTransaction["type"] }))}>
                    <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Credit", "Debit", "Transfer"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Reference</Label>
                  <Input className="h-9 text-sm mt-1" value={txForm.reference} onChange={(e) => setTxForm((f) => ({ ...f, reference: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Description</Label>
                  <Input className="h-9 text-sm mt-1" value={txForm.description} onChange={(e) => setTxForm((f) => ({ ...f, description: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Amount (Rs.)</Label>
                  <Input type="number" step="0.01" min="0" className="h-9 text-sm mt-1" value={txForm.amount} onChange={(e) => setTxForm((f) => ({ ...f, amount: e.target.value }))} />
                </div>
                <div className="flex items-end gap-2">
                  <Button type="submit" size="sm" className="bg-[#22C55E] hover:bg-[#16A34A] text-white" disabled={savingTx}>
                    {savingTx ? "Saving..." : "Save"}
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setShowAddTx(false)}>Cancel</Button>
                </div>
              </form>
            )}

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
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
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
                      <td className="px-6 py-4 text-center">
                        {!tx.reconciled && (
                          <button
                            type="button"
                            onClick={() => handleReconcile(tx.id)}
                            className="text-xs text-[#22C55E] hover:underline"
                          >
                            Reconcile
                          </button>
                        )}
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
