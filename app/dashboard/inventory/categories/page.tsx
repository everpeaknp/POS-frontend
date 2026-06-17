"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Edit, Trash2, Package, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DashHeader } from "@/components/dashboard/dash-header";
import { EmptyState } from "@/components/shared/EmptyState";
import { SkeletonCard } from "@/components/shared/Skeleton";
import { Pagination } from "@/components/shared/Pagination";
import { useApi } from "@/lib/hooks/useApi";
import { inventoryApi } from "@/lib/api/inventory";
import toast from "react-hot-toast";

const ITEMS_PER_PAGE = 20;

export default function CategoriesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", description: "", parent: "" });
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState<Set<number>>(new Set());

  const { data: categories, loading, refetch } = useApi(
    () => inventoryApi.categories.list(),
    { immediate: true }
  );

  useEffect(() => {
    if (searchParams.get("new") !== "1") return;
    setEditingCategory(null);
    setFormData({ name: "", description: "", parent: "" });
    setOpen(true);
    router.replace("/dashboard/inventory/categories", { scroll: false });
  }, [searchParams, router]);

  const categoryList = categories?.data?.results || [];

  // Filter and paginate
  const filteredCategories = useMemo(() => {
    return categoryList.filter((cat: any) =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.parent_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [categoryList, searchQuery]);

  const totalPages = Math.ceil(filteredCategories.length / ITEMS_PER_PAGE);
  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCategories.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCategories, currentPage]);

  // Reset to page 1 when search changes
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCategories(new Set(paginatedCategories.map((c: any) => c.id)));
    } else {
      setSelectedCategories(new Set());
    }
  };

  const handleSelectCategory = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedCategories);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedCategories(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedCategories.size === 0) {
      toast.error("No categories selected");
      return;
    }

    toast((t) => (
      <div className="flex flex-col gap-4 min-w-[320px] p-2">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-base">Delete {selectedCategories.size} categories?</p>
            <p className="text-sm text-gray-600 mt-1">This action cannot be undone.</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              let deleted = 0;
              for (const id of selectedCategories) {
                try {
                  await inventoryApi.categories.delete(id);
                  deleted++;
                } catch (error) {
                  console.error(`Failed to delete category ${id}:`, error);
                }
              }
              toast.success(`Deleted ${deleted} category(ies)`);
              setSelectedCategories(new Set());
              refetch();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    ), {
      duration: Infinity,
      position: 'top-center',
      style: {
        marginTop: '40vh',
        background: 'white',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        borderRadius: '12px',
        padding: '16px',
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    setSubmitting(true);
    try {
      const submitData: any = {
        name: formData.name,
        description: formData.description
      };
      
      // Only include parent if it's not empty
      if (formData.parent) {
        submitData.parent = parseInt(formData.parent);
      }

      if (editingCategory) {
        await inventoryApi.categories.update(editingCategory.id, submitData);
        toast.success("Category updated successfully");
      } else {
        await inventoryApi.categories.create(submitData);
        toast.success("Category created successfully");
      }
      setOpen(false);
      setFormData({ name: "", description: "", parent: "" });
      setEditingCategory(null);
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save category");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setFormData({ 
      name: category.name, 
      description: category.description || "",
      parent: category.parent || ""
    });
    setOpen(true);
  };

  const handleDelete = async (id: number, categoryName: string) => {
    // Show custom confirmation toast in center of screen
    const confirmDelete = () => {
      toast.promise(
        inventoryApi.categories.delete(id),
        {
          loading: 'Deleting category...',
          success: () => {
            refetch();
            return 'Category deleted successfully';
          },
          error: (err) => err.response?.data?.message || 'Failed to delete category'
        }
      );
    };

    // Show custom confirmation toast in center of screen
    toast((t) => (
      <div className="flex flex-col gap-4 min-w-[320px] p-2">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-base">Delete this category?</p>
            <p className="text-sm text-gray-600 mt-1">"{categoryName}" will be permanently deleted. This action cannot be undone.</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              confirmDelete();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    ), {
      duration: Infinity,
      position: 'top-center',
      style: {
        marginTop: '40vh',
        background: 'white',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        borderRadius: '12px',
        padding: '16px',
      },
    });
  };

  const handleClose = () => {
    setOpen(false);
    setEditingCategory(null);
    setFormData({ name: "", description: "", parent: "" });
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Product Categories" subtitle="Organize your products" />
        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  if (filteredCategories.length === 0 && !searchQuery) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Product Categories" subtitle="Organize your products" />
        <div className="flex-1 p-6">
          <EmptyState
            icon={Package}
            title="No categories yet"
            description="Create your first product category to organize your inventory"
            actionLabel="Add Category"
            onAction={() => setOpen(true)}
          />
        </div>
        <Dialog open={open} onOpenChange={handleClose}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Add Category</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Category Name</Label>
                <Input 
                  className="h-9 text-sm border-gray-200" 
                  placeholder="e.g. Building Materials" 
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Parent Category</Label>
                <select
                  value={formData.parent}
                  onChange={(e) => setFormData(prev => ({ ...prev, parent: e.target.value }))}
                  className="h-9 text-sm border border-gray-200 rounded-md px-3 bg-white focus:outline-none focus:border-[#22C55E]"
                >
                  <option value="">None (Root Category)</option>
                  {categoryList.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.parent_name ? `${cat.parent_name} > ${cat.name}` : cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Description</Label>
                <Input 
                  className="h-9 text-sm border-gray-200" 
                  placeholder="Optional" 
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white"
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : "Save"}
                </Button>
                <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>Cancel</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Product Categories" subtitle={`${filteredCategories.length} categories`} />
      <div className="flex-1 p-6 space-y-4">
        <div className="flex gap-3 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 h-9 text-sm border-gray-200"
            />
          </div>
          <div className="flex gap-2">
            {selectedCategories.size > 0 && (
              <Button 
                size="sm" 
                variant="destructive"
                className="h-9 gap-1.5" 
                onClick={handleBulkDelete}
              >
                <Trash2 className="h-4 w-4" /> Delete ({selectedCategories.size})
              </Button>
            )}
            <Button size="sm" className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Add Category
            </Button>
          </div>
        </div>

        {filteredCategories.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No categories found matching "{searchQuery}"</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left w-12">
                    <input
                      type="checkbox"
                      checked={selectedCategories.size === paginatedCategories.length && paginatedCategories.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                  </th>
                  {["Category Name", "Description", "Parent", "Subcategories", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedCategories.map((c: any) => (
                  <tr key={c.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedCategories.has(c.id)}
                        onChange={(e) => handleSelectCategory(c.id, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{c.name}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{c.description || "-"}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{c.parent_name || "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{c.children_count || 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button 
                          onClick={() => handleEdit(c)}
                          className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(c.id, c.name)}
                          className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredCategories.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

        <Dialog open={open} onOpenChange={handleClose}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Category Name</Label>
                <Input 
                  className="h-9 text-sm border-gray-200" 
                  placeholder="e.g. Building Materials" 
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Parent Category</Label>
                <select
                  value={formData.parent}
                  onChange={(e) => setFormData(prev => ({ ...prev, parent: e.target.value }))}
                  className="h-9 text-sm border border-gray-200 rounded-md px-3 bg-white focus:outline-none focus:border-[#22C55E]"
                >
                  <option value="">None (Root Category)</option>
                  {categoryList
                    .filter((cat: any) => !editingCategory || cat.id !== editingCategory.id)
                    .map((cat: any) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.parent_name ? `${cat.parent_name} > ${cat.name}` : cat.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Description</Label>
                <Input 
                  className="h-9 text-sm border-gray-200" 
                  placeholder="Optional" 
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              {editingCategory && editingCategory.children_count > 0 && (
                <div className="flex flex-col gap-1.5 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <Label className="text-sm text-blue-900 font-medium">Subcategories</Label>
                  <p className="text-xs text-blue-700">
                    This category has {editingCategory.children_count} subcategory(ies). 
                    Changing the parent will affect the hierarchy.
                  </p>
                </div>
              )}
              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white"
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : "Save"}
                </Button>
                <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>Cancel</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
