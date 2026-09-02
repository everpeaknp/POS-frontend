"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DashHeader } from "@/components/dashboard/dash-header";
import ProductForm from "@/components/inventory/ProductForm";
import { inventoryApi } from "@/lib/api/inventory";
import { KhataLoading } from "@/components/shared/KhataLoading";
import toast from "react-hot-toast";

export default function NewProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const skuFromBarcode = searchParams.get("sku") || undefined;
  
  const [loading, setLoading] = useState(!!editId);
  const [productData, setProductData] = useState<any>(null);

  const isEdit = !!editId;

  useEffect(() => {
    if (editId) {
      loadProductData();
    }
  }, [editId]);

  const loadProductData = async () => {
    if (!editId) return;
    
    try {
      setLoading(true);
      const response = await inventoryApi.products.get(Number(editId));
      setProductData(response.data);
    } catch (error) {
      toast.error("Failed to load product details");
      router.push("/dashboard/inventory/products");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <KhataLoading message="Loading product..." fullScreen={false} />;
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader 
        title={isEdit ? "Edit Product" : "Create Product"} 
        subtitle={isEdit ? "Update product details" : "Add a new product to your inventory"} 
      />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 lg:p-8 w-full min-h-full">
          <ProductForm
            productId={isEdit ? editId : undefined}
            initialData={isEdit ? productData : undefined}
            initialSku={!isEdit ? skuFromBarcode : undefined}
            onSuccess={() => router.push("/dashboard/inventory/products")}
            onCancel={() => router.back()}
          />
        </div>
      </div>
    </div>
  );
}
