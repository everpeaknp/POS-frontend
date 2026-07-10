"use client";


import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Package, AlertCircle } from "lucide-react";
import FormField from "@/components/shared/FormField";
import { SkeletonTable } from "@/components/shared/Skeleton";
import { materialConsumptionAPI } from "@/lib/api/construction";
import { formatNPR } from "@/lib/utils";
import apiClient from "@/lib/api/client";

const consumptionSchema = z.object({
  site: z.string().min(1, "Site is required"),
  product: z.string().min(1, "Product is required"),
  quantity: z
    .string()
    .min(1, "Quantity is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Must be a positive number",
    }),
  unit_cost: z
    .string()
    .min(1, "Unit cost is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: "Must be a valid number",
    }),
  notes: z.string().optional().or(z.literal("")),
});

type ConsumptionFormData = z.infer<typeof consumptionSchema>;

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
  "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#22C55E] disabled:bg-gray-100";

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
  const [availableStock, setAvailableStock] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<ConsumptionFormData>({
    resolver: zodResolver(consumptionSchema),
    defaultValues: {
      site: siteId || "",
      notes: "",
    },
  });

  const watchedSite = watch("site");
  const watchedProduct = watch("product");
  const watchedQuantity = watch("quantity");
  const watchedUnitCost = watch("unit_cost");

  const totalCost =
    watchedQuantity && watchedUnitCost && !isNaN(Number(watchedQuantity)) && !isNaN(Number(watchedUnitCost))
      ? Number(watchedQuantity) * Number(watchedUnitCost)
      : 0;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [sitesRes, productsRes] = await Promise.all([
          apiClient.get("/construction/sites/"),
          apiClient.get("/inventory/products/"),
        ]);

        setSites(sitesRes.data.results || sitesRes.data || []);
        setProducts(productsRes.data.results || productsRes.data || []);
      } catch (error: unknown) {
        console.error("Failed to load form data:", error);
        toast.error("Failed to load form data. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!watchedProduct || products.length === 0) {
      setSelectedProduct(null);
      return;
    }

    const product = products.find((p) => p.id.toString() === watchedProduct);

    if (product) {
      setSelectedProduct(product);
      setValue("unit_cost", product.cost_price || "0", {
        shouldValidate: true,
        shouldDirty: true,
      });
    } else {
      setSelectedProduct(null);
    }
  }, [watchedProduct, products, setValue]);

  useEffect(() => {
    const fetchStock = async () => {
      if (!watchedSite || !watchedProduct) {
        setAvailableStock(null);
        return;
      }

      try {
        const site = sites.find((s) => s.id === watchedSite);
        if (!site) return;

        const response = await apiClient.get("/inventory/stocks/", {
          params: {
            product: watchedProduct,
            warehouse: site.warehouse,
          },
        });

        const stocks = response.data.results || response.data || [];
        setAvailableStock(stocks.length > 0 ? Number(stocks[0].quantity) : 0);
      } catch (error) {
        console.error("Failed to fetch stock:", error);
        setAvailableStock(null);
      }
    };

    fetchStock();
  }, [watchedSite, watchedProduct, sites]);

  useEffect(() => {
    if (watchedSite) {
      const site = sites.find((s) => s.id === watchedSite);
      setSelectedSite(site || null);
    } else {
      setSelectedSite(null);
    }
  }, [watchedSite, sites]);

  const onSubmit = async (data: ConsumptionFormData) => {
    try {
      const requestedQty = Number(data.quantity);
      if (availableStock !== null && requestedQty > availableStock) {
        toast.error(`Insufficient stock! Available: ${availableStock.toFixed(2)}`);
        return;
      }

      const payload = {
        site: data.site,
        product: String(data.product),
        quantity: Number(data.quantity),
        unit_cost: Number(data.unit_cost),
        notes: data.notes || "",
        daily_log: dailyLogId,
      };

      await materialConsumptionAPI.create(
        payload as Parameters<typeof materialConsumptionAPI.create>[0]
      );

      toast.success("Material consumption logged successfully! Stock updated.");

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/dashboard/construction/sites/${data.site}`);
      }

      reset();
    } catch (error: unknown) {
      const err = error as { response?: { data?: Record<string, unknown> } };
      const message =
        (err.response?.data?.detail as string) ||
        (err.response?.data?.message as string) ||
        "Operation failed. Please try again.";
      toast.error(message);

      if (err.response?.data) {
        Object.keys(err.response.data).forEach((field) => {
          if (field !== "detail" && field !== "message") {
            const fieldErrors = err.response!.data![field];
            const errorMsg = Array.isArray(fieldErrors) ? fieldErrors[0] : fieldErrors;
            toast.error(`${field}: ${errorMsg}`);
          }
        });
      }
    }
  };

  if (loading) {
    return <SkeletonTable rows={5} />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div>
        <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">
          Consumption Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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

          <FormField
            label="Product/Material"
            name="product"
            error={errors.product}
            required
            hint="Select the material to consume"
          >
            <select {...register("product")} id="product" className={inputClass}>
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.sku}) - {product.unit_name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Quantity"
            name="quantity"
            error={errors.quantity}
            required
            hint={selectedProduct ? `Unit: ${selectedProduct.unit_name}` : "Enter quantity to consume"}
          >
            <input
              {...register("quantity")}
              type="text"
              id="quantity"
              className={inputClass}
              placeholder="0.00"
            />
          </FormField>

          <FormField
            label="Unit Cost (NPR)"
            name="unit_cost"
            error={errors.unit_cost}
            required
            hint="Cost per unit (auto-filled from product)"
          >
            <input
              {...register("unit_cost")}
              type="text"
              id="unit_cost"
              className={inputClass}
              placeholder="0.00"
            />
          </FormField>
        </div>
      </div>

      {selectedSite && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 w-full">
          <div className="flex items-start gap-3">
            <Package className="w-5 h-5 text-[#22C55E] mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-900">
                Warehouse: {selectedSite.warehouse_name}
              </p>
              <p className="text-xs text-green-700 mt-1">
                Materials will be deducted from this warehouse inventory
              </p>
            </div>
          </div>
        </div>
      )}

      {watchedProduct && watchedSite && availableStock !== null && (
        <div
          className={`border rounded-lg p-4 ${
            availableStock > 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
          }`}
        >
          <div className="flex items-start gap-3">
            {availableStock > 0 ? (
              <Package className="w-5 h-5 text-green-600 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            )}
            <div>
              <p
                className={`text-sm font-medium ${
                  availableStock > 0 ? "text-green-900" : "text-red-900"
                }`}
              >
                Available Stock: {availableStock.toFixed(2)} {selectedProduct?.unit_name || ""}
              </p>
              {availableStock === 0 && (
                <p className="text-xs text-red-700 mt-1">
                  No stock available at this warehouse. Please transfer stock first.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {totalCost > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Total Cost:</span>
            <span className="text-lg font-bold text-gray-900">{formatNPR(totalCost)}</span>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">
          Notes
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
          disabled={isSubmitting || availableStock === 0}
          className="px-6 py-2 bg-[#22C55E] text-white rounded-md hover:bg-[#16A34A] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isSubmitting ? "Logging..." : "Log Consumption"}
        </button>
      </div>
    </form>
  );
}
