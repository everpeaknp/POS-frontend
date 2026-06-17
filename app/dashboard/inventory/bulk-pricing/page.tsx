"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashHeader } from "@/components/dashboard/dash-header";
import { SkeletonTable } from "@/components/shared/Skeleton";
import { useApi } from "@/lib/hooks/useApi";
import apiClient from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";

export default function BulkPricingPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data, loading, refetch } = useApi(
    () => apiClient.get("/inventory/bulk-pricing/"),
    { immediate: true }
  );

  // Handle both paginated response and direct array
  const bulkPrices = Array.isArray(data?.data) 
    ? data.data 
    : (data?.data?.results || []);

  const filteredPrices = bulkPrices.filter((price: any) =>
    price.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    price.product_sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string, productName: string) => {
    if (!confirm(`Delete bulk pricing for ${productName}?`)) return;

    try {
      toast.loading("Deleting...");
      await apiClient.delete(`/inventory/bulk-pricing/${id}/`);
      toast.dismiss();
      toast.success("Bulk pricing deleted");
      refetch();
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.response?.data?.detail || "Failed to delete");
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Bulk Pricing" subtitle="Manage tiered pricing for products" />
      <div className="flex-1 p-6 space-y-4">
        
        {/* Actions bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent"
            />
          </div>

          <Link href="/dashboard/inventory/bulk-pricing/new">
            <Button size="sm" className="h-10 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5">
              <Plus className="h-4 w-4" /> Add Bulk Pricing
            </Button>
          </Link>
        </div>

        {/* Bulk pricing table */}
        {loading ? (
          <SkeletonTable rows={5} />
        ) : filteredPrices.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No bulk pricing configured</h3>
            <p className="text-gray-500 mb-4">Set up tiered pricing for products</p>
            <Link href="/dashboard/inventory/bulk-pricing/new">
              <Button size="sm" className="bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5">
                <Plus className="h-4 w-4" /> Add Bulk Pricing
              </Button>
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Product", "SKU", "Min Qty", "Max Qty", "Unit Price", "Discount %", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredPrices.map((price: any) => (
                  <tr key={price.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-700">{price.product_name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{price.product_sku}</td>
                    <td className="px-4 py-3 text-gray-600">{price.min_quantity}</td>
                    <td className="px-4 py-3 text-gray-600">{price.max_quantity || '∞'}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{formatCurrency(price.unit_price)}</td>
                    <td className="px-4 py-3 text-gray-600">{price.discount_percent}%</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        price.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {price.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDelete(price.id, price.product_name)}
                          className="text-red-600 hover:text-red-700"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
