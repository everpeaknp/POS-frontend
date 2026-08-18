"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, Trash2, Edit2, TrendingUp, TrendingDown, X } from "lucide-react";
import { DashHeader } from "@/components/dashboard/dash-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DateInput } from "@/components/shared/DateInput";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/context/AuthContext";
import { formatCurrency } from "@/lib/utils";
import { todayIsoDate } from "@/lib/dates";
import { FormattedDate } from "@/components/shared/FormattedDate";
import {
  getCategories,
  getAccounts,
  getTransactions,
  setCategoriesForScope,
  setAccountsForScope,
  setTransactionsForScope,
  useSyncedList,
  type PFCategory,
  type PFAccount,
  type PFTransaction,
} from "@/lib/personal-finance/store";
import toast from "react-hot-toast";

// MOCK DATA STRUCTURE
// TODO: Replace with real backend API calls when endpoints are ready
// Backend needs: GET /api/personal-finance/transactions, POST /transactions, PUT /transactions/:id, DELETE /transactions/:id

type TransactionType = "income" | "expense";

type Transaction = PFTransaction;
type Category = PFCategory;
type Account = PFAccount;

// Categories, accounts, and transactions come from the shared Personal Finance
// store (lib/personal-finance/store.ts) — see /new pages and the Category /
// Account pages, which write to the same store.

