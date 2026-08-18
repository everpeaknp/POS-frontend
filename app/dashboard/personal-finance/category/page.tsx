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
  getCategories,
  setCategoriesForScope,
  useSyncedList,
  type PFCategory,
} from "@/lib/personal-finance/store";
import toast from "react-hot-toast";

// Categories come from the shared Personal Finance store
// (lib/personal-finance/store.ts) — see /new pages and the Transactions /
// Budget pages, which read from the same store.
// TODO: Replace with real backend API calls when endpoints are ready
// Backend needs: GET /api/personal-finance/categories, POST /categories, PUT /categories/:id, DELETE /categories/:id

type CategoryType = "income" | "expense";
type Category = PFCategory;

export default function CategoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const scope = user?.tenant?.slug ?? null;
  const [categories, setCategories] = useSyncedList<Category>(scope, getCategories, setCategoriesForScope);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("all"); // "all" | "expense" | "income"
  const [searchTerm, setSearchTerm] = useState("");
  const [filterParent, setFilterParent] = useState<string>("all");

  // Form state
  const [formData, setFormData] = useState<Omit<Category, "id" | "createdAt">>({
    name: "",
    type: "expense",
    description: "",
    isSystem: false,
    parentId: undefined,
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
    
    // Parent filter
    if (filterParent === "top") {
      filtered = filtered.filter((c) => !c.parentId);
    } else if (filterParent === "sub") {
      filtered = filtered.filter((c) => !!c.parentId);
    }
    
    return filtered;
  }, [categories, filterType, searchTerm, filterParent]);

  const incomeCategories = useMemo(() =>
    categories.filter((c) => c.type === "income"),
    [categories]
  );

  const expenseCategories = useMemo(() =>
    categories.filter((c) => c.type === "expense"),
    [categories]
  );

  const hasActiveFilters = Boolean(searchTerm || filterParent !== "all" || filterType !== "all");
  const clearFilters = () => {
    setSearchTerm("");
    setFilterParent("all");
    setFilterType("all");
  };

  // Only top-level categories of the current form type can be picked as a parent
  // (keeps the hierarchy to two levels: category → sub-category)
  const topLevelCategoriesForType = useMemo(
    () =>
      categories.filter(
        (c) => c.type === formData.type && !c.parentId && c.id !== editingCategory?.id
      ),
    [categories, formData.type, editingCategory]
  );

  const openAddDialog = () => {
    setEditingCategory(null);
    setFormData({
      name: "",
      type: filterType === "income" || filterType === "expense" ? filterType : "expense",
      description: "",
      isSystem: false,
      parentId: undefined,
    });
    setShowDialog(true);
  };

  // Sidebar "+" deep-links with ?new=1 to open this dialog directly
  useEffect(() => {
    if (searchParams.get("new") !== "1") return;
    openAddDialog();
    router.replace("/dashboard/personal-finance/category", { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, router]);

  const openEditDialog = (category: Category) => {
    if (category.isSystem) {
      toast.error("System categories cannot be edited");
      return;
    }
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      description: category.description || "",
      isSystem: category.isSystem,
      parentId: category.parentId,
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    // Validation
    if (!formData.name.trim()) {
      toast.error("Please enter a category name");
      return;
    }

    if (editingCategory) {
      // Update existing category
      setCategories((prev) =>
        prev.map((c) =>
          c.id === editingCategory.id
            ? { ...c, name: formData.name, description: formData.description, parentId: formData.parentId }
            : c
        )
      );
      toast.success("Category updated successfully");
    } else {
      // Add new category
      const newCategory: Category = {
        id: `cat_${Date.now()}`,
        ...formData,
        createdAt: new Date().toISOString(),
      };
      setCategories((prev) => [...prev, newCategory]);
      toast.success("Category added successfully");
    }

    setShowDialog(false);
  };

  const handleDelete = (id: string) => {
    const category = categories.find((c) => c.id === id);
    if (category?.isSystem) {
      toast.error("System categories cannot be deleted");
      setDeleteConfirmId(null);
      return;
    }

    setCategories((prev) => prev.filter((c) => c.id !== id));
    setDeleteConfirmId(null);
    toast.success("Category deleted successfully");
  };

  const renderCategoryList = (categoryList: Category[]) => {
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
          <Button onClick={openAddDialog} className="bg-[#22C55E] hover:bg-[#22C55E]/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Category
          </Button>
        </div>
      );
    }

    // Build table rows — show parent categories followed by their children
    const topLevel = categoryList.filter((c) => !c.parentId);
    const orphaned = categoryList.filter(
      (c) => c.parentId && !categoryList.some((p) => p.id === c.parentId)
    );

    const rows: { category: Category; isChild: boolean }[] = [];
    [...topLevel, ...orphaned].forEach((parent) => {
      rows.push({ category: parent, isChild: false });
      categoryList
        .filter((c) => c.parentId === parent.id)
        .forEach((child) => {
          rows.push({ category: child, isChild: true });
        });
    });

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
                Parent
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
            {rows.map(({ category, isChild }) => {
              const parentCategory = category.parentId
                ? categories.find((c) => c.id === category.parentId)
                : null;

              return (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div className={`flex items-center gap-2 ${isChild ? "pl-6" : ""}`}>
                      {isChild && (
                        <span className="text-gray-400">└─</span>
                      )}
                      <span className={isChild ? "text-gray-700" : "font-medium"}>
                        {category.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={category.type === "income" ? "default" : "secondary"}
                      className={
                        category.type === "income"
                          ? "bg-green-100 text-[#22C55E] hover:bg-green-100"
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
                    {parentCategory ? parentCategory.name : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {category.description || "-"}
                  </td>
                  <td className="px-4 py-3">
                    {category.isSystem && (
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
                        disabled={category.isSystem}
                        className="h-8 w-8 p-0"
                        title={category.isSystem ? "System categories cannot be edited" : "Edit category"}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirmId(category.id)}
                        disabled={category.isSystem}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        title={category.isSystem ? "System categories cannot be deleted" : "Delete category"}
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
                <p className="text-2xl font-bold text-[#22C55E]">{incomeCategories.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-[#22C55E]" />
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
                      <TrendingUp className="h-3.5 w-3.5 text-[#22C55E]" />
                      <span>Income ({incomeCategories.length})</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterParent} onValueChange={(v) => setFilterParent(v ?? "all")}>
                <SelectTrigger className="h-9 w-40 shrink-0 text-sm border-gray-200 bg-white">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="top">Top-level only</SelectItem>
                  <SelectItem value="sub">Sub-categories only</SelectItem>
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

            <Button onClick={openAddDialog} className="h-9 shrink-0 bg-[#22C55E] hover:bg-[#22C55E]/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>
        </div>

        {/* Categories Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {renderCategoryList(filteredCategories)}
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
                  onClick={() => setFormData({ ...formData, type: "expense", parentId: undefined })}
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
                  onClick={() => setFormData({ ...formData, type: "income", parentId: undefined })}
                  className={`flex items-center justify-center gap-2 h-10 rounded-lg border font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    formData.type === "income"
                      ? "border-[#22C55E] bg-green-50 text-[#16A34A]"
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
              <Label>Parent Category (optional)</Label>
              <Select
                value={formData.parentId || "none"}
                onValueChange={(value) => setFormData({ ...formData, parentId: value === "none" ? undefined : value ?? undefined })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="None — this is a new top-level category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None — this is a new top-level category</SelectItem>
                  {topLevelCategoriesForType.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Leave as None to create a new Category, or pick one to add a Sub Category under it
              </p>
            </div>

            <div>
              <Label>
                {formData.parentId ? "Sub Category" : "Category"} <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={formData.parentId ? "e.g., Fast Food, Coffee" : "e.g., Groceries, Salary, Rent"}
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
            <Button onClick={handleSave} className="bg-[#22C55E] hover:bg-[#22C55E]/90">
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
