"use client";


import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PackageMinus, Minus } from "lucide-react";
import toast from "react-hot-toast";
import { DashHeader } from "@/components/dashboard/dash-header";
import { inventoryApi } from "@/lib/api/inventory";
import { useApi } from "@/lib/hooks/useApi";
import { mapDjangoErrorsToForm, getErrorMessage } from "@/lib/utils/form-errors";
import { SkeletonCard } from "@/components/shared/Skeleton";

const stockOutSchema = z.object({
  product: z.string().min(1, "Product is required"),
  warehouse: z.string().min(1, "Warehouse is required"),
  quantity: z.string().min(1, "Quantity is required").refine((val) => parseFloat(val) > 0, {
    message: "Quantity must be greater than 0",
  }),
  purpose: z.string().min(1, "Purpose is required"),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

type StockOutFormData = z.infer<typeof stockOutSchema>;

export default function StockOutPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch products and warehouses
  const { data: productsData, loading: productsLoading } = useApi(
    () => inventoryApi.products.list({ page_size: 500, status: 'active' }),
    { immediate: true }
  );

  const { data: warehousesData, loading: warehousesLoading } = useApi(
    () => inventoryApi.warehouses.list({ page_size: 500, is_active: true }),
    { immediate: true }
  );

  const products = productsData?.data?.results || [];
  const warehouses = warehousesData?.data?.results || [];

  const form = useForm<StockOutFormData>({
    resolver: zodResolver(stockOutSchema),
    defaultValues: {
      product: "",
      warehouse: "",
      quantity: "",
      purpose: "",
      reference: "",
      notes: "",
    },
  });

  const onSubmit = async (data: StockOutFormData) => {
    setIsSubmitting(true);
    try {
      await inventoryApi.operations.stockOut({
        product: parseInt(data.product),
        warehouse: parseInt(data.warehouse),
        quantity: data.quantity,
        reason: data.purpose,
        notes: [data.reference, data.notes].filter(Boolean).join(' — ') || undefined,
      });

      toast.success("Stock issued successfully");
      router.push("/dashboard/inventory");
    } catch (error: any) {
      if (error.response?.status === 400) {
        mapDjangoErrorsToForm(error.response.data, form.setError, toast.error);
      } else {
        toast.error(getErrorMessage(error));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const loading = productsLoading || warehousesLoading;

  if (loading) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <DashHeader
          title="Stock Out"
          subtitle="Issue stock from warehouse"
        />
        <div className="flex-1 overflow-y-auto p-6">
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader
        title="Stock Out"
        subtitle="Issue stock from warehouse"
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border shadow-sm p-6 lg:p-8 w-full min-h-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange-50 rounded-lg">
                <PackageMinus className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Issue Stock</h2>
                <p className="text-sm text-gray-500">Remove stock from warehouse inventory</p>
              </div>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Product Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Product <span className="text-red-500">*</span>
                </label>
                <select
                  {...form.register("product")}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Select a product</option>
                  {products.map((product: any) => (
                    <option key={product.id} value={product.id}>
                      {product.sku} - {product.name} (Stock: {product.total_stock} {product.unit_name})
                    </option>
                  ))}
                </select>
                {form.formState.errors.product && (
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.product.message}</p>
                )}
              </div>

              {/* Warehouse Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Warehouse <span className="text-red-500">*</span>
                </label>
                <select
                  {...form.register("warehouse")}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Select a warehouse</option>
                  {warehouses.map((warehouse: any) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name} - {warehouse.location}
                    </option>
                  ))}
                </select>
                {form.formState.errors.warehouse && (
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.warehouse.message}</p>
                )}
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...form.register("quantity")}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter quantity to issue"
                />
                {form.formState.errors.quantity && (
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.quantity.message}</p>
                )}
              </div>

              {/* Purpose */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Purpose <span className="text-red-500">*</span>
                </label>
                <select
                  {...form.register("purpose")}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Select purpose</option>
                  <option value="sale">Sale</option>
                  <option value="site_usage">Site Usage</option>
                  <option value="internal_use">Internal Use</option>
                  <option value="damaged">Damaged/Waste</option>
                  <option value="return">Return to Supplier</option>
                  <option value="other">Other</option>
                </select>
                {form.formState.errors.purpose && (
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.purpose.message}</p>
                )}
              </div>

              {/* Reference */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Reference (Invoice, Site, etc.)
                </label>
                <input
                  type="text"
                  {...form.register("reference")}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter reference (optional)"
                />
              </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Notes
                </label>
                <textarea
                  {...form.register("notes")}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  placeholder="Add any additional notes (optional)"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? "Issuing..." : (
                    <>
                      <Minus className="h-4 w-4" />
                      Issue Stock
                    </>
                  )}
                </button>
              </div>
            </form>
        </div>
      </div>
    </div>
  );
}
