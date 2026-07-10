"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateInput } from "@/components/shared/DateInput";
import { FormattedDate } from "@/components/shared/FormattedDate";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SkeletonTable } from "@/components/shared/Skeleton";
import { inventoryApi, type CustomerSpecificPrice, type Product } from "@/lib/api/inventory";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";

interface CustomerPricingPanelProps {
  customerId: string;
}

export function CustomerPricingPanel({ customerId }: CustomerPricingPanelProps) {
  const [prices, setPrices] = useState<CustomerSpecificPrice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    product: "",
    unit_price: "",
    min_quantity: "1",
    valid_from: new Date().toISOString().split("T")[0],
    valid_until: "",
    notes: "",
  });

  const loadPrices = async () => {
    try {
      setLoading(true);
      const response = await inventoryApi.customerPrices.byCustomer(customerId);
      setPrices(Array.isArray(response.data) ? response.data : []);
    } catch {
      toast.error("Failed to load customer pricing");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrices();
    inventoryApi.products
      .list({ status: "active" })
      .then((res) => setProducts(res.data.results || []))
      .catch(() => {});
  }, [customerId]);

  const handleCreate = async () => {
    if (!form.product || !form.unit_price) {
      toast.error("Product and price are required");
      return;
    }

    setSubmitting(true);
    try {
      await inventoryApi.customerPrices.create({
        customer: Number(customerId),
        product: Number(form.product),
        unit_price: Number(form.unit_price),
        min_quantity: Number(form.min_quantity) || 1,
        valid_from: form.valid_from,
        valid_until: form.valid_until || null,
        is_active: true,
        notes: form.notes || undefined,
      });
      toast.success("Special price added");
      setDialogOpen(false);
      setForm({
        product: "",
        unit_price: "",
        min_quantity: "1",
        valid_from: new Date().toISOString().split("T")[0],
        valid_until: "",
        notes: "",
      });
      loadPrices();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to add special price");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remove this special price?")) return;
    try {
      await inventoryApi.customerPrices.delete(id);
      toast.success("Special price removed");
      loadPrices();
    } catch {
      toast.error("Failed to remove special price");
    }
  };

  if (loading) {
    return <SkeletonTable rows={3} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Negotiated rates for this customer override standard and bulk pricing.
        </p>
        <Button size="sm" className="h-8 gap-1.5 bg-[#22C55E] hover:bg-[#16A34A] text-white" onClick={() => setDialogOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> Add Price
        </Button>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {["Product", "SKU", "Unit Price", "Min Qty", "Valid From", "Valid Until", ""].map((h) => (
              <th key={h || "actions"} className="text-left text-xs text-gray-400 font-medium pb-2 px-2">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {prices.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-6 text-center text-sm text-gray-400">
                No special prices configured
              </td>
            </tr>
          ) : (
            prices.map((price) => (
              <tr key={price.id} className="hover:bg-gray-50/50">
                <td className="px-2 py-2.5 font-medium text-gray-800">{price.product_name}</td>
                <td className="px-2 py-2.5 text-gray-500 font-mono text-xs">{price.product_sku}</td>
                <td className="px-2 py-2.5 font-medium">{formatCurrency(price.unit_price)}</td>
                <td className="px-2 py-2.5 text-gray-600">{Number(price.min_quantity)}</td>
                <td className="px-2 py-2.5 text-gray-600">
                  <FormattedDate value={price.valid_from} />
                </td>
                <td className="px-2 py-2.5 text-gray-600">
                  {price.valid_until ? <FormattedDate value={price.valid_until} /> : "—"}
                </td>
                <td className="px-2 py-2.5 text-right">
                  <button
                    onClick={() => handleDelete(price.id)}
                    className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Special Price</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Product</Label>
              <Select value={form.product} onValueChange={(v) => setForm({ ...form, product: v || "" })}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name} ({p.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Unit Price (Rs.)</Label>
                <Input
                  type="number"
                  value={form.unit_price}
                  onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
                  className="h-9"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Min Quantity</Label>
                <Input
                  type="number"
                  value={form.min_quantity}
                  onChange={(e) => setForm({ ...form, min_quantity: e.target.value })}
                  className="h-9"
                  min={1}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Valid From</Label>
                <DateInput
                  value={form.valid_from}
                  onChange={(date) => setForm({ ...form, valid_from: date })}
                  className="h-9"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Valid Until</Label>
                <DateInput
                  value={form.valid_until}
                  onChange={(date) => setForm({ ...form, valid_until: date })}
                  className="h-9"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Notes</Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="h-9"
                placeholder="Optional reason"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                onClick={handleCreate}
                disabled={submitting}
                className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white"
              >
                Save
              </Button>
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1" disabled={submitting}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
