"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { DashHeader } from "@/components/dashboard/dash-header";
import ProductForm from "@/components/inventory/ProductForm";

export default function NewProductPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Create Product" subtitle="Add a new product to your inventory" />
      <div className="flex-1 p-6">
        <div className="max-w-2xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>

          {/* Form Card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <ProductForm
              onSuccess={() => router.push("/dashboard/inventory/products")}
              onCancel={() => router.back()}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
