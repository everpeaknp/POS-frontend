"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search } from "lucide-react";
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
    () => inventoryApi.products.list({ page_size: 500, status: 'active' }),
    { immediate: true }
  );

  const { data: warehousesData, loading: warehousesLoading } = useApi(
    () => inventoryApi.warehouses.list({ page_size: 500, is_active: true }),
    { immediate: true }
  );

  const { data: movementsData, loading: movementsLoading, refetch: refetchMovements } = useApi(
    () => inventoryApi.movements.list({ page_size: 500 }),
    { immediate: true }
  );

  const products = productsData?.data?.results || [];
  const warehouses = warehousesData?.data?.results || [];
  const movements = movementsData?.data?.results || [];

  const adjustments = movements.filter(
    (m: { movement_type: string; reference_type?: string }) =>
      m.movement_type === 'adjustment' || m.reference_type === 'Adjustment'
  );

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
                  {["Adj. ID", "Date", "Product", "Type", "Qty", "Reason", "Warehouse", "By"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedAdjustments.map((a: any) => {
                  const qty = parseFloat(a.quantity);
                  const isAddition =
                    a.movement_type === 'adjustment' ? qty > 0 : a.movement_type === 'in';
                  const displayQty =
                    a.movement_type === 'adjustment' ? Math.abs(qty) : Math.abs(qty);

                  return (
                  <tr key={a.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-[#22C55E]">ADJ{a.id}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(a.created_at)}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{a.product_name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isAddition ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {isAddition ? "Addition" : "Deduction"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{displayQty}</td>
                    <td className="px-4 py-3 text-gray-600">{a.reason}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{a.warehouse_name}</td>
                    <td className="px-4 py-3 text-gray-600">{(a.performed_by_name as string) || "System"}</td>
                  </tr>
                  );
                })}
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
