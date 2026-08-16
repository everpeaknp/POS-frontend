"use client";

import { useState, useMemo } from "react";
import { Plus, Edit2, CheckCircle2, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { DashHeader } from "@/components/dashboard/dash-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/context/AuthContext";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";

// MOCK DATA STRUCTURE
// TODO: Replace with real backend API calls when endpoints are ready
// Backend needs: GET /api/personal-finance/budgets, POST /budgets, PUT /budgets/:id

type CategoryType = "income" | "expense";

interface Category {
  id: string;
  name: string;
  type: CategoryType;
}

interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  month: string; // Format: YYYY-MM
  createdAt: string;
}

interface Transaction {
  id: string;
  date: string;
  type: CategoryType;
  amount: number;
  categoryId: string;
  accountId: string;
  description: string;
}

// Mock categories - matches Category page exactly (cat_1 through cat_14)
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

// Mock transactions - matches Transactions page
const MOCK_TRANSACTIONS: Transaction[] = [
  { id: "txn_1", date: "2026-08-01", type: "income", amount: 85000, categoryId: "cat_1", accountId: "acc_1", description: "Monthly salary" },
  { id: "txn_2", date: "2026-08-02", type: "expense", amount: 18000, categoryId: "cat_6", accountId: "acc_1", description: "Monthly rent payment" },
  { id: "txn_3", date: "2026-08-05", type: "expense", amount: 4500, categoryId: "cat_5", accountId: "acc_3", description: "Weekly groceries" },
  { id: "txn_4", date: "2026-08-07", type: "expense", amount: 2200, categoryId: "cat_8", accountId: "acc_4", description: "Dinner with friends" },
  { id: "txn_5", date: "2026-08-10", type: "income", amount: 15000, categoryId: "cat_2", accountId: "acc_2", description: "Freelance project payment" },
  { id: "txn_6", date: "2026-08-12", type: "expense", amount: 3500, categoryId: "cat_10", accountId: "acc_1", description: "Fuel and transportation" },
];

// Initial mock budgets
const INITIAL_MOCK_BUDGETS: Budget[] = [
  { id: "bud_1", categoryId: "cat_5", amount: 15000, month: "2026-08", createdAt: "2026-08-01T00:00:00Z" },
  { id: "bud_2", categoryId: "cat_6", amount: 20000, month: "2026-08", createdAt: "2026-08-01T00:00:00Z" },
  { id: "bud_3", categoryId: "cat_7", amount: 5000, month: "2026-08", createdAt: "2026-08-01T00:00:00Z" },
  { id: "bud_4", categoryId: "cat_8", amount: 8000, month: "2026-08", createdAt: "2026-08-01T00:00:00Z" },
  { id: "bud_5", categoryId: "cat_10", amount: 10000, month: "2026-08", createdAt: "2026-08-01T00:00:00Z" },
];

export default function BudgetPage() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>(INITIAL_MOCK_BUDGETS);
  const [showDialog, setShowDialog] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>("2026-08");
  const [activeTab, setActiveTab] = useState<CategoryType>("expense");

  // Form state
  const [formData, setFormData] = useState<{ categoryId: string; amount: number }>({
    categoryId: "",
    amount: 0,
  });

  const workspaceName = user?.tenant?.workspace_name || user?.tenant?.name || "Workspace";
  const subtitle = `${workspaceName} · Budget planning and tracking`;

  // Filter categories by type
  const expenseCategories = MOCK_CATEGORIES.filter((c) => c.type === "expense");
  const incomeCategories = MOCK_CATEGORIES.filter((c) => c.type === "income");

  // Get budgets for selected month
  const monthBudgets = useMemo(() => budgets.filter((b) => b.month === selectedMonth), [budgets, selectedMonth]);

  // Calculate spent amounts from transactions for selected month
  const spentByCategory = useMemo(() => {
    const spent: Record<string, number> = {};
    MOCK_TRANSACTIONS.filter((t) => t.date.startsWith(selectedMonth)).forEach((t) => {
      if (t.type === "expense") {
        spent[t.categoryId] = (spent[t.categoryId] || 0) + t.amount;
      }
    });
    return spent;
  }, [selectedMonth]);

  // Build budget data with spent info
  const budgetData = useMemo(() => {
    const categories = activeTab === "expense" ? expenseCategories : incomeCategories;
    return categories.map((category) => {
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
  }, [activeTab, expenseCategories, incomeCategories, monthBudgets, spentByCategory]);

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
                  onClick={() => handleDelete(budget.id)}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <AlertCircle className="h-4 w-4" />
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

  // Categories with no budget set
  const categoriesWithoutBudget = budgetData.filter((d) => !d.budget);

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
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Month</Label>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-48"
              />
            </div>
            <Button onClick={() => openAddDialog()} className="bg-[#22C55E] hover:bg-[#22C55E]/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Budget
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CategoryType)}>
            <div className="border-b border-gray-200 px-4 py-3">
              <TabsList className="bg-gray-100">
                <TabsTrigger value="expense" className="data-[state=active]:bg-white">
                  Expense Budgets
                </TabsTrigger>
                <TabsTrigger value="income" className="data-[state=active]:bg-white">
                  Income Goals
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="expense" className="p-4 mt-0">
              {budgetData.filter((d) => d.category.type === "expense").length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">No expense budgets set for {selectedMonth}</p>
                  <Button onClick={() => openAddDialog()} className="bg-[#22C55E] hover:bg-[#22C55E]/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Budget
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {budgetData.filter((d) => d.category.type === "expense").map(renderBudgetCard)}
                  </div>

                  {categoriesWithoutBudget.filter((d) => d.category.type === "expense").length > 0 && (
                    <div className="mt-6 pt-6 border-t">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">
                        Categories Without Budget ({categoriesWithoutBudget.filter((d) => d.category.type === "expense").length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categoriesWithoutBudget.filter((d) => d.category.type === "expense").map(renderBudgetCard)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="income" className="p-4 mt-0">
              {budgetData.filter((d) => d.category.type === "income").length === 0 ? (
                <div className="text-center py-12">
                  <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">No income goals set for {selectedMonth}</p>
                  <Button onClick={() => openAddDialog()} className="bg-[#22C55E] hover:bg-[#22C55E]/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Set Income Goal
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {budgetData.filter((d) => d.category.type === "income").map(renderBudgetCard)}
                </div>
              )}
            </TabsContent>
          </Tabs>
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
                {(activeTab === "expense" ? expenseCategories : incomeCategories).map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {editingBudget && (
                <p className="text-xs text-gray-500 mt-1">Category cannot be changed after creation</p>
              )}
            </div>

            <div>
              <Label>
                Budget Amount <span className="text-red-500">*</span>
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
    </div>
  );
}
