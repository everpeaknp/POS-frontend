"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Edit2, Trash2, Tags, TrendingUp, TrendingDown, Search, X } from "lucide-react";
import { DashHeader } from "@/components/dashboard/dash-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/context/AuthContext";
import { 
  financeCategoryAPI,
  type FinanceCategory
} from "@/lib/api/personal-finance";
import toast from "react-hot-toast";

type CategoryType = "income" | "expense";
type Category = FinanceCategory;

export default function CategoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Load categories from API
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        const data = await financeCategoryAPI.list();
        setCategories(data);
      } catch (error) {
        console.error("Error loading categories:", error);
        toast.error("Failed to load categories");
      } finally {
        setLoading(false);
      }
    };
    loadCategories();
  }, []);
  
  const [showDialog, setShowDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<string>("all"); // "all" | "expense" | "income"
  const [searchTerm, setSearchTerm] = useState("");

  // Form state
  const [formData, setFormData] = useState<Partial<Category>>({
    name: "",
    type: "expense",
    description: "",
  });

  const workspaceName = user?.tenant?.workspace_name || user?.tenant?.name || "Workspace";
  const subtitle = `${workspaceName} · Manage income and expense categories`;

  // Filter categories by type
  const filteredCategories = useMemo(() => {
    let filtered = categories;
    
    // Filter by type
    if (filterType === "income") {
      filtered = filtered.filter((c) => c.type === "income");
    } else if (filterType === "expense") {
      filtered = filtered.filter((c) => c.type === "expense");
    }
    
    // Search filter
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(lower) ||
          (c.description || "").toLowerCase().includes(lower)
      );
    }
    
    return filtered;
  }, [categories, filterType, searchTerm]);

  const incomeCategories = useMemo(() =>
    categories.filter((c) => c.type === "income"),
    [categories]
  );

  const expenseCategories = useMemo(() =>
    categories.filter((c) => c.type === "expense"),
    [categories]
  );

  const hasActiveFilters = Boolean(searchTerm || filterType !== "all");
  const clearFilters = () => {
    setSearchTerm("");
    setFilterType("all");
  };

  const openAddDialog = () => {
    setEditingCategory(null);
    setFormData({
      name: "",
      type: filterType === "income" || filterType === "expense" ? (filterType as "income" | "expense") : "expense",
      description: "",
    });
    setShowDialog(true);
  };

  // Sidebar "+" deep-links with ?new=1 to open this dialog directly
  useEffect(() => {
    if (searchParams.get("new") !== "1") return;
    openAddDialog();
    router.replace("/dashboard/finance/category", { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, router]);

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      description: category.description || "",
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    // Validation
    if (!formData.name?.trim()) {
      toast.error("Please enter a category name");
      return;
    }

    try {
      if (editingCategory) {
        // Update existing category
        const updated = await financeCategoryAPI.update(editingCategory.id, {
          name: formData.name,
          type: formData.type as "income" | "expense",
          description: formData.description || "",
        });
        setCategories((prev) =>
          prev.map((c) => (c.id === editingCategory.id ? updated : c))
        );
        toast.success("Category updated successfully");
      } else {
        // Add new category
        const newCategory = await financeCategoryAPI.create({
          name: formData.name,
          type: formData.type as "income" | "expense",
          description: formData.description || "",
        });
        setCategories((prev) => [...prev, newCategory]);
        toast.success("Category added successfully");
      }

      setShowDialog(false);
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error("Failed to save category");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await financeCategoryAPI.delete(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setDeleteConfirmId(null);
      toast.success("Category deleted successfully");
    } catch (error: any) {
      console.error("Error deleting category:", error);
      // Check if the error is because category has transactions
      if (error.response?.data?.detail?.includes("transactions")) {
        toast.error("Cannot delete a category that has transactions");
      } else {
        toast.error("Failed to delete category");
      }
      setDeleteConfirmId(null);
    }
  };

  const CategoryListRenderer = (categoryList: Category[]) => {
    if (categoryList.length === 0) {
      if (hasActiveFilters) {
        return (
          <div className="text-center py-12">
            <Tags className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No categories match your filters</p>
            <Button variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        );
      }
      return (
        <div className="text-center py-12">
          <Tags className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">No categories yet</p>
          <Button onClick={openAddDialog} className="bg-[var(--color-accent-custom,#22C55E)] hover:bg-[var(--color-accent-custom,#22C55E)]/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Category
          </Button>
        </div>
      );
    }

    // Use the passed categoryList directly

    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {categoryList.map((category) => {
              return (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {category.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={category.type === "income" ? "default" : "secondary"}
                      className={
                        category.type === "income"
                          ? "bg-green-100 text-[var(--color-accent-custom,#22C55E)] hover:bg-[var(--color-accent-custom-100,#dcfce7)]"
                          : "bg-red-100 text-red-600 hover:bg-red-100"
                      }
                    >
                      {category.type === "income" ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {category.type === "income" ? "Income" : "Expense"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {category.description || "-"}
                  </td>
                  <td className="px-4 py-3">
                    {category.is_system && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                        System
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(category)}
                        disabled={category.is_system}
                        className="h-8 w-8 p-0"
                        title={category.is_system ? "System categories cannot be edited" : "Edit category"}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirmId(category.id)}
                        disabled={category.is_system}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        title={category.is_system ? "System categories cannot be deleted" : "Delete category"}
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
    );
  };

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Categories" subtitle={subtitle} />

      <div className="flex-1 p-6 space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Income Categories</p>
                <p className="text-2xl font-bold text-[var(--color-accent-custom,#22C55E)]">{incomeCategories.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-[var(--color-accent-custom,#22C55E)]" />
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Expense Categories</p>
                <p className="text-2xl font-bold text-red-600">{expenseCategories.length}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
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
                <SelectTrigger className="h-9 w-44 shrink-0 text-sm border-gray-200 bg-white">
                  <SelectValue placeholder={`All (${categories.length})`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    All ({categories.length})
                  </SelectItem>
                  <SelectItem value="expense">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-3.5 w-3.5 text-red-600" />
                      <span>Expense ({expenseCategories.length})</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="income">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-3.5 w-3.5 text-[var(--color-accent-custom,#22C55E)]" />
                      <span>Income ({incomeCategories.length})</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

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

            <Button onClick={openAddDialog} className="h-9 shrink-0 bg-[var(--color-accent-custom,#22C55E)] hover:bg-[var(--color-accent-custom,#22C55E)]/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>
        </div>

        {/* Categories Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {CategoryListRenderer(filteredCategories)}
        </div>

        {/* Info Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> System categories are pre-defined and cannot be edited or deleted. 
            You can add custom categories for your specific needs. Categories are used when recording 
            transactions to organize your income and expenses.
          </p>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : `Add ${formData.type === "income" ? "Income" : "Expense"} Category`}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>
                Type <span className="text-red-500">*</span>
              </Label>
              <div className="mt-1 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={!!editingCategory}
                  onClick={() => setFormData({ ...formData, type: "expense" })}
                  className={`flex items-center justify-center gap-2 h-10 rounded-lg border font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
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
                  disabled={!!editingCategory}
                  onClick={() => setFormData({ ...formData, type: "income" })}
                  className={`flex items-center justify-center gap-2 h-10 rounded-lg border font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    formData.type === "income"
                      ? "border-[var(--color-accent-custom,#22C55E)] bg-green-50 text-[#16A34A]"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <TrendingUp className="h-4 w-4" />
                  Income
                </button>
              </div>
              {editingCategory && (
                <p className="text-xs text-gray-500 mt-1">Category type cannot be changed after creation</p>
              )}
            </div>

            <div>
              <Label>
                Category Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Groceries, Salary, Rent"
                className="mt-1 focus-visible:ring-0 focus-visible:border-input"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
                className="mt-1 focus-visible:ring-0 focus-visible:border-input"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-[var(--color-accent-custom,#22C55E)] hover:bg-[var(--color-accent-custom,#22C55E)]/90">
              {editingCategory ? "Update" : "Add"} Category
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Category</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-gray-600 py-4">
              Are you sure you want to delete this category? This action cannot be undone. 
              Existing transactions using this category will remain unchanged.
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
