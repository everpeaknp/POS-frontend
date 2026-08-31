"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, Trash2, Edit2, TrendingUp, TrendingDown, X, Upload, Building2, Wallet, CreditCard, Banknote, Check, ChevronsUpDown } from "lucide-react";
import { DashHeader } from "@/components/dashboard/dash-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DateInput } from "@/components/shared/DateInput";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/context/AuthContext";
import { formatCurrency } from "@/lib/utils";
import { todayIsoDate } from "@/lib/dates";
import { FormattedDate } from "@/components/shared/FormattedDate";
import { 
  financeTransactionAPI, 
  financeCategoryAPI, 
  financeAccountAPI,
  type FinanceTransaction,
  type FinanceCategory,
  type FinanceAccount
} from "@/lib/api/personal-finance";
import toast from "react-hot-toast";

type TransactionType = "income" | "expense";

type Transaction = FinanceTransaction;
type Category = FinanceCategory;
type Account = FinanceAccount;

// Nepali banks list
const NEPALI_BANKS = [
  "Nabil Bank",
  "Nepal Investment Mega Bank",
  "NIC Asia Bank",
  "Global IME Bank",
  "Himalayan Bank",
  "Standard Chartered Nepal",
  "Everest Bank",
  "Prime Commercial Bank",
  "Sanima Bank",
  "Kumari Bank",
  "Machhapuchchhre Bank",
  "Siddhartha Bank",
  "Nepal Bank Limited",
  "Rastriya Banijya Bank",
  "Agricultural Development Bank",
  "Citizens Bank International",
  "NMB Bank",
  "Prabhu Bank",
  "Laxmi Sunrise Bank",
];

const ACCOUNT_TYPE_OPTIONS = [
  { value: "bank", label: "Bank Account", icon: Building2 },
  { value: "cash", label: "Cash", icon: Wallet },
  { value: "credit_card", label: "Credit Card", icon: CreditCard },
  { value: "loan", label: "Loan", icon: Banknote },
  { value: "investment", label: "Investment", icon: TrendingUp },
] as const;

