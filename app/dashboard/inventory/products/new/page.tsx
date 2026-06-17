"use client";

import { useRouter } from "next/navigation";
import { DashHeader } from "@/components/dashboard/dash-header";
import ProductForm from "@/components/inventory/ProductForm";

export default function NewProductPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader title="Create Product" subtitle="Add a new product to your inventory" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 w-full min-h-full">
          <ProductForm
            onSuccess={() => router.push("/dashboard/inventory/products")}
            onCancel={() => router.back()}
          />
        </div>
      </div>
    </div>
  );
}
