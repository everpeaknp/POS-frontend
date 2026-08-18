"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Edit2, CheckCircle2, TrendingUp, TrendingDown, AlertCircle, Search, X, LayoutGrid, List, Trash2 } from "lucide-react";
import { DashHeader } from "@/components/dashboard/dash-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/context/AuthContext";
import { formatCurrency } from "@/lib/utils";
import {
  getCategories,
  getTransactions,
  getBudgets,
  setBudgetsForScope,
  useSyncedList,
  type PFCategory,
  type PFTransaction, 
  type PFBudget,
} from "@/lib/personal-finance/store";
import toast from "react-hot-toast";

// Categories, transactions, and budgets come from the shared Personal Finance
// store (lib/personal-finance/store.ts) — see /new pages and the Category /
// Transactions pages, which read/write the same store.
// TODO: Replace with real backend API calls when endpoints are ready
// Backend needs: GET /api/personal-finance/budgets, POST /budgets, PUT /budgets/:id

type CategoryType = "income" | "expense";
type Category = PFCategory;
type Budget = PFBudget;
type Transaction = PFTransaction;

export default function BudgetPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const scope = user?.tenant?.slug ?? null;
  const [categories, setCategories] = useState<Category[]>(() => getCategories(scope));
  const [transactions, setTransactions] = useState<Transaction[]>(() => getTransactions(scope));
  useEffect(() => {
    setCategories(getCategories(scope));
    setTransactions(getTransactions(scope));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);
  const [budgets, setBudgets] = useSyncedList<Budget>(scope, getBudgets, setBudgetsForScope);
  const [showDialog, setShowDialog] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>("2026-08");
  const [filterType, setFilterType] = useState<string>("all"); // "all" | "expense" | "income"
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null);

  // Form state
  const [formData, setFormData] = useState<{ categoryId: string; amount: number }>({
    categoryId: "",
    amount: 0,
  });

  const workspaceName = user?.tenant?.workspace_name || user?.tenant?.name || "Workspace";
  const subtitle = `${workspaceName} · Budget planning and tracking`;

  // Filter categories by type
  const expenseCategories = categories.filter((c) => c.type === "expense");
  const incomeCategories = categories.filter((c) => c.type === "income");

  // Get budgets for selected month
  const monthBudgets = useMemo(() => budgets.filter((b) => b.month === selectedMonth), [budgets, selectedMonth]);

  // Calculate spent amounts from transactions for selected month
  const spentByCategory = useMemo(() => {
    const spent: Record<string, number> = {};
    transactions.filter((t) => t.date.startsWith(selectedMonth)).forEach((t) => {
      if (t.type === "expense") {
        spent[t.categoryId] = (spent[t.categoryId] || 0) + t.amount;
      }
    });
    return spent;
  }, [selectedMonth]);

  // Build budget data with spent info
  const budgetData = useMemo(() => {
    let categoriesToShow = [...expenseCategories, ...incomeCategories];
    
    // Filter by type
    if (filterType === "expense") {
      categoriesToShow = expenseCategories;
    } else if (filterType === "income") {
      categoriesToShow = incomeCategories;
    }
    
    return categoriesToShow.map((category) => {
      const budget = monthBudgets.find((b) => b.categoryId === category.id);
      const spent = spentByCategory[category.id] || 0;
      const budgeted = budget?.amount || 0;
      const remaining = budgeted - spent;
      const percentUsed = budgeted > 0 ? (spent / budgeted) * 100 : 0;

      return {
        category,
        budget,
        spent,
        budgeted,
        remaining,
        percentUsed,
        isOverBudget: spent > budgeted && budgeted > 0,
      };
    });
  }, [filterType, expenseCategories, incomeCategories, monthBudgets, spentByCategory]);

  // Summary
  const summary = useMemo(() => {
    const totalBudgeted = monthBudgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = Object.values(spentByCategory).reduce((sum, amount) => sum + amount, 0);
    return { totalBudgeted, totalSpent, remaining: totalBudgeted - totalSpent };
  }, [monthBudgets, spentByCategory]);

  const openAddDialog = (categoryId?: string) => {
    // Check if budget already exists for this category/month
    const existingBudget = categoryId 
      ? budgets.find((b) => b.categoryId === categoryId && b.month === selectedMonth)
      : null;

    if (existingBudget) {
      // Pre-fill with existing budget for update
      setEditingBudget(existingBudget);
      setFormData({
        categoryId: existingBudget.categoryId,
        amount: existingBudget.amount,
      });
    } else {
      // New budget
      setEditingBudget(null);
      setFormData({
        categoryId: categoryId || "",
        amount: 0,
      });
    }
    setShowDialog(true);
  };

  // Sidebar "+" deep-links with ?new=1 to open this dialog directly
  useEffect(() => {
    if (searchParams.get("new") !== "1") return;
    openAddDialog();
    router.replace("/dashboard/personal-finance/budget", { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, router]);

  const openEditDialog = (budget: Budget) => {
    setEditingBudget(budget);
    setFormData({
      categoryId: budget.categoryId,
      amount: budget.amount,
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    // Validation
    if (!formData.categoryId) {
      toast.error("Please select a category");
      return;
    }
    if (formData.amount <= 0) {
      toast.error("Budget amount must be greater than 0");
      return;
    }

    if (editingBudget) {
      // Update existing budget
      setBudgets((prev) =>
        prev.map((b) => (b.id === editingBudget.id ? { ...b, amount: formData.amount } : b))
      );
      toast.success("Budget updated successfully");
    } else {
      // Check if budget already exists for this category/month (shouldn't happen due to openAddDialog logic)
      const existingBudget = budgets.find(
        (b) => b.categoryId === formData.categoryId && b.month === selectedMonth
      );

      if (existingBudget) {
        toast.error("Budget already exists for this category in this month");
        return;
      }

      // Add new budget
      const newBudget: Budget = {
        id: `bud_${Date.now()}`,
        categoryId: formData.categoryId,
        amount: formData.amount,
        month: selectedMonth,
        createdAt: new Date().toISOString(),
      };
      setBudgets((prev) => [...prev, newBudget]);
      toast.success("Budget added successfully");
    }

    setShowDialog(false);
  };

  const handleDelete = (budgetId: string) => {
    setBudgets((prev) => prev.filter((b) => b.id !== budgetId));
    toast.success("Budget deleted");
    setDeleteConfirmDialog(false);
    setBudgetToDelete(null);
  };

  const openDeleteConfirm = (budget: Budget) => {
    setBudgetToDelete(budget);
    setDeleteConfirmDialog(true);
  };

  const getProgressColor = (percentUsed: number, isOverBudget: boolean) => {
    if (isOverBudget) return "bg-red-500";
    if (percentUsed >= 90) return "bg-amber-500";
    if (percentUsed >= 75) return "bg-yellow-500";
    return "bg-[#22C55E]";
  };

  const renderBudgetCard = (data: typeof budgetData[0]) => {
    const { category, budget, spent, budgeted, remaining, percentUsed, isOverBudget } = data;

    return (
      <div key={category.id} className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-medium text-gray-900">{category.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {formatCurrency(spent)} of {formatCurrency(budgeted)} spent
            </p>
          </div>
          <div className="flex items-center gap-2">
            {budget ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditDialog(budget)}
                  className="h-8 w-8 p-0"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openDeleteConfirm(budget)}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openAddDialog(category.id)}
                className="h-8 px-3 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Set Budget
              </Button>
            )}
          </div>
        </div>

        {budget && (
          <>
            {/* Progress Bar */}
            <div className="mb-2">
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${getProgressColor(percentUsed, isOverBudget)}`}
                  style={{ width: `${Math.min(percentUsed, 100)}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-xs">
              <span className={`font-medium ${isOverBudget ? "text-red-600" : remaining < budgeted * 0.1 ? "text-amber-600" : "text-gray-600"}`}>
                {isOverBudget ? `Over by ${formatCurrency(Math.abs(remaining))}` : `${formatCurrency(remaining)} left`}
              </span>
              <span className="text-gray-500">{percentUsed.toFixed(0)}%</span>
            </div>

            {isOverBudget && (
              <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Budget exceeded
              </div>
            )}
          </>
        )}

        {!budget && spent > 0 && (
          <div className="text-xs text-gray-500 mt-2">
            Spending detected, but no budget set for this category.
          </div>
        )}
      </div>
    );
  };

  const renderBudgetsTable = () => {
    if (filteredBudgetData.length === 0) {
      return (
        <div className="text-center py-12">
          <CheckCircle2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          {hasActiveFilters ? (
            <>
              <p className="text-gray-500 mb-4">No budgets match your filters</p>
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            </>
          ) : (
            <>
              <p className="text-gray-500 mb-4">No budgets set for {selectedMonth}</p>
              <Button onClick={() => openAddDialog()} className="bg-[#22C55E] hover:bg-[#22C55E]/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Budget
              </Button>
            </>
          )}
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Budgeted
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Spent
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Remaining
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Progress
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredBudgetData.map((data) => {
              const { category, budget, spent, budgeted, remaining, percentUsed, isOverBudget } = data;

              return (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {category.name}
                  </td>
                  <td className="px-4 py-3">
                    {category.type === "income" ? (
                      <div className="inline-flex items-center gap-1 text-xs text-[#22C55E]">
                        <TrendingUp className="h-3 w-3" />
                        Income
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1 text-xs text-red-600">
                        <TrendingDown className="h-3 w-3" />
                        Expense
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">
                    {budget ? formatCurrency(budgeted) : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-600">
                    {formatCurrency(spent)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    {budget ? (
                      <span className={isOverBudget ? "text-red-600 font-medium" : "text-[#22C55E]"}>
                        {formatCurrency(remaining)}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {budget ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden min-w-[80px]">
                          <div
                            className={`h-full transition-all ${getProgressColor(percentUsed, isOverBudget)}`}
                            style={{ width: `${Math.min(percentUsed, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 shrink-0 w-10 text-right">
                          {percentUsed.toFixed(0)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">No budget</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {budget ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(budget)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteConfirm(budget)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openAddDialog(category.id)}
                          className="h-8 px-3 text-xs"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Set Budget
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // Search + status filter, applied on top of budgetData
  const filteredBudgetData = useMemo(() => {
    let filtered = budgetData;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter((d) => d.category.name.toLowerCase().includes(lower));
    }
    if (filterStatus === "over") {
      filtered = filtered.filter((d) => d.isOverBudget);
    } else if (filterStatus === "on_track") {
      filtered = filtered.filter((d) => d.budget && !d.isOverBudget);
    } else if (filterStatus === "no_budget") {
      filtered = filtered.filter((d) => !d.budget);
    }
    return filtered;
  }, [budgetData, searchTerm, filterStatus]);

  const hasActiveFilters = Boolean(searchTerm || filterStatus !== "all" || filterType !== "all");
  const clearFilters = () => {
    setSearchTerm("");
    setFilterStatus("all");
    setFilterType("all");
  };

  // Categories with no budget set
  const categoriesWithoutBudget = filteredBudgetData.filter((d) => !d.budget);

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Budget" subtitle={subtitle} />

      <div className="flex-1 p-6 space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Budgeted</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary.totalBudgeted)}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Spent</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalSpent)}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Remaining</p>
                <p className={`text-2xl font-bold ${summary.remaining >= 0 ? "text-[#22C55E]" : "text-red-600"}`}>
                  {formatCurrency(summary.remaining)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-[#22C55E]" />
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
                  placeholder="Search categories..."
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
                <SelectTrigger className="h-9 w-40 shrink-0 text-sm border-gray-200 bg-white">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All ({expenseCategories.length + incomeCategories.length})</SelectItem>
                  <SelectItem value="expense">Expense ({expenseCategories.length})</SelectItem>
                  <SelectItem value="income">Income ({incomeCategories.length})</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? "all")}>
                <SelectTrigger className="h-9 w-36 shrink-0 text-sm border-gray-200 bg-white">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="over">Over Budget</SelectItem>
                  <SelectItem value="on_track">On Track</SelectItem>
                  <SelectItem value="no_budget">No Budget Set</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="h-9 w-36 shrink-0 text-sm border-gray-200 focus-visible:ring-0 focus-visible:border-input"
              />

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

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
                className={`h-9 w-9 ${viewMode === "list" ? "bg-[#22C55E] hover:bg-[#22C55E]/90" : ""}`}
                title="List view"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
                className={`h-9 w-9 ${viewMode === "grid" ? "bg-[#22C55E] hover:bg-[#22C55E]/90" : ""}`}
                title="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>

            <Button onClick={() => openAddDialog()} className="h-9 shrink-0 bg-[#22C55E] hover:bg-[#22C55E]/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Budget
            </Button>
          </div>
        </div>

        {/* Budgets List */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {viewMode === "list" ? (
            renderBudgetsTable()
          ) : filteredBudgetData.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              {hasActiveFilters ? (
                <>
                  <p className="text-gray-500 mb-4">No budgets match your filters</p>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear filters
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-gray-500 mb-4">No budgets set for {selectedMonth}</p>
                  <Button onClick={() => openAddDialog()} className="bg-[#22C55E] hover:bg-[#22C55E]/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Budget
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBudgetData.map(renderBudgetCard)}
              </div>
            </div>
          )}
        </div>

        {/* Info Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Budgets are calculated from your actual transactions. Set a monthly budget for each category to track your spending. Progress bars show how much of your budget has been used.
          </p>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingBudget ? "Update Budget" : "Add Budget"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>
                Category <span className="text-red-500">*</span>
              </Label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                disabled={!!editingBudget}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
              >
                <option value="">Select category</option>
                <optgroup label="Expense Categories">
                  {expenseCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Income Categories">
                  {incomeCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </optgroup>
              </select>
              {editingBudget && (
                <p className="text-xs text-gray-500 mt-1">Category cannot be changed after creation</p>
              )}
            </div>

            <div>
              <Label>
                Budget Amount <span className="text-red-500">*</span>
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

            <div>
              <Label>Month</Label>
              <Input type="month" value={selectedMonth} disabled className="mt-1 bg-gray-50" />
              <p className="text-xs text-gray-500 mt-1">Budget will be set for {selectedMonth}</p>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-[#22C55E] hover:bg-[#22C55E]/90">
              {editingBudget ? "Update" : "Add"} Budget
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmDialog} onOpenChange={setDeleteConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Budget?</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete the budget for{" "}
              <span className="font-semibold text-gray-900">
                {budgetToDelete && categories.find((c) => c.id === budgetToDelete.categoryId)?.name}
              </span>
              ? This action cannot be undone.
            </p>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={() => setDeleteConfirmDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => budgetToDelete && handleDelete(budgetToDelete.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Budget
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
