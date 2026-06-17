"use client";

import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { DashHeader } from "@/components/dashboard/dash-header";
import ProductForm from "@/components/inventory/ProductForm";
import { useApi } from "@/lib/hooks/useApi";
import { inventoryApi } from "@/lib/api/inventory";
import { Skeleton } from "@/components/shared/Skeleton";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = Number(params.id);

  // Fetch product data
  const { data: product, loading } = useApi(
    () => inventoryApi.products.get(productId).then(res => res.data),
    { immediate: true }
  );

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader 
          title="Edit Product" 
          subtitle="Update product information"
        />
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-10 w-32 mb-6" />
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <div className="space-y-6">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader 
          title="Edit Product" 
          subtitle="Update product information"
        />
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm text-center">
              <p className="text-gray-600">Product not found</p>
              <button
                onClick={() => router.push("/dashboard/inventory/products")}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Back to Products
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader 
        title="Edit Product" 
        subtitle={`Update ${product.name}`}
      />

      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <button
            onClick={() => router.push("/dashboard/inventory/products")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Products
          </button>

          {/* Product Form Card */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <ProductForm
              productId={productId.toString()}
              initialData={{
                name: product.name,
                sku: product.sku,
                description: product.description || '',
                category: product.category?.toString() || '',
                unit: product.unit.toString(),
                cost_price: product.cost_price.toString(),
                selling_price: product.selling_price.toString(),
                reorder_level: product.reorder_level.toString(),
                status: product.status,
                total_stock: product.total_stock || 0,
              }}
              onSuccess={() => {
                router.push("/dashboard/inventory/products");
              }}
              onCancel={() => {
                router.push("/dashboard/inventory/products");
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