export default function TransactionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const scope = user?.tenant?.slug ?? null;
  const [categories] = useSyncedList<Category>(scope, getCategories, setCategoriesForScope);
  const [accounts] = useSyncedList<Account>(scope, getAccounts, setAccountsForScope);
  const [transactions, setTransactions] = useSyncedList<Transaction>(scope, getTransactions, setTransactionsForScope);
  const [showDialog, setShowDialog] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<Omit<Transaction, "id" | "createdAt">>({
    date: todayIsoDate(),
    type: "expense",
    amount: 0,
    categoryId: "",
    accountId: "",
    description: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterAccount, setFilterAccount] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const workspaceName = user?.tenant?.workspace_name || user?.tenant?.name || "Workspace";
  const subtitle = `${workspaceName} · Income and expense transactions`;

  // Filter categories based on selected type
  const availableCategories = useMemo(() => {
    if (formData.type === "all") return categories;
    return categories.filter((cat) => cat.type === formData.type);
  }, [formData.type]);

  // Filtered and sorted transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Search — matches description, category, account, or type (income/expense)
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.description.toLowerCase().includes(lower) ||
          categories.find((c) => c.id === t.categoryId)?.name.toLowerCase().includes(lower) ||
          accounts.find((a) => a.id === t.accountId)?.name.toLowerCase().includes(lower) ||
          t.type.includes(lower)
      );
    }

    if (filterType !== "all") {
      filtered = filtered.filter((t) => t.type === filterType);
    }
    if (filterCategory !== "all") {
      filtered = filtered.filter((t) => t.categoryId === filterCategory);
    }
    if (filterAccount !== "all") {
      filtered = filtered.filter((t) => t.accountId === filterAccount);
    }
    if (dateFrom) {
      filtered = filtered.filter((t) => t.date >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter((t) => t.date <= dateTo);
    }

    // Sort by date descending
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchTerm, filterType, filterCategory, filterAccount, dateFrom, dateTo, categories, accounts]);

  // Summary calculations
  const summary = useMemo(() => {
    const income = filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, net: income - expense };
  }, [filteredTransactions]);

  const openAddDialog = () => {
    setEditingTransaction(null);
    setFormData({
      date: todayIsoDate(),
      type: "expense",
      amount: 0,
      categoryId: "",
      accountId: "",
      description: "",
    });
    setShowDialog(true);
  };

  // Sidebar "+" and quick-action links deep-link with ?new=1 to open this dialog directly
  useEffect(() => {
    if (searchParams.get("new") !== "1") return;
    openAddDialog();
    router.replace("/dashboard/personal-finance/transactions", { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, router]);

  const openEditDialog = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      date: transaction.date,
      type: transaction.type,
      amount: transaction.amount,
      categoryId: transaction.categoryId,
      accountId: transaction.accountId,
      description: transaction.description,
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    // Only Type and Amount are required — Category, Account, and Date are optional
    if (formData.amount <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    if (editingTransaction) {
      // Update existing transaction
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === editingTransaction.id
            ? { ...t, ...formData }
            : t
        )
      );
      toast.success("Transaction updated successfully");
    } else {
      // Add new transaction
      const newTransaction: Transaction = {
        id: `txn_${Date.now()}`,
        ...formData,
        createdAt: new Date().toISOString(),
      };
      setTransactions((prev) => [newTransaction, ...prev]);
      toast.success("Transaction added successfully");
    }

    setShowDialog(false);
  };

  const handleDelete = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    setDeleteConfirmId(null);
    toast.success("Transaction deleted successfully");
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterType("all");
    setFilterCategory("all");
    setFilterAccount("all");
    setDateFrom("");
    setDateTo("");
  };

  const hasActiveFilters = Boolean(
    searchTerm || filterType !== "all" || filterCategory !== "all" || filterAccount !== "all" || dateFrom || dateTo
  );

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Transactions" subtitle={subtitle} />

      <div className="flex-1 p-6 space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Income</p>
                <p className="text-2xl font-bold text-[#22C55E]">{formatCurrency(summary.income)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-[#22C55E]" />
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Expense</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.expense)}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Net Balance</p>
                <p className={`text-2xl font-bold ${summary.net >= 0 ? "text-[#22C55E]" : "text-red-600"}`}>
                  {formatCurrency(summary.net)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none flex-1 min-w-0">
              <div className="relative shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-8 h-9 w-52 text-sm border-gray-200 bg-white focus-visible:ring-0 focus-visible:border-input"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    aria-label="Clear search"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <Select value={filterType} onValueChange={(v) => setFilterType(v ?? "all")}>
                <SelectTrigger className="h-9 w-32 shrink-0 text-sm border-gray-200 bg-white">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v ?? "all")}>
                <SelectTrigger className="h-9 w-36 shrink-0 text-sm border-gray-200 bg-white">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterAccount} onValueChange={(v) => setFilterAccount(v ?? "all")}>
                <SelectTrigger className="h-9 w-36 shrink-0 text-sm border-gray-200 bg-white">
                  <SelectValue placeholder="All Accounts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2 shrink-0">
                <DateInput
                  value={dateFrom}
                  onChange={setDateFrom}
                  className="h-9 w-36 text-sm border-gray-200 focus-visible:ring-0 focus-visible:border-input"
                />
                <span className="text-sm text-gray-400 shrink-0">to</span>
                <DateInput
                  value={dateTo}
                  onChange={setDateTo}
                  className="h-9 w-36 text-sm border-gray-200 focus-visible:ring-0 focus-visible:border-input"
                />
              </div>

              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={clearFilters}
                  aria-label="Clear filters"
                  title="Clear filters"
                  className="h-9 w-9 shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <Button onClick={openAddDialog} className="h-9 shrink-0 bg-[#22C55E] hover:bg-[#22C55E]/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {hasActiveFilters ? "No transactions match your filters" : "No transactions yet"}
              </p>
              {!hasActiveFilters && (
                <Button onClick={openAddDialog} className="mt-4 bg-[#22C55E] hover:bg-[#22C55E]/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Transaction
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Account
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTransactions.map((transaction) => {
                    const category = categories.find((c) => c.id === transaction.categoryId);
                    const account = accounts.find((a) => a.id === transaction.accountId);

                    return (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <FormattedDate value={transaction.date} />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {transaction.description || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{category?.name || "-"}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{account?.name || "-"}</td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={transaction.type === "income" ? "default" : "secondary"}
                            className={
                              transaction.type === "income"
                                ? "bg-green-100 text-[#22C55E] hover:bg-green-100"
                                : "bg-red-100 text-red-600 hover:bg-red-100"
                            }
                          >
                            {transaction.type === "income" ? (
                              <TrendingUp className="h-3 w-3 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 mr-1" />
                            )}
                            {transaction.type === "income" ? "Income" : "Expense"}
                          </Badge>
                        </td>
                        <td
                          className={`px-4 py-3 text-sm text-right font-medium ${
                            transaction.type === "income" ? "text-[#22C55E]" : "text-red-600"
                          }`}
                        >
                          {transaction.type === "income" ? "+" : "-"}
                          {formatCurrency(transaction.amount)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(transaction)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteConfirmId(transaction.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTransaction ? "Edit Transaction" : "Add Transaction"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>
                Type <span className="text-red-500">*</span>
              </Label>
              <div className="mt-1 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: "expense", categoryId: "" })}
                  className={`flex items-center justify-center gap-2 h-10 rounded-lg border font-medium text-sm transition-all ${
                    formData.type === "expense"
                      ? "border-red-300 bg-red-50 text-red-700"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <TrendingDown className="h-4 w-4" />
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: "income", categoryId: "" })}
                  className={`flex items-center justify-center gap-2 h-10 rounded-lg border font-medium text-sm transition-all ${
                    formData.type === "income"
                      ? "border-[#22C55E] bg-green-50 text-[#16A34A]"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <TrendingUp className="h-4 w-4" />
                  Income
                </button>
              </div>
            </div>

            <div>
              <Label>
                Amount <span className="text-red-500">*</span>
              </Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                  Rs.
                </span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.amount || ""}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="pl-9 focus-visible:ring-0 focus-visible:border-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Account</Label>
                <Select value={formData.accountId} onValueChange={(value) => setFormData({ ...formData, accountId: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Date</Label>
              <DateInput
                value={formData.date}
                onChange={(date) => setFormData({ ...formData, date })}
                className="mt-1 focus-visible:ring-0 focus-visible:border-input"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional note"
                className="mt-1 focus-visible:ring-0 focus-visible:border-input"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-[#22C55E] hover:bg-[#22C55E]/90">
              {editingTransaction ? "Update" : "Add"} Transaction
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Transaction</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-gray-600 py-4">
              Are you sure you want to delete this transaction? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 border-t pt-4">
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => handleDelete(deleteConfirmId)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
