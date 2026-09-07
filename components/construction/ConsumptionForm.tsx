"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Package, AlertCircle, Plus, Trash2 } from "lucide-react";
import FormField from "@/components/shared/FormField";
import { SkeletonTable } from "@/components/shared/Skeleton";
import { materialConsumptionAPI } from "@/lib/api/construction";
import { formatNPR } from "@/lib/utils";
import apiClient from "@/lib/api/client";

const consumptionSchema = z.object({
  site: z.string().min(1, "Site is required"),
  notes: z.string().optional().or(z.literal("")),
});

type ConsumptionFormData = z.infer<typeof consumptionSchema>;

interface ConsumptionItem {
  id: string;
  product: string;
  productName: string;
  unitName: string;
  quantity: string;
  unit_cost: string;
  availableStock: number | null;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  unit_name: string;
  cost_price: string;
}

interface Site {
  id: string;
  name: string;
  location: string;
  warehouse: string;
  warehouse_name: string;
}

interface ConsumptionFormProps {
  siteId?: string;
  dailyLogId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const inputClass =
  "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-custom,#22C55E)] disabled:bg-gray-100";

export default function ConsumptionForm({
  siteId,
  dailyLogId,
  onSuccess,
  onCancel,
}: ConsumptionFormProps) {
  const router = useRouter();
  const [sites, setSites] = useState<Site[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [items, setItems] = useState<ConsumptionItem[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<ConsumptionFormData>({
    resolver: zodResolver(consumptionSchema),
    defaultValues: {
      site: siteId || "",
      notes: "",
    },
  });

  const watchedSite = watch("site");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch sites
        const sitesRes = await apiClient.get("/construction/sites/");
        setSites(sitesRes.data.results || sitesRes.data || []);
        
        // Try to fetch products, but don't fail if inventory module is not available
        try {
          const productsRes = await apiClient.get("/inventory/products/");
          setProducts(productsRes.data.results || productsRes.data || []);
        } catch (productError: any) {
          console.warn("Inventory products not available (module may not be enabled):", productError);
          // Continue without products - user can enter product details manually
          setProducts([]);
        }
      } catch (error: unknown) {
        console.error("Failed to load form data:", error);
        toast.error("Failed to load sites. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (watchedSite) {
      const site = sites.find((s) => s.id === watchedSite);
      setSelectedSite(site || null);
    } else {
      setSelectedSite(null);
    }
  }, [watchedSite, sites]);

  const addItem = () => {
    const newItem: ConsumptionItem = {
      id: Date.now().toString(),
      product: "",
      productName: "",
      unitName: "",
      quantity: "",
      unit_cost: "",
      availableStock: null,
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = async (id: string, field: keyof ConsumptionItem, value: string) => {
    const updatedItems = items.map((item) => {
      if (item.id !== id) return item;

      const updated = { ...item, [field]: value };

      // If product changed, update product details and fetch stock
      if (field === "product" && value) {
        const product = products.find((p) => p.id.toString() === value);
        if (product) {
          updated.productName = product.name;
          updated.unitName = product.unit_name;
          // Try cost_price first, fallback to other possible field names
          updated.unit_cost = product.cost_price || "0";

          // Fetch stock for this product
          if (watchedSite && selectedSite?.warehouse) {
            fetchStockForItem(id, value, selectedSite.warehouse);
          }
        }
      }

      return updated;
    });

    setItems(updatedItems);
  };

  const fetchStockForItem = async (itemId: string, productId: string, warehouseId: string) => {
    try {
      const response = await apiClient.get("/inventory/stocks/", {
        params: {
          product: productId,
          warehouse: warehouseId,
        },
      });

      const stocks = response.data.results || response.data || [];
      const availableStock = stocks.length > 0 ? Number(stocks[0].quantity) : 0;

      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId ? { ...item, availableStock } : item
        )
      );
    } catch (error) {
      console.warn("Failed to fetch stock:", error);
    }
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const cost = parseFloat(item.unit_cost) || 0;
      return sum + qty * cost;
    }, 0);
  };

  const onSubmit = async (data: ConsumptionFormData) => {
    if (items.length === 0) {
      toast.error("Please add at least one product");
      return;
    }

    // Validate all items
    for (const item of items) {
      if (!item.product) {
        toast.error("Please select a product for all items");
        return;
      }
      if (!item.quantity || parseFloat(item.quantity) <= 0) {
        toast.error(`Please enter valid quantity for ${item.productName}`);
        return;
      }
      if (!item.unit_cost || parseFloat(item.unit_cost) < 0) {
        toast.error(`Please enter valid unit cost for ${item.productName}`);
        return;
      }
      if (item.availableStock !== null && parseFloat(item.quantity) > item.availableStock) {
        toast.error(`Insufficient stock for ${item.productName}! Available: ${item.availableStock.toFixed(2)}`);
        return;
      }
    }

    try {
      // Create multiple consumption records
      const promises = items.map((item) => {
        const payload = {
          site: data.site,
          product: item.product,
          quantity: parseFloat(item.quantity),
          unit_cost: parseFloat(item.unit_cost),
          notes: data.notes || "",
          daily_log: dailyLogId,
        };

        return materialConsumptionAPI.create(
          payload as Parameters<typeof materialConsumptionAPI.create>[0]
        );
      });

      await Promise.all(promises);

      toast.success(`${items.length} material consumption(s) logged successfully! Stock updated.`);

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/dashboard/construction/sites/${data.site}`);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: Record<string, unknown> } };
      const message =
        (err.response?.data?.detail as string) ||
        (err.response?.data?.message as string) ||
        "Operation failed. Please try again.";
      toast.error(message);
    }
  };

  if (loading) {
    return <SkeletonTable rows={5} />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">
          Basic Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Construction Site"
            name="site"
            error={errors.site}
            required
            hint="Select the site where materials will be consumed"
          >
            <select {...register("site")} id="site" disabled={!!siteId} className={inputClass}>
              <option value="">Select site</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name} - {site.location}
                </option>
              ))}
            </select>
          </FormField>

          {selectedSite && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Package className="w-4 h-4 text-[var(--color-accent-custom,#22C55E)] mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-900">
                    Warehouse: {selectedSite.warehouse_name}
                  </p>
                  <p className="text-xs text-green-700 mt-0.5">
                    Stock will be deducted from this warehouse
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {watchedSite && (
        <>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 flex-1">
                Products / Materials
              </h3>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-500 mb-4">No products added yet</p>
                <button
                  type="button"
                  onClick={addItem}
                  className="px-4 py-2 bg-[var(--color-accent-custom,#22C55E)] text-white rounded-md hover:bg-[var(--color-accent-custom-600,#16A34A)] transition-colors inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Product
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => {
                  const itemTotal =
                    (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_cost) || 0);
                  const hasLowStock =
                    item.availableStock !== null &&
                    parseFloat(item.quantity || "0") > item.availableStock;

                  return (
                    <div
                      key={item.id}
                      className={`border rounded-lg p-4 ${
                        hasLowStock ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                          <div className="lg:col-span-2">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Product <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={item.product}
                              onChange={(e) => updateItem(item.id, "product", e.target.value)}
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-custom,#22C55E)]"
                            >
                              <option value="">Select product</option>
                              {products.map((product) => (
                                <option key={product.id} value={product.id}>
                                  {product.name} ({product.sku})
                                </option>
                              ))}
                            </select>
                            {item.availableStock !== null && (
                              <p className={`text-xs mt-1 ${hasLowStock ? "text-red-600 font-medium" : "text-gray-500"}`}>
                                Stock: {item.availableStock.toFixed(2)} {item.unitName}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Quantity <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
                              placeholder="0.00"
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-custom,#22C55E)]"
                            />
                            {item.unitName && (
                              <p className="text-xs text-gray-500 mt-1">Unit: {item.unitName}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Unit Cost <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={item.unit_cost}
                              onChange={(e) => updateItem(item.id, "unit_cost", e.target.value)}
                              placeholder="0.00"
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-custom,#22C55E)]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Total
                            </label>
                            <div className="w-full px-2 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md font-medium">
                              {formatNPR(itemTotal)}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="mt-6 p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {hasLowStock && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-red-600">
                          <AlertCircle className="w-3 h-3" />
                          <span>Insufficient stock! Available: {item.availableStock?.toFixed(2)} {item.unitName}</span>
                        </div>
                      )}
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={addItem}
                  className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-[var(--color-accent-custom,#22C55E)] hover:text-[var(--color-accent-custom,#22C55E)] transition-colors inline-flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Another Product
                </button>
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Grand Total:</span>
                <span className="text-xl font-bold text-gray-900">{formatNPR(calculateTotal())}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{items.length} product(s)</p>
            </div>
          )}
        </>
      )}

      <div>
        <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">
          Additional Notes
        </h3>
        <FormField label="Notes" name="notes" error={errors.notes}>
          <textarea
            {...register("notes")}
            id="notes"
            rows={3}
            className={inputClass}
            placeholder="Optional notes about this material consumption"
          />
        </FormField>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting || items.length === 0}
          className="px-6 py-2 bg-[var(--color-accent-custom,#22C55E)] text-white rounded-md hover:bg-[var(--color-accent-custom-600,#16A34A)] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isSubmitting ? "Logging..." : `Log ${items.length || ""} Consumption${items.length !== 1 ? "s" : ""}`}
        </button>
      </div>
    </form>
  );
}
