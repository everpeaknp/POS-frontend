"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Edit2, CheckCircle2, TrendingUp, TrendingDown, AlertCircle, Search, X, Trash2, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DashHeader } from "@/components/dashboard/dash-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MonthYearPicker } from "@/components/shared/MonthYearPicker";
import { QuickAddCategoryDialog } from "@/components/personal-finance/transactions/QuickAddCategoryDialog";
import { useAuth } from "@/lib/context/AuthContext";
import { useDateSystemStore } from "@/lib/stores/dateSystemStore";
import { NEPALI_MONTHS } from "@/lib/dates";
import { adIsoToBsParts } from "@/lib/dates/convert";
import { scopedSidebarKey } from "@/lib/dashboard/nav-items";
import { formatCurrency } from "@/lib/utils";
import { 
  financeBudgetAPI, 
  financeCategoryAPI, 
  financeTransactionAPI,
  type FinanceBudget,
  type FinanceCategory,
  type FinanceTransaction
} from "@/lib/api/personal-finance";
import toast from "react-hot-toast";

type CategoryType = "income" | "expense";
type Category = FinanceCategory;
type Budget = FinanceBudget;
type Transaction = FinanceTransaction;

const BUDGET_CARD_ORDER_KEY = "khata-budget-card-order";

const AD_MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "2026-09" -> "September 2026" (AD) or the equivalent BS month/year, per the user's date system. */
function formatSelectedMonthLabel(yearMonth: string, dateSystem: "AD" | "BS"): string {
  if (dateSystem === "BS") {
    const bsParts = adIsoToBsParts(`${yearMonth}-15`);
    if (bsParts) return `${NEPALI_MONTHS[bsParts.monthIndex]} ${bsParts.year}`;
  }
  const [year, month] = yearMonth.split("-").map(Number);
  if (!year || !month) return yearMonth;
  return `${AD_MONTH_NAMES[month - 1]} ${year}`;
}

function getProgressColor(percentUsed: number, isOverBudget: boolean) {
  if (isOverBudget) return "bg-red-500";
  if (percentUsed >= 90) return "bg-amber-500";
  if (percentUsed >= 75) return "bg-yellow-500";
  return "bg-[var(--color-accent-custom,#22C55E)]";
}

interface BudgetCardData {
  category: Category;
  budget: Budget | undefined;
  spent: number;
  budgeted: number;
  remaining: number;
  percentUsed: number;
  isOverBudget: boolean;
}

function SortableBudgetCard({
  data,
  onEdit,
  onDelete,
  onSetBudget,
}: {
  data: BudgetCardData;
  onEdit: (budget: Budget) => void;
  onDelete: (budget: Budget) => void;
  onSetBudget: (categoryId: number) => void;
}) {
  const { category, budget, spent, budgeted, remaining, percentUsed, isOverBudget } = data;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border border-gray-200 rounded-lg p-4 ${isDragging ? "shadow-lg opacity-90 z-10 relative" : ""}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-1.5 min-w-0">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="mt-0.5 shrink-0 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none"
            aria-label={`Drag to reorder ${category.name}`}
            title="Drag to reorder"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <h3 className="font-medium text-gray-900 truncate">{category.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {formatCurrency(spent)} of {formatCurrency(budgeted)} spent
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {budget ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(budget)}
                className="h-8 w-8 p-0"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(budget)}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSetBudget(category.id)}
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
}

