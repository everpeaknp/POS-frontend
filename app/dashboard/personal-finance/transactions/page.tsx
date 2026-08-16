"use client";

import { useState, useMemo } from "react";
import { Plus, Search, Filter, Trash2, Edit2, TrendingUp, TrendingDown, X } from "lucide-react";
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
import toast from "react-hot-toast";

// MOCK DATA STRUCTURE
// TODO: Replace with real backend API calls when endpoints are ready
// Backend needs: GET /api/personal-finance/transactions, POST /transactions, PUT /transactions/:id, DELETE /transactions/:id

type TransactionType = "income" | "expense";

interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  accountId: string;
  description: string;
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  type: TransactionType;
}

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
}

// Mock categories (will be replaced with data from Category page)
const MOCK_CATEGORIES: Category[] = [
  // Income categories
  { id: "cat_1", name: "Salary", type: "income" },
  { id: "cat_2", name: "Freelance", type: "income" },
  { id: "cat_3", name: "Investment Returns", type: "income" },
  { id: "cat_4", name: "Other Income", type: "income" },
  // Expense categories
  { id: "cat_5", name: "Groceries", type: "expense" },
  { id: "cat_6", name: "Rent", type: "expense" },
  { id: "cat_7", name: "Utilities", type: "expense" },
  { id: "cat_8", name: "Dining", type: "expense" },
  { id: "cat_9", name: "Entertainment", type: "expense" },
  { id: "cat_10", name: "Transportation", type: "expense" },
  { id: "cat_11", name: "Health", type: "expense" },
  { id: "cat_12", name: "Shopping", type: "expense" },
  { id: "cat_13", name: "Education", type: "expense" },
  { id: "cat_14", name: "Other Expenses", type: "expense" },
];

// Mock accounts (will be replaced with data from Account page)
const MOCK_ACCOUNTS: Account[] = [
  { id: "acc_1", name: "Checking Account", type: "bank", balance: 125000 },
  { id: "acc_2", name: "Savings Account", type: "bank", balance: 350000 },
  { id: "acc_3", name: "Cash Wallet", type: "cash", balance: 15000 },
  { id: "acc_4", name: "Credit Card", type: "credit_card", balance: -25000 },
];

// Mock transactions
const INITIAL_MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "txn_1",
    date: "2026-08-01",
    type: "income",
    amount: 85000,
    categoryId: "cat_1",
    accountId: "acc_1",
    description: "Monthly salary",
    createdAt: "2026-08-01T10:00:00Z",
  },
  {
    id: "txn_2",
    date: "2026-08-02",
    type: "expense",
    amount: 18000,
    categoryId: "cat_6",
    accountId: "acc_1",
    description: "Monthly rent payment",
    createdAt: "2026-08-02T14:30:00Z",
  },
  {
    id: "txn_3",
    date: "2026-08-05",
    type: "expense",
    amount: 4500,
    categoryId: "cat_5",
    accountId: "acc_3",
    description: "Weekly groceries",
    createdAt: "2026-08-05T18:15:00Z",
  },
  {
    id: "txn_4",
    date: "2026-08-07",
    type: "expense",
    amount: 2200,
    categoryId: "cat_8",
    accountId: "acc_4",
    description: "Dinner with friends",
    createdAt: "2026-08-07T20:45:00Z",
  },
  {
    id: "txn_5",
    date: "2026-08-10",
    type: "income",
    amount: 15000,
    categoryId: "cat_2",
    accountId: "acc_2",
    description: "Freelance project payment",
    createdAt: "2026-08-10T11:20:00Z",
  },
  {
    id: "txn_6",
    date: "2026-08-12",
    type: "expense",
    amount: 3500,
    categoryId: "cat_10",
    accountId: "acc_1",
    description: "Fuel and transportation",
    createdAt: "2026-08-12T16:00:00Z",
  },
];

export default function TransactionsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_MOCK_TRANSACTIONS);
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

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterAccount, setFilterAccount] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  const workspaceName = user?.tenant?.workspace_name || user?.tenant?.name || "Workspace";
  const subtitle = `${workspaceName} · Income and expense transactions`;

  // Filter categories based on selected type
  const availableCategories = useMemo(() => {
    if (formData.type === "all") return MOCK_CATEGORIES;
    return MOCK_CATEGORIES.filter((cat) => cat.type === formData.type);
  }, [formData.type]);

  // Filtered and sorted transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Search filter
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.description.toLowerCase().includes(lower) ||
          MOCK_CATEGORIES.find((c) => c.id === t.categoryId)?.name.toLowerCase().includes(lower) ||
          MOCK_ACCOUNTS.find((a) => a.id === t.accountId)?.name.toLowerCase().includes(lower)
      );
    }

    // Type filter
    if (filterType !== "all") {
      filtered = filtered.filter((t) => t.type === filterType);
    }

    // Category filter
    if (filterCategory !== "all") {
      filtered = filtered.filter((t) => t.categoryId === filterCategory);
    }

    // Account filter
    if (filterAccount !== "all") {
      filtered = filtered.filter((t) => t.accountId === filterAccount);
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter((t) => t.date >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter((t) => t.date <= dateTo);
    }

    // Sort by date descending
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchTerm, filterType, filterCategory, filterAccount, dateFrom, dateTo]);

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
    // Validation
    if (!formData.date) {
      toast.error("Please select a date");
      return;
    }
    if (formData.amount <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }
    if (!formData.categoryId) {
      toast.error("Please select a category");
      return;
    }
    if (!formData.accountId) {
      toast.error("Please select an account");
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

  const hasActiveFilters =
    searchTerm || filterType !== "all" || filterCategory !== "all" || filterAccount !== "all" || dateFrom || dateTo;

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
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? "bg-gray-50" : ""}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-[#22C55E] text-white rounded-full">
                  {[searchTerm, filterType !== "all", filterCategory !== "all", filterAccount !== "all", dateFrom, dateTo].filter(Boolean).length}
                </span>
              )}
            </Button>
            <Button onClick={openAddDialog} className="bg-[#22C55E] hover:bg-[#22C55E]/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="pt-3 border-t space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">Type</Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">Category</Label>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {MOCK_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">Account</Label>
                  <Select value={filterAccount} onValueChange={setFilterAccount}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Accounts</SelectItem>
                      {MOCK_ACCOUNTS.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">From Date</Label>
                  <DateInput value={dateFrom} onChange={setDateFrom} className="h-9" />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">To Date</Label>
                  <DateInput value={dateTo} onChange={setDateTo} className="h-9" />
                </div>
              </div>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters} className="mt-2">
                  <X className="h-3 w-3 mr-1" />
                  Clear Filters
                </Button>
              )}
            </div>
          )}
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
                    const category = MOCK_CATEGORIES.find((c) => c.id === transaction.categoryId);
                    const account = MOCK_ACCOUNTS.find((a) => a.id === transaction.accountId);

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
                Date <span className="text-red-500">*</span>
              </Label>
              <DateInput
                value={formData.date}
                onChange={(date) => setFormData({ ...formData, date })}
                className="mt-1"
              />
            </div>

            <div>
              <Label>
                Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value: TransactionType) =>
                  setFormData({ ...formData, type: value, categoryId: "" })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>
                Category <span className="text-red-500">*</span>
              </Label>
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
              <Label>
                Account <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.accountId} onValueChange={(value) => setFormData({ ...formData, accountId: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_ACCOUNTS.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>
                Amount <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.amount || ""}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional note"
                className="mt-1"
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
