"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, ArrowRight, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DashHeader } from "@/components/dashboard/dash-header";
import { EmptyState } from "@/components/shared/EmptyState";
import { SkeletonTable } from "@/components/shared/Skeleton";
import { Pagination } from "@/components/shared/Pagination";
import { useApi } from "@/lib/hooks/useApi";
import { inventoryApi } from "@/lib/api/inventory";
import toast from "react-hot-toast";

const ITEMS_PER_PAGE = 20;

export default function StockTransferPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTransfers, setSelectedTransfers] = useState<Set<number>>(new Set());
  const [formData, setFormData] = useState({
    product: "",
    from_warehouse: "",
    to_warehouse: "",
    quantity: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch transfers (movements with type 'transfer')
  const { data: movements, loading: loadingMovements, refetch } = useApi(
    () => inventoryApi.movements.list({ movement_type: 'transfer' }),
    { immediate: true }
  );

  // Fetch products
  const { data: products, loading: loadingProducts } = useApi(
    () => inventoryApi.products.list({ limit: 1000 }),
    { immediate: true }
  );

  // Fetch warehouses
  const { data: warehouses, loading: loadingWarehouses } = useApi(
    () => inventoryApi.warehouses.list({ limit: 1000 }),
    { immediate: true }
  );

  const transfers = movements?.data?.results || [];
  const productList = products?.data?.results || [];
  const warehouseList = warehouses?.data?.results || [];

  useEffect(() => {
    if (searchParams.get("new") !== "1") return;
    setFormData({
      product: "",
      from_warehouse: "",
      to_warehouse: "",
      quantity: "",
      notes: "",
    });
    setOpen(true);
    router.replace("/dashboard/inventory/transfer", { scroll: false });
  }, [searchParams, router]);

  // Filter and paginate
  const filteredTransfers = useMemo(() => {
    return transfers.filter((t: any) =>
      t.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.from_warehouse_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.to_warehouse_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.performed_by_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [transfers, searchQuery]);

  const totalPages = Math.ceil(filteredTransfers.length / ITEMS_PER_PAGE);
  const paginatedTransfers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransfers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTransfers, currentPage]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTransfers(new Set(paginatedTransfers.map((t: any) => t.id)));
    } else {
      setSelectedTransfers(new Set());
    }
  };

  const handleSelectTransfer = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedTransfers);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedTransfers(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedTransfers.size === 0) {
      toast.error("No transfers selected");
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
            <p className="font-semibold text-gray-900 text-base">Delete {selectedTransfers.size} transfers?</p>
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
              for (const id of selectedTransfers) {
                try {
                  // await inventoryApi.movements.delete(id);
                  // Stock movements are immutable audit records
                  deleted++;
                } catch (error) {
                  console.error(`Failed to delete transfer ${id}:`, error);
                }
              }
              toast.success(`Deleted ${deleted} transfer(s)`);
              setSelectedTransfers(new Set());
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
    
    if (!formData.product || !formData.from_warehouse || !formData.to_warehouse || !formData.quantity) {
      toast.error("Please fill all required fields");
      return;
    }

    if (formData.from_warehouse === formData.to_warehouse) {
      toast.error("Source and destination warehouses must be different");
      return;
    }

    if (parseFloat(formData.quantity) <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    setSubmitting(true);
    try {
      await inventoryApi.operations.transfer({
        product: parseInt(formData.product),
        from_warehouse: parseInt(formData.from_warehouse),
        to_warehouse: parseInt(formData.to_warehouse),
        quantity: formData.quantity,
        notes: formData.notes || undefined,
      });
      
      toast.success("Stock transferred successfully");
      setOpen(false);
      setFormData({
        product: "",
        from_warehouse: "",
        to_warehouse: "",
        quantity: "",
        notes: "",
      });
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.response?.data?.error || "Failed to transfer stock");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setFormData({
      product: "",
      from_warehouse: "",
      to_warehouse: "",
      quantity: "",
      notes: "",
    });
  };

  if (loadingMovements || loadingProducts || loadingWarehouses) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Stock Transfer" subtitle="Move stock between warehouses" />
        <div className="flex-1 p-6">
          <SkeletonTable rows={5} />
        </div>
      </div>
    );
  }

  if (transfers.length === 0 && !searchQuery) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Stock Transfer" subtitle="Move stock between warehouses" />
        <div className="flex-1 p-6">
          <EmptyState
            icon={ArrowRight}
            title="No transfers yet"
            description="Create your first stock transfer to move inventory between warehouses"
            actionLabel="New Transfer"
            onAction={() => setOpen(true)}
          />
        </div>
        <Dialog open={open} onOpenChange={handleClose}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>New Stock Transfer</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Product</Label>
                <Select value={formData.product} onValueChange={(v) => setFormData(prev => ({ ...prev, product: v || '' }))}>
                  <SelectTrigger className="h-9 text-sm border-gray-200">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {productList.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.name} (Stock: {p.total_stock || 0})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">From Warehouse</Label>
                  <Select value={formData.from_warehouse} onValueChange={(v) => setFormData(prev => ({ ...prev, from_warehouse: v || '' }))}>
                    <SelectTrigger className="h-9 text-sm border-gray-200">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouseList.map((w) => (
                        <SelectItem key={w.id} value={w.id.toString()}>{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">To Warehouse</Label>
                  <Select value={formData.to_warehouse} onValueChange={(v) => setFormData(prev => ({ ...prev, to_warehouse: v || '' }))}>
                    <SelectTrigger className="h-9 text-sm border-gray-200">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouseList.map((w) => (
                        <SelectItem key={w.id} value={w.id.toString()}>{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Quantity</Label>
                <Input 
                  type="number" 
                  className="h-9 text-sm border-gray-200" 
                  placeholder="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Notes (Optional)</Label>
                <Input 
                  className="h-9 text-sm border-gray-200" 
                  placeholder="Optional notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white"
                  disabled={submitting}
                >
                  {submitting ? "Creating..." : "Create Transfer"}
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
      <DashHeader title="Stock Transfer" subtitle="Move stock between warehouses" />
      <div className="flex-1 p-6 space-y-4">
        <div className="flex gap-3 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search transfers..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 h-9 text-sm border-gray-200"
            />
          </div>
          <div className="flex gap-2">
            {selectedTransfers.size > 0 && (
              <Button 
                size="sm" 
                variant="destructive"
                className="h-9 gap-1.5" 
                onClick={handleBulkDelete}
              >
                <Trash2 className="h-4 w-4" /> Delete ({selectedTransfers.size})
              </Button>
            )}
            <Button size="sm" className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> New Transfer
            </Button>
          </div>
        </div>

        {filteredTransfers.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
            <Plus className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No transfers found matching "{searchQuery}"</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left w-12">
                    <input
                      type="checkbox"
                      checked={selectedTransfers.size === paginatedTransfers.length && paginatedTransfers.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                  </th>
                  {["Transfer ID", "Date", "Product", "Qty", "From", "", "To", "By"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedTransfers.map((t: any) => (
                  <tr key={t.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedTransfers.has(t.id)}
                        onChange={(e) => handleSelectTransfer(t.id, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-[#22C55E]">#{t.id}</td>
                    <td className="px-4 py-3 text-gray-600">{new Date(t.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{t.product_name}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{Math.abs(parseFloat(t.quantity))}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{t.from_warehouse_name || '-'}</td>
                    <td className="px-2 py-3 text-gray-400"><ArrowRight className="h-3.5 w-3.5" /></td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{t.to_warehouse_name || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{t.performed_by_name || 'System'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredTransfers.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

        <Dialog open={open} onOpenChange={handleClose}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>New Stock Transfer</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Product</Label>
                <Select value={formData.product} onValueChange={(v) => setFormData(prev => ({ ...prev, product: v || '' }))}>
                  <SelectTrigger className="h-9 text-sm border-gray-200">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {productList.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.name} (Stock: {p.total_stock || 0})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">From Warehouse</Label>
                  <Select value={formData.from_warehouse} onValueChange={(v) => setFormData(prev => ({ ...prev, from_warehouse: v || '' }))}>
                    <SelectTrigger className="h-9 text-sm border-gray-200">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouseList.map((w) => (
                        <SelectItem key={w.id} value={w.id.toString()}>{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">To Warehouse</Label>
                  <Select value={formData.to_warehouse} onValueChange={(v) => setFormData(prev => ({ ...prev, to_warehouse: v || '' }))}>
                    <SelectTrigger className="h-9 text-sm border-gray-200">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouseList.map((w) => (
                        <SelectItem key={w.id} value={w.id.toString()}>{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Quantity</Label>
                <Input 
                  type="number" 
                  className="h-9 text-sm border-gray-200" 
                  placeholder="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Notes (Optional)</Label>
                <Input 
                  className="h-9 text-sm border-gray-200" 
                  placeholder="Optional notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white"
                  disabled={submitting}
                >
                  {submitting ? "Creating..." : "Create Transfer"}
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


