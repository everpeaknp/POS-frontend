"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  HardwarePageShell,
  hardwareInputClass,
  hardwareTableWrapClass,
} from "@/components/dashboard/HardwarePageShell";
import { NewBulkPricingModal } from "@/components/hardware/NewBulkPricingModal";
import { inventoryApi, type BulkPricing } from "@/lib/api/inventory";
import { formatNPR } from "@/lib/utils";
import toast from "react-hot-toast";

export default function HardwareBulkPricingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pricingRules, setPricingRules] = useState<BulkPricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);

  const openModal = useCallback(() => {
    setShowModal(true);
    router.replace("/dashboard/hardware/bulk-pricing?new=1", { scroll: false });
  }, [router]);

  const closeModal = useCallback(() => {
    setShowModal(false);
    if (searchParams.get("new")) {
      router.replace("/dashboard/hardware/bulk-pricing", { scroll: false });
    }
  }, [router, searchParams]);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setShowModal(true);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchPricingRules();
  }, []);

  const fetchPricingRules = async () => {
    try {
      setLoading(true);
      const response = await inventoryApi.bulkPricing.list();
      const data = response.data;
      setPricingRules(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error("Failed to fetch bulk pricing:", error);
      toast.error("Failed to load bulk pricing rules");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, productName?: string) => {
    if (!confirm(`Delete pricing rule${productName ? ` for ${productName}` : ""}?`)) return;
    try {
      await inventoryApi.bulkPricing.delete(Number(id));
      toast.success("Pricing rule deleted");
      setPricingRules(pricingRules.filter((p) => String(p.id) !== id));
    } catch (error) {
      console.error("Failed to delete pricing rule:", error);
      toast.error("Failed to delete pricing rule");
    }
  };

  const filteredRules = pricingRules.filter((rule) =>
    rule.product_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <HardwarePageShell
      title="Bulk Pricing"
      subtitle="Volume-based pricing tiers for hardware products"
      loading={loading}
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by product name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={hardwareInputClass}
          />
        </div>
        <Button
          type="button"
          size="sm"
          onClick={openModal}
          className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5"
        >
          <Plus className="h-4 w-4" />
          New Rule
        </Button>
      </div>

      <div className={hardwareTableWrapClass}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-muted/50 border-b border-gray-100 dark:border-border">
              <tr>
                {["Product", "Min Qty", "Max Qty", "Unit Price", "Discount %", ""].map((h) => (
                  <th
                    key={h || "actions"}
                    className={`px-4 py-3 text-xs font-medium text-gray-500 dark:text-muted-foreground uppercase ${
                      h === "" ? "text-right" : "text-left"
                    }`}
                  >
                    {h === "" ? "Actions" : h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-border">
              {filteredRules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500 dark:text-muted-foreground">
                    No bulk pricing rules found
                  </td>
                </tr>
              ) : (
                filteredRules.map((rule) => (
                  <tr
                    key={rule.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-foreground">
                      {rule.product_name}
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-foreground tabular-nums">
                      {rule.min_quantity}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground tabular-nums">
                      {rule.max_quantity || "Unlimited"}
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-foreground tabular-nums">
                      {formatNPR(rule.unit_price)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground tabular-nums">
                      {rule.discount_percent}%
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(String(rule.id), rule.product_name)}
                        className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <NewBulkPricingModal
        open={showModal}
        onClose={closeModal}
        onSuccess={fetchPricingRules}
      />
    </HardwarePageShell>
  );
}
