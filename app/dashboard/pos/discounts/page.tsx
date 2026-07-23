"use client";

import { PageLoading } from "@/components/shared/PageLoading";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Edit, Trash2, Tags, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/shared/DateInput";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashHeader } from "@/components/dashboard/dash-header";
import { EmptyState } from "@/components/shared/EmptyState";
import posApi, { type POSDiscount } from "@/lib/api/pos";
import { inventoryApi, type Category, type Product } from "@/lib/api/inventory";
import toast from "react-hot-toast";

type StatusFilter = "all" | "active" | "inactive";

export default function POSDiscountsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [discounts, setDiscounts] = useState<POSDiscount[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
    discount_type: "percentage" as "percentage" | "fixed",
    discount_value: "",
    apply_to: "bill" as "item" | "bill" | "category",
    min_quantity: "0",
    min_amount: "0",
    start_date: "",
    end_date: "",
    is_active: true,
    category: "",
    product: "",
  });

  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      const [discountData, categoriesRes, productsRes] = await Promise.all([
        posApi.getDiscounts(),
        inventoryApi.categories.list({ page_size: 500 }),
        inventoryApi.products.list({ page_size: 500, status: 'active' }),
      ]);
      setDiscounts(discountData);
      setCategories(categoriesRes.data.results || []);
      setProducts(productsRes.data.results || []);
    } catch (error: any) {
      toast.error("Failed to load discounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  useEffect(() => {
    if (searchParams.get("new") !== "1") return;
    setEditingId(null);
    setForm({
      name: "",
      code: "",
      description: "",
      discount_type: "percentage",
      discount_value: "",
      apply_to: "bill",
      min_quantity: "0",
      min_amount: "0",
      start_date: "",
      end_date: "",
      is_active: true,
      category: "",
      product: "",
    });
    setShowForm(true);
    router.replace("/dashboard/pos/discounts", { scroll: false });
  }, [searchParams, router]);

  const resetForm = () => {
    setForm({
      name: "",
      code: "",
      description: "",
      discount_type: "percentage",
      discount_value: "",
      apply_to: "bill",
      min_quantity: "0",
      min_amount: "0",
      start_date: "",
      end_date: "",
      is_active: true,
      category: "",
      product: "",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (discount: POSDiscount) => {
    setForm({
      name: discount.name,
      code: discount.code,
      description: discount.description || "",
      discount_type: discount.discount_type,
      discount_value: discount.discount_value.toString(),
      apply_to: discount.apply_to,
      min_quantity: discount.min_quantity.toString(),
      min_amount: discount.min_amount.toString(),
      start_date: discount.start_date || "",
      end_date: discount.end_date || "",
      is_active: discount.is_active,
      category: discount.category || "",
      product: discount.product || "",
    });
    setEditingId(discount.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name || !form.code || !form.discount_value) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (form.apply_to === "item" && !form.product) {
      toast.error("Select a product for item-level discounts");
      return;
    }
    if (form.apply_to === "category" && !form.category) {
      toast.error("Select a category for category discounts");
      return;
    }
    
    setSubmitting(true);
    try {
      const data: any = {
        name: form.name,
        code: form.code,
        description: form.description,
        discount_type: form.discount_type,
        discount_value: parseFloat(form.discount_value),
        apply_to: form.apply_to,
        min_quantity: parseFloat(form.min_quantity),
        min_amount: parseFloat(form.min_amount),
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        is_active: form.is_active,
        category: form.apply_to === "category" && form.category ? form.category : null,
        product: form.apply_to === "item" && form.product ? form.product : null,
      };
      
      if (editingId) {
        await posApi.updateDiscount(editingId, data);
        toast.success("Discount updated successfully");
      } else {
        await posApi.createDiscount(data);
        toast.success("Discount created successfully");
      }
      
      resetForm();
      fetchDiscounts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save discount");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    // Show custom confirmation toast
    toast((t) => (
      <div className="flex flex-col gap-4 min-w-[320px] p-2">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-red-100">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-base">Delete this discount?</p>
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
            onClick={() => {
              toast.dismiss(t.id);
              performDelete(id);
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
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

  const performDelete = async (id: string) => {
    try {
      await posApi.deleteDiscount(id);
      toast.success("Discount deleted successfully");
      fetchDiscounts();
    } catch (error: any) {
      toast.error("Failed to delete discount");
    }
  };

  const filteredDiscounts = discounts.filter((discount) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      discount.name?.toLowerCase().includes(q) ||
      discount.code?.toLowerCase().includes(q) ||
      discount.apply_to?.toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (statusFilter === "active") return discount.is_active;
    if (statusFilter === "inactive") return !discount.is_active;
    return true;
  });

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="POS Discounts" subtitle="Loading..." />
        <PageLoading message="Loading…" />
      </div>
    );
  }

  if (discounts.length === 0 && !showForm) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="POS Discounts" subtitle="Manage discount configurations" />
        <div className="flex-1 p-6">
          <EmptyState
            icon={Tags}
            title="No discounts yet"
            description="Create your first discount to offer promotions at the point of sale"
            actionLabel="Add Discount"
            onAction={() => setShowForm(true)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="POS Discounts" subtitle="Manage discount configurations" />

      <div className="flex-1 p-6 space-y-4">
        <div className="flex gap-3 items-center justify-between">
          <div className="flex gap-3 items-center flex-1 min-w-0">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-sm border-gray-200"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter((v as StatusFilter) || "all")}
            >
              <SelectTrigger className="w-[140px] h-9 border-gray-200 shrink-0">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {!showForm && (
            <Button
              size="sm"
              onClick={() => setShowForm(true)}
              className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5 shrink-0"
            >
              <Plus className="h-4 w-4" /> Add Discount
            </Button>
          )}
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold mb-4">
              {editingId ? "Edit Discount" : "Create New Discount"}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Name *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., Summer Sale"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label className="text-sm">Code *</Label>
                  <Input
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    placeholder="e.g., SUMMER20"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label className="text-sm">Discount Type *</Label>
                  <Select value={form.discount_type} onValueChange={(v: any) => setForm({ ...form, discount_type: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-sm">Discount Value *</Label>
                  <Input
                    type="number"
                    value={form.discount_value}
                    onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                    placeholder={form.discount_type === "percentage" ? "e.g., 20" : "e.g., 100"}
                    className="mt-1"
                    min={0}
                    step={0.01}
                  />
                </div>
                
                <div>
                  <Label className="text-sm">Apply To *</Label>
                  <Select value={form.apply_to} onValueChange={(v) => v && setForm({ ...form, apply_to: v, category: "", product: "" })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bill">Bill Level</SelectItem>
                      <SelectItem value="item">Item Level</SelectItem>
                      <SelectItem value="category">Category</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {form.apply_to === "item" && (
                  <div>
                    <Label className="text-sm">Product *</Label>
                    <Select value={form.product} onValueChange={(v) => setForm({ ...form, product: v ?? "" })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.name} ({p.sku})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {form.apply_to === "category" && (
                  <div>
                    <Label className="text-sm">Category *</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v ?? "" })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div>
                  <Label className="text-sm">Minimum Amount</Label>
                  <Input
                    type="number"
                    value={form.min_amount}
                    onChange={(e) => setForm({ ...form, min_amount: e.target.value })}
                    placeholder="0"
                    className="mt-1"
                    min={0}
                    step={0.01}
                  />
                </div>
                
                <div>
                  <Label className="text-sm">Start Date</Label>
                  <DateInput
                    
                    value={form.start_date}
                    onChange={(date) => setForm({ ...form, start_date: date})}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label className="text-sm">End Date</Label>
                  <DateInput
                    
                    value={form.end_date}
                    onChange={(date) => setForm({ ...form, end_date: date})}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div>
                <Label className="text-sm">Description</Label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full mt-1 text-sm border border-gray-200 rounded-lg p-2 resize-none focus:outline-none focus:border-[#22C55E]"
                  placeholder="Optional description..."
                />
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="is_active" className="text-sm cursor-pointer">
                  Active
                </Label>
              </div>
              
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={resetForm}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#22C55E] hover:bg-[#16A34A]"
                >
                  {submitting ? "Saving..." : (
                    editingId ? "Update Discount" : "Create Discount"
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* List */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Code</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Value</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Apply To</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDiscounts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                      No discounts found matching your filters
                    </td>
                  </tr>
                ) : (
                  filteredDiscounts.map((discount) => (
                    <tr key={discount.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-sm">{discount.name}</td>
                      <td className="px-4 py-3 text-sm font-mono">{discount.code}</td>
                      <td className="px-4 py-3 text-sm capitalize">{discount.discount_type}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-[#22C55E]">
                        {discount.discount_type === "percentage"
                          ? `${discount.discount_value}%`
                          : `Rs. ${discount.discount_value}`}
                      </td>
                      <td className="px-4 py-3 text-sm capitalize">{discount.apply_to}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          discount.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}>
                          {discount.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(discount)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(discount.id)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
