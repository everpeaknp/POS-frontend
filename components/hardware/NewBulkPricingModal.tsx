"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { inventoryApi, type Product } from "@/lib/api/inventory";
import { Loader2, Save } from "lucide-react";
import toast from "react-hot-toast";

const fieldClass =
  "w-full h-10 px-3 text-sm border border-gray-200 dark:border-border rounded-lg bg-white dark:bg-card focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent";

const emptyForm = {
  product: "",
  min_quantity: "",
  max_quantity: "",
  unit_price: "",
  discount_percentage: "",
};

interface NewBulkPricingModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function NewBulkPricingModal({ open, onClose, onSuccess }: NewBulkPricingModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    if (!open) return;
    setFormData(emptyForm);
    fetchProducts();
  }, [open]);

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await inventoryApi.products.list();
      const data = response.data;
      setProducts(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.product || !formData.min_quantity || !formData.unit_price) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      await inventoryApi.bulkPricing.create({
        product: parseInt(formData.product, 10),
        min_quantity: parseInt(formData.min_quantity, 10),
        max_quantity: formData.max_quantity ? parseInt(formData.max_quantity, 10) : null,
        unit_price: parseFloat(formData.unit_price),
        discount_percent: formData.discount_percentage
          ? parseFloat(formData.discount_percentage)
          : 0,
      });
      toast.success("Bulk pricing rule created");
      onClose();
      onSuccess?.();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || "Failed to create pricing rule");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Bulk Pricing Rule</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1.5">
              Product <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.product}
              onChange={(e) => setFormData({ ...formData, product: e.target.value })}
              className={fieldClass}
              required
              disabled={loadingProducts}
            >
              <option value="">{loadingProducts ? "Loading products..." : "Select a product"}</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.sku})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1.5">
                Min Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={formData.min_quantity}
                onChange={(e) => setFormData({ ...formData, min_quantity: e.target.value })}
                className={fieldClass}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1.5">
                Max Quantity
              </label>
              <input
                type="number"
                value={formData.max_quantity}
                onChange={(e) => setFormData({ ...formData, max_quantity: e.target.value })}
                className={fieldClass}
                placeholder="Unlimited"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1.5">
                Unit Price (NPR) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                className={fieldClass}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1.5">
                Discount %
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.discount_percentage}
                onChange={(e) =>
                  setFormData({ ...formData, discount_percentage: e.target.value })
                }
                className={fieldClass}
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {loading ? "Creating..." : "Create Rule"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
