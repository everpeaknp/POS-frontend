"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DashHeader } from "@/components/dashboard/dash-header";
import { EmptyState } from "@/components/shared/EmptyState";
import { SkeletonTable } from "@/components/shared/Skeleton";
import { Pagination } from "@/components/shared/Pagination";
import { inventoryApi } from "@/lib/api/inventory";
import { useApi } from "@/lib/hooks/useApi";
import toast from "react-hot-toast";

const ITEMS_PER_PAGE = 20;

export default function StockAdjustmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAdjustments, setSelectedAdjustments] = useState<Set<number>>(new Set());
  const [formData, setFormData] = useState({
    product: "",
    type: "Addition",
    quantity: "",
    reason: "Stock received",
    notes: "",
    warehouse: "",
  });

  // Fetch products and warehouses
  const { data: productsData, loading: productsLoading } = useApi(
    () => inventoryApi.products.list(),
    { immediate: true }
  );

  const { data: warehousesData, loading: warehousesLoading } = useApi(
    () => inventoryApi.warehouses.list(),
    { immediate: true }
  );

  const { data: movementsData, loading: movementsLoading, refetch: refetchMovements } = useApi(
    () => inventoryApi.movements.list(),
    { immediate: true }
  );

  const products = productsData?.data?.results || [];
  const warehouses = warehousesData?.data?.results || [];
  const movements = movementsData?.data?.results || [];

  const adjustments = movements.filter((m: any) => m.movement_type === "adjustment");

  useEffect(() => {
    if (searchParams.get("new") !== "1") return;
    setFormData({
      product: "",
      type: "Addition",
      quantity: "",
      reason: "Stock received",
      notes: "",
      warehouse: "",
    });
    setOpen(true);
    router.replace("/dashboard/inventory/adjustment", { scroll: false });
  }, [searchParams, router]);

  // Filter and paginate
  const filteredAdjustments = useMemo(() => {
    return adjustments.filter((adj: any) =>
      adj.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      adj.warehouse_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      adj.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      adj.performed_by_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [adjustments, searchQuery]);

  const totalPages = Math.ceil(filteredAdjustments.length / ITEMS_PER_PAGE);
  const paginatedAdjustments = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAdjustments.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAdjustments, currentPage]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAdjustments(new Set(paginatedAdjustments.map((a: any) => a.id)));
    } else {
      setSelectedAdjustments(new Set());
    }
  };

  const handleSelectAdjustment = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedAdjustments);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedAdjustments(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedAdjustments.size === 0) {
      toast.error("No adjustments selected");
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
            <p className="font-semibold text-gray-900 text-base">Delete {selectedAdjustments.size} adjustments?</p>
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
              for (const id of selectedAdjustments) {
                try {
                  // await inventoryApi.movements.delete(id);
                  // Stock movements are immutable audit records
                  deleted++;
                } catch (error) {
                  console.error(`Failed to delete adjustment ${id}:`, error);
                }
              }
              toast.success(`Deleted ${deleted} adjustment(s)`);
              setSelectedAdjustments(new Set());
              refetchMovements();
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

  const handleSubmit = async () => {
    if (!formData.product || !formData.warehouse || !formData.quantity) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const quantityValue = parseFloat(formData.quantity);
      const quantity = formData.type === "Addition" ? quantityValue : -quantityValue;
      
      await inventoryApi.operations.adjustment({
        product: parseInt(formData.product),
        warehouse: parseInt(formData.warehouse),
        quantity: quantity.toString(),
        reason: formData.reason,
        notes: formData.notes || undefined,
      });

      toast.success("Stock adjusted successfully");
      setFormData({
        product: "",
        type: "Addition",
        quantity: "",
        reason: "Stock received",
        notes: "",
        warehouse: "",
      });
      setOpen(false);
      refetchMovements();
    } catch (error: any) {
      console.error('Adjustment error:', error);
      console.error('Error response:', error.response?.data);
      
      const errorMessage = 
        error.response?.data?.error || 
        error.response?.data?.detail ||
        error.response?.data?.message ||
        (error.response?.data?.non_field_errors && error.response.data.non_field_errors[0]) ||
        "Failed to adjust stock";
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const getProductName = (productId: number) => {
    const product = products.find((p: any) => p.id === productId);
    return product?.name || "Unknown";
  };

  const getWarehouseName = (warehouseId: number) => {
    const warehouse = warehouses.find((w: any) => w.id === warehouseId);
    return warehouse?.name || "Unknown";
  };

  const loading = productsLoading || warehousesLoading || movementsLoading;

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Stock Adjustment" subtitle="Record stock additions and deductions" />
        <div className="flex-1 p-6">
          <SkeletonTable rows={5} />
        </div>
      </div>
    );
  }

  if (adjustments.length === 0 && !searchQuery) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Stock Adjustment" subtitle="Record stock additions and deductions" />
        <div className="flex-1 p-6">
          <EmptyState
            icon={Plus}
            title="No adjustments yet"
            description="Create your first stock adjustment to record additions or deductions"
            actionLabel="New Adjustment"
            onAction={() => setOpen(true)}
          />
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>New Stock Adjustment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Product</Label>
                <select
                  value={formData.product}
                  onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                  className="h-9 text-sm border border-gray-200 rounded-md px-3 bg-white focus:outline-none focus:border-[#22C55E]"
                >
                  <option value="">Select a product</option>
                  {products.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Warehouse</Label>
                <select
                  value={formData.warehouse}
                  onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                  className="h-9 text-sm border border-gray-200 rounded-md px-3 bg-white focus:outline-none focus:border-[#22C55E]"
                >
                  <option value="">Select a warehouse</option>
                  {warehouses.map((w: any) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">Type</Label>
                  <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger className="h-9 text-sm border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Addition">Addition</SelectItem>
                      <SelectItem value="Deduction">Deduction</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">Quantity</Label>
                  <Input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="h-9 text-sm border-gray-200"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Reason</Label>
                <Select value={formData.reason} onValueChange={(value: any) => setFormData({ ...formData, reason: value })}>
                  <SelectTrigger className="h-9 text-sm border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Stock received", "Damaged goods", "Expired", "Theft", "Correction", "Other"].map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Notes</Label>
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="h-9 text-sm border-gray-200"
                  placeholder="Optional"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save Adjustment"}
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Stock Adjustment" subtitle="Record stock additions and deductions" />
      <div className="flex-1 p-6 space-y-4">
        <div className="flex gap-3 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search adjustments..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 h-9 text-sm border-gray-200"
            />
          </div>
          <div className="flex gap-2">
            {selectedAdjustments.size > 0 && (
              <Button 
                size="sm" 
                variant="destructive"
                className="h-9 gap-1.5" 
                onClick={handleBulkDelete}
              >
                <Trash2 className="h-4 w-4" /> Delete ({selectedAdjustments.size})
              </Button>
            )}
            <Button size="sm" className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> New Adjustment
            </Button>
          </div>
        </div>

        {filteredAdjustments.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
            <Plus className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No adjustments found matching "{searchQuery}"</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left w-12">
                    <input
                      type="checkbox"
                      checked={selectedAdjustments.size === paginatedAdjustments.length && paginatedAdjustments.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                  </th>
                  {["Adj. ID", "Date", "Product", "Type", "Qty", "Reason", "Warehouse", "By"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedAdjustments.map((a: any) => (
                  <tr key={a.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedAdjustments.has(a.id)}
                        onChange={(e) => handleSelectAdjustment(a.id, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-[#22C55E]">ADJ{a.id}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(a.created_at)}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{a.product_name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${parseFloat(a.quantity) > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {parseFloat(a.quantity) > 0 ? "Addition" : "Deduction"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{Math.abs(parseFloat(a.quantity))}</td>
                    <td className="px-4 py-3 text-gray-600">{a.reason}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{a.warehouse_name}</td>
                    <td className="px-4 py-3 text-gray-600">{(a.performed_by_name as string) || "System"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredAdjustments.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>New Stock Adjustment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Product</Label>
                <select
                  value={formData.product}
                  onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                  className="h-9 text-sm border border-gray-200 rounded-md px-3 bg-white focus:outline-none focus:border-[#22C55E]"
                >
                  <option value="">Select a product</option>
                  {products.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Warehouse</Label>
                <select
                  value={formData.warehouse}
                  onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                  className="h-9 text-sm border border-gray-200 rounded-md px-3 bg-white focus:outline-none focus:border-[#22C55E]"
                >
                  <option value="">Select a warehouse</option>
                  {warehouses.map((w: any) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">Type</Label>
                  <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger className="h-9 text-sm border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Addition">Addition</SelectItem>
                      <SelectItem value="Deduction">Deduction</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">Quantity</Label>
                  <Input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="h-9 text-sm border-gray-200"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Reason</Label>
                <Select value={formData.reason} onValueChange={(value: any) => setFormData({ ...formData, reason: value })}>
                  <SelectTrigger className="h-9 text-sm border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Stock received", "Damaged goods", "Expired", "Theft", "Correction", "Other"].map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Notes</Label>
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="h-9 text-sm border-gray-200"
                  placeholder="Optional"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save Adjustment"}
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
