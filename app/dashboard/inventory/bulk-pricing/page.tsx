"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Tags, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  InventoryPageShell,
  inventoryCardClass,
  inventoryInputClass,
  inventoryTableWrapClass,
} from "@/components/dashboard/InventoryPageShell";
import { EmptyState } from "@/components/shared/EmptyState";
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

  if (!loading && bulkPrices.length === 0 && !searchTerm) {
    return (
      <InventoryPageShell
        title="Bulk Pricing"
        subtitle="Manage tiered pricing for products"
      >
        <EmptyState
            icon={Tags}
            title="No bulk pricing configured"
            description="Set up tiered pricing for products"
            actionLabel="Add Bulk Pricing"
            actionHref="/dashboard/inventory/bulk-pricing/new"
          />
      </InventoryPageShell>
    );
  }

  return (
    <InventoryPageShell
      title="Bulk Pricing"
      subtitle="Manage tiered pricing for products"
      loading={loading}
      toolbar={
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={inventoryInputClass}
          />
        </div>
      }
      action={
        <Link href="/dashboard/inventory/bulk-pricing/new">
          <Button size="sm" className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5">
            <Plus className="h-4 w-4" /> Add Bulk Pricing
          </Button>
        </Link>
      }
    >
      {filteredPrices.length === 0 ? (
        <div className={`${inventoryCardClass} p-12 text-center`}>
          <p className="text-gray-500">No bulk pricing found matching your search</p>
        </div>
      ) : (
        <div className={inventoryTableWrapClass}>
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
    </InventoryPageShell>
  );
}