export default function BudgetPage() {
  const { user } = useAuth();
  const dateSystem = useDateSystemStore((state) => state.dateSystem);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [categoriesData, transactionsData, budgetsData] = await Promise.all([
          financeCategoryAPI.list(),
          financeTransactionAPI.list(),
          financeBudgetAPI.list()
        ]);
        setCategories(categoriesData);
        setTransactions(transactionsData);
        setBudgets(budgetsData);
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);
  const [showDialog, setShowDialog] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const [filterType, setFilterType] = useState<string>("all"); // "all" | "expense" | "income"
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  // User's saved drag-and-drop order for budget cards, keyed by category id.
  const [cardOrder, setCardOrder] = useState<number[]>([]);
  const tenantSlug = user?.tenant?.slug;

  // Load saved card order (scoped per tenant, since it's a per-workplace preference)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(scopedSidebarKey(BUDGET_CARD_ORDER_KEY, tenantSlug));
      setCardOrder(raw ? JSON.parse(raw) : []);
    } catch {
      setCardOrder([]);
    }
  }, [tenantSlug]);

  const dragSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null);

  // Form state
  const [formData, setFormData] = useState<{ category: number | null; amount: string }>({
    category: null,
    amount: "0",
  });

  // Quick "add new category" dialog, launched from inside the Add/Edit Budget dialog
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState<{
    name?: string;
    type?: "income" | "expense";
    description?: string;
  }>({ name: "", type: "expense", description: "" });

  const workspaceName = user?.tenant?.workspace_name || user?.tenant?.name || "Workspace";
  const subtitle = `${workspaceName} · Budget planning and tracking`;

  // Filter categories by type
  const expenseCategories = categories.filter((c) => c.type === "expense");
  const incomeCategories = categories.filter((c) => c.type === "income");

  // Get budgets for selected month
  const monthBudgets = useMemo(() => {
    return budgets.filter((b) => b.start_date.startsWith(selectedMonth));
  }, [budgets, selectedMonth]);

  // Calculate spent amounts from transactions for selected month
  const spentByCategory = useMemo(() => {
    const spent: Record<number, number> = {};
    transactions.filter((t) => t.date.startsWith(selectedMonth)).forEach((t) => {
      if (t.type === "expense" && t.category) {
        spent[t.category] = (spent[t.category] || 0) + parseFloat(t.amount);
      }
    });
    return spent;
  }, [transactions, selectedMonth]);

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
      const budget = monthBudgets.find((b) => b.category === category.id);
      const spent = spentByCategory[category.id] || 0;
      const budgeted = budget ? parseFloat(budget.amount) : 0;
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
    const totalBudgeted = monthBudgets.reduce((sum, b) => sum + parseFloat(b.amount), 0);
    const totalSpent = Object.values(spentByCategory).reduce((sum, amount) => sum + amount, 0);
    return { totalBudgeted, totalSpent, remaining: totalBudgeted - totalSpent };
  }, [monthBudgets, spentByCategory]);

  const openAddDialog = (categoryId?: number) => {
    // Check if budget already exists for this category/month
    const existingBudget = categoryId 
      ? budgets.find((b) => b.category === categoryId && b.start_date.startsWith(selectedMonth))
      : null;

    if (existingBudget) {
      // Pre-fill with existing budget for update
      setEditingBudget(existingBudget);
      setFormData({
        category: existingBudget.category,
        amount: existingBudget.amount,
      });
    } else {
      // New budget
      setEditingBudget(null);
      setFormData({
        category: categoryId || null,
        amount: "0",
      });
    }
    setShowDialog(true);
  };

  // Sidebar "+" deep-links with ?new=1 to open this dialog directly
  useEffect(() => {
    if (searchParams.get("new") !== "1") return;
    openAddDialog();
    router.replace("/dashboard/finance/budget", { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, router]);

  const openEditDialog = (budget: Budget) => {
    setEditingBudget(budget);
    setFormData({
      category: budget.category,
      amount: budget.amount,
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    // Validation
    if (!formData.category) {
      toast.error("Please select a category");
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error("Budget amount must be greater than 0");
      return;
    }

    try {
      if (editingBudget) {
        // Update existing budget
        const updated = await financeBudgetAPI.update(editingBudget.id, {
          name: editingBudget.name,
          category: formData.category,
          amount: formData.amount,
          period: editingBudget.period,
          start_date: editingBudget.start_date,
          end_date: editingBudget.end_date,
        });
        setBudgets((prev) =>
          prev.map((b) => (b.id === editingBudget.id ? updated : b))
        );
        toast.success("Budget updated successfully");
      } else {
        // Check if budget already exists for this category/month
        const existingBudget = budgets.find(
          (b) => b.category === formData.category && b.start_date.startsWith(selectedMonth)
        );

        if (existingBudget) {
          toast.error("Budget already exists for this category in this month");
          return;
        }

        // Add new budget
        const category = categories.find(c => c.id === formData.category);
        const newBudget = await financeBudgetAPI.create({
          name: `${category?.name || 'Budget'} - ${selectedMonth}`,
          category: formData.category,
          amount: formData.amount,
          period: 'monthly',
          start_date: `${selectedMonth}-01`,
          end_date: null,
        });
        setBudgets((prev) => [...prev, newBudget]);
        toast.success("Budget added successfully");
      }

      setShowDialog(false);
    } catch (error) {
      console.error("Error saving budget:", error);
      toast.error("Failed to save budget");
    }
  };

  const openAddCategoryDialog = () => {
    setCategoryFormData({ name: "", type: "expense", description: "" });
    setShowCategoryDialog(true);
  };

  const handleQuickAddCategory = async () => {
    const name = categoryFormData.name?.trim();
    if (!name) {
      toast.error("Please enter a category name");
      return;
    }

    const isDuplicate = categories.some(
      (c) => c.name.trim().toLowerCase() === name.toLowerCase()
    );
    if (isDuplicate) {
      toast.error(`"${name}" already exists as a category`);
      return;
    }

    try {
      const newCategory = await financeCategoryAPI.create({
        name,
        type: categoryFormData.type as "income" | "expense",
        description: categoryFormData.description || "",
      });
      setCategories((prev) => [...prev, newCategory]);
      setFormData((prev) => ({ ...prev, category: newCategory.id }));
      setShowCategoryDialog(false);
      toast.success("Category added successfully");
    } catch (error) {
      console.error("Error adding category:", error);
      toast.error("Failed to add category");
    }
  };

  const handleDelete = async (budgetId: number) => {
    try {
      await financeBudgetAPI.delete(budgetId);
      setBudgets((prev) => prev.filter((b) => b.id !== budgetId));
      toast.success("Budget deleted");
      setDeleteConfirmDialog(false);
      setBudgetToDelete(null);
    } catch (error) {
      console.error("Error deleting budget:", error);
      toast.error("Failed to delete budget");
    }
  };

  const openDeleteConfirm = (budget: Budget) => {
    setBudgetToDelete(budget);
    setDeleteConfirmDialog(true);
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

  // Apply the user's saved drag-and-drop order on top of the filtered list.
  // Categories not yet in the saved order (e.g. newly added ones) keep
  // appearing, just appended after the ordered ones.
  const orderedBudgetData = useMemo(() => {
    if (cardOrder.length === 0) return filteredBudgetData;
    const rank = new Map(cardOrder.map((id, index) => [id, index]));
    return [...filteredBudgetData].sort((a, b) => {
      const rankA = rank.has(a.category.id) ? rank.get(a.category.id)! : cardOrder.length + a.category.id;
      const rankB = rank.has(b.category.id) ? rank.get(b.category.id)! : cardOrder.length + b.category.id;
      return rankA - rankB;
    });
  }, [filteredBudgetData, cardOrder]);

  const handleCardDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedBudgetData.findIndex((d) => d.category.id === active.id);
    const newIndex = orderedBudgetData.findIndex((d) => d.category.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(orderedBudgetData, oldIndex, newIndex).map((d) => d.category.id);
    setCardOrder(newOrder);
    localStorage.setItem(scopedSidebarKey(BUDGET_CARD_ORDER_KEY, tenantSlug), JSON.stringify(newOrder));
  };

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
                <p className={`text-2xl font-bold ${summary.remaining >= 0 ? "text-[var(--color-accent-custom,#22C55E)]" : "text-red-600"}`}>
                  {formatCurrency(summary.remaining)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-[var(--color-accent-custom,#22C55E)]" />
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

              <MonthYearPicker
                value={selectedMonth}
                onChange={(value) => setSelectedMonth(value)}
                className="shrink-0"
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

            <Button onClick={() => openAddDialog()} className="h-9 shrink-0 bg-[var(--color-accent-custom,#22C55E)] hover:bg-[var(--color-accent-custom,#22C55E)]/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Budget
            </Button>
          </div>
        </div>

        {/* Budgets List */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {filteredBudgetData.length === 0 ? (
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
                  <Button onClick={() => openAddDialog()} className="bg-[var(--color-accent-custom,#22C55E)] hover:bg-[var(--color-accent-custom,#22C55E)]/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Budget
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="p-4">
              <DndContext sensors={dragSensors} collisionDetection={closestCenter} onDragEnd={handleCardDragEnd}>
                <SortableContext
                  items={orderedBudgetData.map((d) => d.category.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {orderedBudgetData.map((data) => (
                      <SortableBudgetCard
                        key={data.category.id}
                        data={data}
                        onEdit={openEditDialog}
                        onDelete={openDeleteConfirm}
                        onSetBudget={openAddDialog}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
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
                value={formData.category?.toString() || ""}
                onChange={(e) => {
                  if (e.target.value === "__add_new__") {
                    openAddCategoryDialog();
                    return;
                  }
                  setFormData({ ...formData, category: parseInt(e.target.value) });
                }}
                disabled={!!editingBudget}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-custom,#22C55E)]"
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
                {!editingBudget && (
                  <option value="__add_new__">+ Add new category…</option>
                )}
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
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  className="pl-9 focus-visible:ring-0 focus-visible:border-input"
                />
              </div>
            </div>

            <div>
              <Label>Month</Label>
              <p className="mt-1 text-sm">
                This budget applies to{" "}
                <span className="font-medium">{formatSelectedMonthLabel(selectedMonth, dateSystem)}</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Switch months using the page&apos;s month selector to add a budget for a different month.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-[var(--color-accent-custom,#22C55E)] hover:bg-[var(--color-accent-custom,#22C55E)]/90">
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
                {budgetToDelete && categories.find((c) => c.id === budgetToDelete.category)?.name}
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

      {/* Quick Add Category Dialog (launched from inside Add/Edit Budget) */}
      <QuickAddCategoryDialog
        open={showCategoryDialog}
        onOpenChange={setShowCategoryDialog}
        formData={categoryFormData}
        onFormDataChange={(data) => setCategoryFormData({ ...categoryFormData, ...data })}
        onAdd={handleQuickAddCategory}
      />
    </div>
  );
}