export default function TransactionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  
  // Quick add dialogs
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  
  // Combobox open state and search
  const [categoryComboOpen, setCategoryComboOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [accountComboOpen, setAccountComboOpen] = useState(false);
  const [accountSearch, setAccountSearch] = useState("");
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.category-dropdown') && !target.closest('.account-dropdown')) {
        setCategoryComboOpen(false);
        setAccountComboOpen(false);
      }
    };
    if (categoryComboOpen || accountComboOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [categoryComboOpen, accountComboOpen]);
  
  // Category form data
  const [categoryFormData, setCategoryFormData] = useState<Partial<Category>>({
    name: "",
    type: "expense",
    description: "",
  });
  
  // Account form data  
  const [accountFormData, setAccountFormData] = useState<Partial<Account>>({
    name: "",
    type: "bank",
    balance: "0",
    description: "",
    bankName: "",
    accountNumber: "",
  });

  // Form state
  const [formData, setFormData] = useState<Partial<Transaction>>({
    date: todayIsoDate(),
    type: "expense",
    amount: "0",
    category: undefined,
    account: undefined,
    description: "",
  });

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [categoriesData, accountsData, transactionsData] = await Promise.all([
          financeCategoryAPI.list(),
          financeAccountAPI.list(),
          financeTransactionAPI.list()
        ]);
        setCategories(categoriesData);
        setAccounts(accountsData);
        setTransactions(transactionsData);
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterAccount, setFilterAccount] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string>("");

  const workspaceName = user?.tenant?.workspace_name || user?.tenant?.name || "Workspace";
  const subtitle = `${workspaceName} · Income and expense transactions`;

  // Filter categories based on selected type
  const availableCategories = useMemo(() => {
    if (!formData.type || formData.type === "all") return categories;
    return categories.filter((cat) => cat.type === formData.type);
  }, [formData.type, categories]);

  // Filtered and sorted transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Search — matches description, category, account, or type (income/expense)
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          (t.description && t.description.toLowerCase().includes(lower)) ||
          (t.category_name && t.category_name.toLowerCase().includes(lower)) ||
          (t.account_name && t.account_name.toLowerCase().includes(lower)) ||
          t.type.includes(lower)
      );
    }

    if (filterType !== "all") {
      filtered = filtered.filter((t) => t.type === filterType);
    }
    if (filterCategory !== "all") {
      filtered = filtered.filter((t) => t.category === parseInt(filterCategory));
    }
    if (filterAccount !== "all") {
      filtered = filtered.filter((t) => t.account === parseInt(filterAccount));
    }
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
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const expense = filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    return { income, expense, net: income - expense };
  }, [filteredTransactions]);

  const openAddDialog = () => {
    setEditingTransaction(null);
    setReceiptFile(null);
    setReceiptPreview("");
    setFormData({
      date: todayIsoDate(),
      type: "expense",
      amount: "0",
      category: undefined,
      account: undefined,
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
    setReceiptFile(null);
    setReceiptPreview("");
    setFormData({
      date: transaction.date,
      type: transaction.type,
      amount: transaction.amount,
      category: transaction.category,
      account: transaction.account,
      description: transaction.description || "",
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    // Validate required fields
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }
    if (!formData.category) {
      toast.error("Please select a category");
      return;
    }
    if (!formData.account) {
      toast.error("Please select an account");
      return;
    }

    try {
      if (editingTransaction) {
        // Update existing transaction
        const updated = await financeTransactionAPI.update(editingTransaction.id, {
          date: formData.date!,
          type: formData.type as "income" | "expense",
          amount: formData.amount!,
          category: formData.category!,
          account: formData.account!,
          description: formData.description || "",
        });
        setTransactions((prev) =>
          prev.map((t) => (t.id === editingTransaction.id ? updated : t))
        );
        toast.success("Transaction updated successfully");
      } else {
        // Add new transaction
        const newTransaction = await financeTransactionAPI.create({
          date: formData.date!,
          type: formData.type as "income" | "expense",
          amount: formData.amount!,
          category: formData.category!,
          account: formData.account!,
          description: formData.description || "",
        });
        setTransactions((prev) => [newTransaction, ...prev]);
        toast.success("Transaction added successfully");
      }

      setShowDialog(false);
      setReceiptFile(null);
      setReceiptPreview("");
    } catch (error) {
      console.error("Error saving transaction:", error);
      toast.error("Failed to save transaction");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await financeTransactionAPI.delete(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      setDeleteConfirmId(null);
      toast.success("Transaction deleted successfully");
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast.error("Failed to delete transaction");
    }
  };

  // Quick add category handler
  const handleQuickAddCategory = async () => {
    if (!categoryFormData.name?.trim()) {
      toast.error("Please enter a category name");
      return;
    }

    try {
      const newCategory = await financeCategoryAPI.create({
        name: categoryFormData.name,
        type: categoryFormData.type as "income" | "expense",
        description: categoryFormData.description || "",
      });
      setCategories((prev) => [...prev, newCategory]);
      setFormData({ ...formData, category: newCategory.id });
      setCategoryFormData({ name: "", type: "expense", description: "" });
      setShowCategoryDialog(false);
      toast.success("Category added successfully");
    } catch (error) {
      console.error("Error adding category:", error);
      toast.error("Failed to add category");
    }
  };

  // Quick add account handler
  const handleQuickAddAccount = async () => {
    if (!accountFormData.name?.trim()) {
      toast.error("Please enter an account name");
      return;
    }
    
    if (accountFormData.type === "bank" && !accountFormData.bankName) {
      toast.error("Please select a bank name");
      return;
    }

    try {
      const newAccount = await financeAccountAPI.create({
        name: accountFormData.name,
        type: accountFormData.type as "bank" | "cash" | "credit_card" | "loan" | "investment",
        opening_balance: accountFormData.balance || "0",
        description: accountFormData.description || "",
        bank_name: accountFormData.bankName || "",
        account_number: accountFormData.accountNumber || "",
      });
      setAccounts((prev) => [...prev, newAccount]);
      setFormData({ ...formData, account: newAccount.id });
      setAccountFormData({ name: "", type: "bank", balance: "0", description: "", bankName: "", accountNumber: "" });
      setShowAccountDialog(false);
      toast.success("Account added successfully");
    } catch (error) {
      console.error("Error adding account:", error);
      toast.error("Failed to add account");
    }
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

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ["image/jpeg", "image/png", "image/gif", "application/pdf"];
      if (!validTypes.includes(file.type)) {
        toast.error("Please upload an image (JPG, PNG, GIF) or PDF file");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setReceiptFile(file);
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setReceiptPreview(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setReceiptPreview("pdf");
      }
    }
  };

  const handleRemoveReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview("");
  };

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
                  className="pl-9 pr-8 h-9 w-40 text-sm border-gray-200 bg-white focus-visible:ring-0 focus-visible:border-input"
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
                    <SelectItem key={cat.id} value={cat.id.toString()}>
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
                    <SelectItem key={acc.id} value={acc.id.toString()}>
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

            <Button 
              onClick={() => {
                setEditingTransaction(null);
                setFormData({
                  date: todayIsoDate(),
                  type: "income",
                  amount: "0",
                  category: undefined,
                  account: undefined,
                  description: "",
                });
                setShowDialog(true);
              }} 
              className="h-7 px-2.5 shrink-0 text-sm bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Income
            </Button>

            <Button 
              onClick={() => {
                setEditingTransaction(null);
                setFormData({
                  date: todayIsoDate(),
                  type: "expense",
                  amount: "0",
                  category: undefined,
                  account: undefined,
                  description: "",
                });
                setShowDialog(true);
              }} 
              className="h-7 px-2.5 shrink-0 text-sm bg-red-600 hover:bg-red-700"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Expense
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
                      Transaction ID
                    </th>
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
                    return (
                      <tr 
                        key={transaction.id} 
                        onClick={() => router.push(`/dashboard/personal-finance/transactions/${transaction.transaction_number}`)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3 text-sm">
                          <span className="font-mono text-xs text-gray-900">#{transaction.transaction_number}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <FormattedDate value={transaction.date} />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {transaction.description || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{transaction.category_name || "-"}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{transaction.account_name || "-"}</td>
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
                          {formatCurrency(parseFloat(transaction.amount))}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
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
                  onClick={() => setFormData({ ...formData, type: "expense", category: undefined })}
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
                  onClick={() => setFormData({ ...formData, type: "income", category: undefined })}
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
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  className="pl-9 focus-visible:ring-0 focus-visible:border-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Category Dropdown */}
              <div className="relative category-dropdown">
                <Label>Category <span className="text-red-500">*</span></Label>
                <button
                  type="button"
                  onClick={() => {
                    setCategoryComboOpen(!categoryComboOpen);
                    setAccountComboOpen(false);
                  }}
                  className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-lg text-left text-sm bg-white hover:bg-gray-50 flex items-center justify-between"
                >
                  <span className={formData.category ? "text-gray-900" : "text-gray-500"}>
                    {formData.category
                      ? availableCategories.find((cat) => cat.id === formData.category)?.name
                      : "Select category..."}
                  </span>
                  <ChevronsUpDown className="h-4 w-4 text-gray-400" />
                </button>

                {categoryComboOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                    <div className="p-2 border-b border-gray-200">
                      <Input
                        placeholder="Search category..."
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        className="h-8"
                        autoFocus
                      />
                    </div>

                    <div className="max-h-60 overflow-y-auto">
                      {availableCategories
                        .filter(cat => cat.name.toLowerCase().includes(categorySearch.toLowerCase()))
                        .map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, category: cat.id }));
                              setCategoryComboOpen(false);
                              setCategorySearch("");
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm flex items-center gap-2"
                          >
                            <Check
                              className={cn(
                                "h-4 w-4",
                                formData.category === cat.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {cat.name}
                          </button>
                        ))}
                      {availableCategories.filter(cat => cat.name.toLowerCase().includes(categorySearch.toLowerCase())).length === 0 && (
                        <div className="px-3 py-4 text-center text-sm text-gray-500">
                          No category found
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setCategoryComboOpen(false);
                        setCategorySearch("");
                        setShowCategoryDialog(true);
                      }}
                      className="w-full px-3 py-2 border-t border-gray-200 text-left text-sm text-[#22C55E] hover:bg-emerald-50 flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add new category
                    </button>
                  </div>
                )}
              </div>

              {/* Account Dropdown */}
              <div className="relative account-dropdown">
                <Label>Account <span className="text-red-500">*</span></Label>
                <button
                  type="button"
                  onClick={() => {
                    setAccountComboOpen(!accountComboOpen);
                    setCategoryComboOpen(false);
                  }}
                  className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-lg text-left text-sm bg-white hover:bg-gray-50 flex items-center justify-between"
                >
                  <span className={formData.account ? "text-gray-900" : "text-gray-500"}>
                    {formData.account
                      ? accounts.find((acc) => acc.id === formData.account)?.name
                      : "Select account..."}
                  </span>
                  <ChevronsUpDown className="h-4 w-4 text-gray-400" />
                </button>

                {accountComboOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                    <div className="p-2 border-b border-gray-200">
                      <Input
                        placeholder="Search account..."
                        value={accountSearch}
                        onChange={(e) => setAccountSearch(e.target.value)}
                        className="h-8"
                        autoFocus
                      />
                    </div>

                    <div className="max-h-60 overflow-y-auto">
                      {accounts
                        .filter(acc => acc.name.toLowerCase().includes(accountSearch.toLowerCase()))
                        .map((acc) => (
                          <button
                            key={acc.id}
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, account: acc.id }));
                              setAccountComboOpen(false);
                              setAccountSearch("");
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm flex items-center gap-2"
                          >
                            <Check
                              className={cn(
                                "h-4 w-4",
                                formData.account === acc.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {acc.name}
                          </button>
                        ))}
                      {accounts.filter(acc => acc.name.toLowerCase().includes(accountSearch.toLowerCase())).length === 0 && (
                        <div className="px-3 py-4 text-center text-sm text-gray-500">
                          No account found
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setAccountComboOpen(false);
                        setAccountSearch("");
                        setShowAccountDialog(true);
                      }}
                      className="w-full px-3 py-2 border-t border-gray-200 text-left text-sm text-[#22C55E] hover:bg-emerald-50 flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add new account
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label>Date</Label>
              <DateInput
                value={formData.date || todayIsoDate()}
                onChange={(date) => setFormData({ ...formData, date })}
                className="mt-1 focus-visible:ring-0 focus-visible:border-input"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Input
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional note"
                className="mt-1 focus-visible:ring-0 focus-visible:border-input"
              />
            </div>

            {/* Receipt Upload */}
            <div>
              <Label>Receipt / Bill (Image/PDF)</Label>
              <div className="mt-1">
                {!receiptFile ? (
                  <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#22C55E] hover:bg-emerald-50 transition">
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Click to upload receipt
                      </span>
                      <span className="text-xs text-gray-500">PNG, JPG, GIF or PDF (up to 10MB)</span>
                    </div>
                    <input
                      type="file"
                      onChange={handleReceiptChange}
                      accept="image/png,image/jpeg,image/gif,.pdf"
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="space-y-3">
                    {receiptPreview === "pdf" ? (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-red-100 rounded flex items-center justify-center">
                            <span className="text-xs font-bold text-red-600">PDF</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{receiptFile.name}</p>
                            <p className="text-xs text-gray-500">
                              {(receiptFile.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveReceipt}
                          className="text-red-600 hover:bg-red-50"
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <img
                          src={receiptPreview}
                          alt="Receipt preview"
                          className="w-full max-h-64 object-contain rounded-lg border border-gray-200"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleRemoveReceipt}
                          className="w-full text-red-600 hover:bg-red-50"
                        >
                          Remove Image
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
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

      {/* Quick Add Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add {categoryFormData.type === "income" ? "Income" : "Expense"} Category</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>
                Type <span className="text-red-500">*</span>
              </Label>
              <div className="mt-1 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCategoryFormData({ ...categoryFormData, type: "expense" })}
                  className={`flex items-center justify-center gap-2 h-10 rounded-lg border font-medium text-sm transition-all ${
                    categoryFormData.type === "expense"
                      ? "border-red-300 bg-red-50 text-red-700"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <TrendingDown className="h-4 w-4" />
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFormData({ ...categoryFormData, type: "income" })}
                  className={`flex items-center justify-center gap-2 h-10 rounded-lg border font-medium text-sm transition-all ${
                    categoryFormData.type === "income"
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
                Category Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={categoryFormData.name}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                placeholder="e.g., Groceries, Salary, Rent"
                className="mt-1 focus-visible:ring-0 focus-visible:border-input"
                autoFocus
              />
            </div>

            <div>
              <Label>Description</Label>
              <Input
                value={categoryFormData.description}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                placeholder="Optional description"
                className="mt-1 focus-visible:ring-0 focus-visible:border-input"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowCategoryDialog(false);
                setCategoryFormData({ name: "", type: "expense", description: "" });
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleQuickAddCategory} className="bg-[#22C55E] hover:bg-[#22C55E]/90">
              Add Category
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Add Account Dialog */}
      <Dialog open={showAccountDialog} onOpenChange={setShowAccountDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Account</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>
                Account Type <span className="text-red-500">*</span>
              </Label>
              <div className="mt-2 grid grid-cols-5 gap-2">
                {ACCOUNT_TYPE_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const active = accountFormData.type === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setAccountFormData({ ...accountFormData, type: option.value })}
                      className={`flex flex-col items-center justify-center gap-1.5 h-20 rounded-lg border text-xs font-medium transition-all ${
                        active
                          ? "border-[#22C55E] bg-green-50 text-[#16A34A]"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-center leading-tight px-1">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bank Name - only show for bank accounts */}
            {accountFormData.type === "bank" && (
              <div>
                <Label>
                  Bank Name <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={accountFormData.bankName || ""}
                  onValueChange={(value) => setAccountFormData({ ...accountFormData, bankName: value ?? "" })}
                >
                  <SelectTrigger className="mt-1 focus-visible:ring-0 focus-visible:border-input">
                    <SelectValue placeholder="Select bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {NEPALI_BANKS.map((bank) => (
                      <SelectItem key={bank} value={bank}>
                        {bank}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>
                Account Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={accountFormData.name}
                onChange={(e) => setAccountFormData({ ...accountFormData, name: e.target.value })}
                placeholder="e.g., My Checking Account, Main Credit Card"
                className="mt-1 focus-visible:ring-0 focus-visible:border-input"
                autoFocus={accountFormData.type !== "bank"}
              />
            </div>

            {/* Account Number - only show for bank accounts */}
            {accountFormData.type === "bank" && (
              <div>
                <Label>Account Number</Label>
                <Input
                  value={accountFormData.accountNumber}
                  onChange={(e) => setAccountFormData({ ...accountFormData, accountNumber: e.target.value })}
                  placeholder="e.g., 01234567890123"
                  className="mt-1 focus-visible:ring-0 focus-visible:border-input"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional. Only last 4 digits will be displayed in the list.
                </p>
              </div>
            )}

            <div>
              <Label>
                Current Balance <span className="text-red-500">*</span>
              </Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                  Rs.
                </span>
                <Input
                  type="number"
                  step="0.01"
                  value={accountFormData.balance || "0"}
                  onChange={(e) => setAccountFormData({ ...accountFormData, balance: e.target.value })}
                  placeholder="0.00"
                  className="pl-9 focus-visible:ring-0 focus-visible:border-input"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                For liabilities (credit cards, loans), enter as negative number (e.g., -25000)
              </p>
            </div>

            <div>
              <Label>Description</Label>
              <Input
                value={accountFormData.description}
                onChange={(e) => setAccountFormData({ ...accountFormData, description: e.target.value })}
                placeholder="Optional description"
                className="mt-1 focus-visible:ring-0 focus-visible:border-input"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowAccountDialog(false);
                setAccountFormData({ name: "", type: "bank", balance: "0", description: "", bankName: "", accountNumber: "" });
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleQuickAddAccount} className="bg-[#22C55E] hover:bg-[#22C55E]/90">
              Add Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
