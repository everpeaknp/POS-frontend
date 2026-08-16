"use client";

import { useState, useMemo } from "react";
import { Plus, Edit2, Trash2, Tags, TrendingUp, TrendingDown } from "lucide-react";
import { DashHeader } from "@/components/dashboard/dash-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/context/AuthContext";
import toast from "react-hot-toast";

// MOCK DATA STRUCTURE
// TODO: Replace with real backend API calls when endpoints are ready
// Backend needs: GET /api/personal-finance/categories, POST /categories, PUT /categories/:id, DELETE /categories/:id

type CategoryType = "income" | "expense";

interface Category {
  id: string;
  name: string;
  type: CategoryType;
  description?: string;
  color?: string;
  isSystem?: boolean; // System categories can't be deleted
  createdAt: string;
}

// Initial mock categories - matches product spec and Transactions page
const INITIAL_MOCK_CATEGORIES: Category[] = [
  // Income categories
  { id: "cat_1", name: "Salary", type: "income", description: "Monthly salary income", isSystem: true, createdAt: "2026-01-01T00:00:00Z" },
  { id: "cat_2", name: "Freelance", type: "income", description: "Freelance project income", isSystem: true, createdAt: "2026-01-01T00:00:00Z" },
  { id: "cat_3", name: "Investment Returns", type: "income", description: "Interest, dividends, capital gains", isSystem: true, createdAt: "2026-01-01T00:00:00Z" },
  { id: "cat_4", name: "Other Income", type: "income", description: "Miscellaneous income", isSystem: false, createdAt: "2026-01-01T00:00:00Z" },
  
  // Expense categories - matches product spec
  { id: "cat_5", name: "Groceries", type: "expense", description: "Food and household items", isSystem: true, createdAt: "2026-01-01T00:00:00Z" },
  { id: "cat_6", name: "Rent", type: "expense", description: "Monthly rent payment", isSystem: true, createdAt: "2026-01-01T00:00:00Z" },
  { id: "cat_7", name: "Utilities", type: "expense", description: "Electricity, water, internet, phone", isSystem: true, createdAt: "2026-01-01T00:00:00Z" },
  { id: "cat_8", name: "Dining", type: "expense", description: "Restaurants and food delivery", isSystem: true, createdAt: "2026-01-01T00:00:00Z" },
  { id: "cat_9", name: "Entertainment", type: "expense", description: "Movies, streaming, hobbies", isSystem: true, createdAt: "2026-01-01T00:00:00Z" },
  { id: "cat_10", name: "Transportation", type: "expense", description: "Fuel, public transport, vehicle maintenance", isSystem: true, createdAt: "2026-01-01T00:00:00Z" },
  { id: "cat_11", name: "Health", type: "expense", description: "Medical, pharmacy, insurance", isSystem: true, createdAt: "2026-01-01T00:00:00Z" },
  { id: "cat_12", name: "Shopping", type: "expense", description: "Clothing, electronics, personal items", isSystem: false, createdAt: "2026-01-01T00:00:00Z" },
  { id: "cat_13", name: "Education", type: "expense", description: "Courses, books, training", isSystem: false, createdAt: "2026-01-01T00:00:00Z" },
  { id: "cat_14", name: "Other Expenses", type: "expense", description: "Miscellaneous expenses", isSystem: false, createdAt: "2026-01-01T00:00:00Z" },
];

export default function CategoryPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>(INITIAL_MOCK_CATEGORIES);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<CategoryType>("expense");

  // Form state
  const [formData, setFormData] = useState<Omit<Category, "id" | "createdAt">>({
    name: "",
    type: "expense",
    description: "",
    isSystem: false,
  });

  const workspaceName = user?.tenant?.workspace_name || user?.tenant?.name || "Workspace";
  const subtitle = `${workspaceName} · Manage income and expense categories`;

  // Filter categories by type
  const incomeCategories = useMemo(() => 
    categories.filter((c) => c.type === "income"),
    [categories]
  );

  const expenseCategories = useMemo(() => 
    categories.filter((c) => c.type === "expense"),
    [categories]
  );

  const openAddDialog = (type: CategoryType) => {
    setEditingCategory(null);
    setFormData({
      name: "",
      type,
      description: "",
      isSystem: false,
    });
    setShowDialog(true);
  };

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
            ? { ...c, name: formData.name, description: formData.description }
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

  const renderCategoryList = (categoryList: Category[], type: CategoryType) => {
    if (categoryList.length === 0) {
      return (
        <div className="text-center py-12">
          <Tags className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">No {type} categories yet</p>
          <Button onClick={() => openAddDialog(type)} className="bg-[#22C55E] hover:bg-[#22C55E]/90">
            <Plus className="h-4 w-4 mr-2" />
            Add {type === "income" ? "Income" : "Expense"} Category
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {categoryList.map((category) => (
          <div
            key={category.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-gray-900">{category.name}</h3>
                  {category.isSystem && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-xs">
                      System
                    </Badge>
                  )}
                  <Badge
                    variant={type === "income" ? "default" : "secondary"}
                    className={
                      type === "income"
                        ? "bg-green-100 text-[#22C55E] hover:bg-green-100 text-xs"
                        : "bg-red-100 text-red-600 hover:bg-red-100 text-xs"
                    }
                  >
                    {type === "income" ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {type === "income" ? "Income" : "Expense"}
                  </Badge>
                </div>
                {category.description && (
                  <p className="text-sm text-gray-600">{category.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 ml-4">
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
            </div>
          </div>
        ))}
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

        {/* Tabs */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CategoryType)}>
            <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <TabsList className="bg-gray-100">
                <TabsTrigger value="expense" className="data-[state=active]:bg-white">
                  Expense Categories ({expenseCategories.length})
                </TabsTrigger>
                <TabsTrigger value="income" className="data-[state=active]:bg-white">
                  Income Categories ({incomeCategories.length})
                </TabsTrigger>
              </TabsList>
              <Button onClick={() => openAddDialog(activeTab)} className="bg-[#22C55E] hover:bg-[#22C55E]/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </div>

            <TabsContent value="expense" className="p-4 mt-0">
              {renderCategoryList(expenseCategories, "expense")}
            </TabsContent>

            <TabsContent value="income" className="p-4 mt-0">
              {renderCategoryList(incomeCategories, "income")}
            </TabsContent>
          </Tabs>
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
                Category Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value: CategoryType) => setFormData({ ...formData, type: value })}
                disabled={!!editingCategory}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
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
                className="mt-1"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
                className="mt-1"
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
