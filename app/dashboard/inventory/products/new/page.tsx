"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { DashHeader } from "@/components/dashboard/dash-header";
import { Button } from "@/components/ui/button";
import ProductForm from "@/components/inventory/ProductForm";

export default function NewProductPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashHeader title="Create Product" subtitle="Add a new product to your inventory" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 w-full min-h-full">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/dashboard/inventory/products")}
            className="mb-6 -ml-2 gap-1.5 text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Button>
          <ProductForm
            onSuccess={() => router.push("/dashboard/inventory/products")}
            onCancel={() => router.back()}
          />
        </div>
      </div>
    </div>
  );
}
