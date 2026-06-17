"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashHeader } from "@/components/dashboard/dash-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import apiClient from "@/lib/api/client";
import toast from "react-hot-toast";

interface PriceTier {
  min_quantity: string;
  max_quantity: string;
  unit_price: string;
  discount_percent: string;
}

export default function NewBulkPricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState("");
  
  const [tiers, setTiers] = useState<PriceTier[]>([
    { min_quantity: "1", max_quantity: "10", unit_price: "", discount_percent: "0" },
  ]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await apiClient.get("/inventory/products/");
      setProducts(response.data.results || []);
    } catch (error) {
      toast.error("Failed to load products");
    } finally {
      setLoadingProducts(false);
    }
  };

  const addTier = () => {
    const lastTier = tiers[tiers.length - 1];
    const nextMin = lastTier.max_quantity ? (parseFloat(lastTier.max_quantity) + 1).toString() : "1";
    
    setTiers([
      ...tiers,
      { min_quantity: nextMin, max_quantity: "", unit_price: "", discount_percent: "0" }
    ]);
  };

  const removeTier = (index: number) => {
    if (tiers.length === 1) {
      toast.error("At least one tier is required");
      return;
    }
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const updateTier = (index: number, field: keyof PriceTier, value: string) => {
    const newTiers = [...tiers];
    newTiers[index][field] = value;
    setTiers(newTiers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProduct) {
      toast.error("Please select a product");
      return;
    }

    // Validate tiers
    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      
      if (!tier.min_quantity || parseFloat(tier.min_quantity) <= 0) {
        toast.error(`Tier ${i + 1}: Minimum quantity is required`);
        return;
      }
      
      if (!tier.unit_price || parseFloat(tier.unit_price) <= 0) {
        toast.error(`Tier ${i + 1}: Unit price is required`);
        return;
      }
      
      if (tier.max_quantity && parseFloat(tier.max_quantity) < parseFloat(tier.min_quantity)) {
        toast.error(`Tier ${i + 1}: Maximum quantity must be greater than minimum`);
        return;
      }
    }

    try {
      setLoading(true);
      toast.loading("Creating bulk pricing tiers...");

      // Create each tier
      for (const tier of tiers) {
        await apiClient.post("/inventory/bulk-pricing/", {
          product: selectedProduct,
          min_quantity: parseFloat(tier.min_quantity),
          max_quantity: tier.max_quantity ? parseFloat(tier.max_quantity) : null,
          unit_price: parseFloat(tier.unit_price),
          discount_percent: parseFloat(tier.discount_percent),
          is_active: true,
        });
      }

      toast.dismiss();
      toast.success("Bulk pricing tiers created successfully");
      router.push("/dashboard/inventory/bulk-pricing");
    } catch (error: any) {
      toast.dismiss();
      const errorMsg = error.response?.data?.min_quantity?.[0] || 
                       error.response?.data?.max_quantity?.[0] ||
                       error.response?.data?.detail || 
                       "Failed to create bulk pricing";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const product = products.find(p => p.id === selectedProduct);

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader title="Add Bulk Pricing" subtitle="Create tiered pricing for products" />
      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 space-y-6 w-full">
          
          <div>
            <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Product</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <div className="sm:col-span-2 lg:col-span-2 xl:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Product <span className="text-red-500">*</span>
              </label>
              <Select
                value={selectedProduct}
                onValueChange={(v) => setSelectedProduct(v || '')}
                disabled={loadingProducts}
              >
                <SelectTrigger className="h-10 border-gray-200">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {product && (
                <p className="text-xs text-gray-500 mt-1">
                  Base Price: Rs {product.selling_price}
                </p>
              )}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
              <h3 className="text-sm font-semibold text-gray-700">
                Pricing Tiers <span className="text-red-500">*</span>
              </h3>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addTier}
                  className="h-8 gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Tier
                </Button>
              </div>

              <div className="space-y-3">
                {tiers.map((tier, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-700">Tier {index + 1}</h4>
                      {tiers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTier(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Min Quantity
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={tier.min_quantity}
                          onChange={(e) => updateTier(index, 'min_quantity', e.target.value)}
                          className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Max Quantity
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={tier.max_quantity}
                          onChange={(e) => updateTier(index, 'max_quantity', e.target.value)}
                          className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent"
                          placeholder="Unlimited"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Unit Price (Rs)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={tier.unit_price}
                          onChange={(e) => updateTier(index, 'unit_price', e.target.value)}
                          className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Discount %
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={tier.discount_percent}
                          onChange={(e) => updateTier(index, 'discount_percent', e.target.value)}
                          className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent"
                        />
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 mt-2">
                      {tier.min_quantity && tier.max_quantity 
                        ? `${tier.min_quantity} - ${tier.max_quantity} units`
                        : tier.min_quantity
                        ? `${tier.min_quantity}+ units`
                        : 'Set quantity range'
                      }
                      {tier.unit_price && ` @ Rs ${tier.unit_price} per unit`}
                    </p>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-500 mt-2">
                💡 Tip: Leave max quantity empty for unlimited (e.g., "51+ units")
              </p>
            </div>

          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              className="gap-1.5 text-gray-500"
              disabled={loading}
            >
              <ArrowLeft className="h-4 w-4" /> Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5"
            >
              <Save className="h-4 w-4" /> Create Pricing Tiers
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
