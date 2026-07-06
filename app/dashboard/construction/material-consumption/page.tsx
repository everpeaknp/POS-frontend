"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  ConstructionPageShell,
  constructionCardClass,
  constructionTableWrapClass,
} from "@/components/dashboard/ConstructionPageShell";
import { constructionApi, MaterialConsumption } from "@/lib/api/construction";
import { formatNPR } from "@/lib/utils";
import toast from "react-hot-toast";

export default function MaterialConsumptionPage() {
  const [consumptions, setConsumptions] = useState<MaterialConsumption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConsumptions();
  }, []);

  const fetchConsumptions = async () => {
    try {
      setLoading(true);
      const data = await constructionApi.materialConsumption.list();
      setConsumptions(Array.isArray(data) ? data : []);
    } catch (error: unknown) {
      console.error("Failed to fetch material consumption:", error);
      toast.error("Failed to load material consumption records");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  if (!loading && consumptions.length === 0) {
    return (
      <ConstructionPageShell
        title="Material Consumption"
        subtitle="Track material usage across construction sites"
        loading={loading}
      >
        <EmptyState
            icon={Package}
            title="No consumption records"
            description="Log material usage to track costs across your construction sites"
            actionLabel="Log Consumption"
            actionHref="/dashboard/construction/consumption/new"
          />
      </ConstructionPageShell>
    );
  }

  return (
    <ConstructionPageShell
      title="Material Consumption"
      subtitle="Track material usage across construction sites"
      loading={loading}
      action={
        <Link href="/dashboard/construction/consumption/new">
          <Button size="sm" className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5">
            <Plus className="h-4 w-4" />
            Log Consumption
          </Button>
        </Link>
      }
    >
      <div className={constructionTableWrapClass}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-muted/50 border-b border-gray-100 dark:border-border">
              <tr>
                {["Date", "Site", "Product", "Quantity", "Unit Cost", "Total", "Notes"].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-border">
              {consumptions.map((consumption) => (
                <tr
                  key={consumption.id}
                  className="hover:bg-gray-50/50 dark:hover:bg-muted/30"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatDate(consumption.created_at)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {consumption.site_name || consumption.site}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="font-medium text-gray-900">
                      {consumption.product_name}
                    </div>
                    {consumption.product_sku && (
                      <div className="text-xs text-gray-500">{consumption.product_sku}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {Number(consumption.quantity).toFixed(2)} {consumption.product_unit}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatNPR(Number(consumption.unit_cost))}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-medium">
                    {formatNPR(Number(consumption.total_cost))}
                  </td>
                  <td
                    className="px-4 py-3 text-gray-500 max-w-xs truncate"
                    title={consumption.notes || ""}
                  >
                    {consumption.notes || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ConstructionPageShell>
  );
}
