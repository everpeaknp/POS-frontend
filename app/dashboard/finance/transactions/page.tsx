"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashHeader } from "@/components/dashboard/dash-header";
import { useAuth } from "@/lib/context/AuthContext";
import { todayIsoDate } from "@/lib/dates";
import { 
  financeTransactionAPI, 
  financeCategoryAPI, 
  financeAccountAPI,
  type FinanceTransaction,
  type FinanceCategory,
  type FinanceAccount
} from "@/lib/api/personal-finance";
import toast from "react-hot-toast";
import { TransactionSummaryCards } from "@/components/personal-finance/transactions/TransactionSummaryCards";
import { TransactionFilters } from "@/components/personal-finance/transactions/TransactionFilters";
import { TransactionTable } from "@/components/personal-finance/transactions/TransactionTable";
import { TransactionDialog } from "@/components/personal-finance/transactions/TransactionDialog";
import { DeleteConfirmDialog } from "@/components/personal-finance/transactions/DeleteConfirmDialog";
import { QuickAddCategoryDialog } from "@/components/personal-finance/transactions/QuickAddCategoryDialog";
import { QuickAddAccountDialog } from "@/components/personal-finance/transactions/QuickAddAccountDialog";

export default function TransactionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<FinanceTransaction | null>(null);
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
  const [categoryFormData, setCategoryFormData] = useState<Partial<FinanceCategory>>({
    name: "",
    type: "expense",
    description: "",
  });
  
  // Account form data  
  const [accountFormData, setAccountFormData] = useState<Partial<FinanceAccount>>({
    name: "",
    type: "bank",
    opening_balance: "0",
    description: "",
    bank_name: "",
    account_number: "",
  });

  // Form state
  const [formData, setFormData] = useState<Partial<FinanceTransaction>>({
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
    if (!formData.type) return categories;
    return categories.filter((cat) => cat.type === formData.type);
  }, [formData.type, categories]);

  // Filtered and sorted transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

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

  // Sidebar "+" and quick-action links deep-link with ?new=1
  useEffect(() => {
    if (searchParams.get("new") !== "1") return;
    openAddDialog();
    router.replace("/dashboard/finance/transactions", { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, router]);

  const openEditDialog = (transaction: FinanceTransaction) => {
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

  const handleQuickAddAccount = async () => {
    if (!accountFormData.name?.trim()) {
      toast.error("Please enter an account name");
      return;
    }
    
    if (accountFormData.type === "bank" && !accountFormData.bank_name) {
      toast.error("Please select a bank name");
      return;
    }

    try {
      const newAccount = await financeAccountAPI.create({
        name: accountFormData.name,
        type: accountFormData.type as "bank" | "cash" | "credit_card" | "loan" | "investment",
        opening_balance: accountFormData.opening_balance || "0",
        description: accountFormData.description || "",
        bank_name: accountFormData.bank_name || "",
        account_number: accountFormData.account_number || "",
      });
      setAccounts((prev) => [...prev, newAccount]);
      setFormData({ ...formData, account: newAccount.id });
      setAccountFormData({ name: "", type: "bank", opening_balance: "0", description: "", bank_name: "", account_number: "" });
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Transactions" subtitle={subtitle} />

      <div className="flex-1 p-6 space-y-4">
        {/* Summary Cards */}
        <TransactionSummaryCards
          income={summary.income}
          expense={summary.expense}
          net={summary.net}
        />

        {/* Filters */}
        <TransactionFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterType={filterType}
          onFilterTypeChange={setFilterType}
          filterCategory={filterCategory}
          onFilterCategoryChange={setFilterCategory}
          filterAccount={filterAccount}
          onFilterAccountChange={setFilterAccount}
          dateFrom={dateFrom}
          onDateFromChange={setDateFrom}
          dateTo={dateTo}
          onDateToChange={setDateTo}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
          categories={categories}
          accounts={accounts}
          onAddIncome={() => {
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
          onAddExpense={() => {
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
        />

        {/* Transactions Table */}
        <TransactionTable
          transactions={filteredTransactions}
          hasActiveFilters={hasActiveFilters}
          onRowClick={(transaction) => router.push(`/dashboard/finance/transactions/${transaction.transaction_number}`)}
          onEdit={openEditDialog}
          onDelete={(id) => setDeleteConfirmId(id)}
          onAddTransaction={openAddDialog}
        />
      </div>

      {/* Transaction Dialog */}
      <TransactionDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        editingTransaction={editingTransaction}
        formData={formData}
        onFormDataChange={(data) => setFormData({ ...formData, ...data })}
        availableCategories={availableCategories}
        accounts={accounts}
        onSave={handleSave}
        receiptFile={receiptFile}
        receiptPreview={receiptPreview}
        onReceiptChange={handleReceiptChange}
        onRemoveReceipt={handleRemoveReceipt}
        categoryComboOpen={categoryComboOpen}
        setCategoryComboOpen={setCategoryComboOpen}
        categorySearch={categorySearch}
        setCategorySearch={setCategorySearch}
        accountComboOpen={accountComboOpen}
        setAccountComboOpen={setAccountComboOpen}
        accountSearch={accountSearch}
        setAccountSearch={setAccountSearch}
        onShowCategoryDialog={() => setShowCategoryDialog(true)}
        onShowAccountDialog={() => setShowAccountDialog(true)}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={!!deleteConfirmId}
        onOpenChange={() => setDeleteConfirmId(null)}
        onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
      />

      {/* Quick Add Category Dialog */}
      <QuickAddCategoryDialog
        open={showCategoryDialog}
        onOpenChange={setShowCategoryDialog}
        formData={categoryFormData}
        onFormDataChange={(data) => setCategoryFormData({ ...categoryFormData, ...data })}
        onAdd={handleQuickAddCategory}
      />

      {/* Quick Add Account Dialog */}
      <QuickAddAccountDialog
        open={showAccountDialog}
        onOpenChange={setShowAccountDialog}
        formData={accountFormData}
        onFormDataChange={(data) => setAccountFormData({ ...accountFormData, ...data })}
        onAdd={handleQuickAddAccount}
      />
    </div>
  );
}
