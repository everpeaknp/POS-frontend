"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Search, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  HardwarePageShell,
  hardwareCardClass,
  hardwareTableWrapClass,
} from "@/components/dashboard/HardwarePageShell";
import { EmptyState } from "@/components/shared/EmptyState";
import { inventoryApi, type Product } from "@/lib/api/inventory";
import { HARDWARE_LIST_PARAMS, unwrapList } from "@/lib/api/hardware-helpers";
import { formatNPR } from "@/lib/utils";
import toast from "react-hot-toast";

type StockFilter = "all" | "in_stock" | "low_stock" | "out_of_stock";

function stockBadge(product: Product) {
  const stock = product.total_stock || 0;
  const reorder = product.reorder_level || 0;
  if (stock === 0) return { label: "Out of Stock", className: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400", key: "out_of_stock" as const };
  if (stock <= reorder) return { label: "Low Stock", className: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400", key: "low_stock" as const };
  return { label: "In Stock", className: "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400", key: "in_stock" as const };
}

export default function HardwareProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await inventoryApi.products.list(HARDWARE_LIST_PARAMS);
      setProducts(unwrapList(response.data));
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast.error("Failed to load hardware products");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      product.name.toLowerCase().includes(q) ||
      product.sku?.toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (stockFilter === "all") return true;
    return stockBadge(product).key === stockFilter;
  });

  if (!loading && products.length === 0 && !searchTerm && stockFilter === "all") {
    return (
      <HardwarePageShell
        title="Hardware Products"
        subtitle="Manage hardware inventory with bulk pricing and stock tracking"
      >
        <EmptyState
            icon={Package}
            title="No products yet"
            description="Add your first hardware product to start tracking inventory and pricing"
            actionLabel="New Product"
            actionHref="/dashboard/hardware/products/new"
          />
      </HardwarePageShell>
    );
  }

  return (
    <HardwarePageShell
      title="Hardware Products"
      subtitle="Manage hardware inventory with bulk pricing and stock tracking"
      loading={loading}
    >
      <div className="flex gap-3 items-center justify-between">
        <div className="flex gap-3 items-center flex-1 min-w-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-sm border-gray-200"
            />
          </div>
          <Select
            value={stockFilter}
            onValueChange={(v) => setStockFilter((v as StockFilter) || "all")}
          >
            <SelectTrigger className="w-[160px] h-9 border-gray-200 shrink-0">
              <SelectValue placeholder="All Stock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stock</SelectItem>
              <SelectItem value="in_stock">In Stock</SelectItem>
              <SelectItem value="low_stock">Low Stock</SelectItem>
              <SelectItem value="out_of_stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Link href="/dashboard/hardware/products/new">
          <Button size="sm" className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5 shrink-0">
            <Plus className="h-4 w-4" /> New Product
          </Button>
        </Link>
      </div>

      {filteredProducts.length === 0 ? (
        <div className={`${hardwareCardClass} p-12 text-center`}>
          <p className="text-gray-500 dark:text-muted-foreground">No products found matching your search</p>
        </div>
      ) : (
      <div className={hardwareTableWrapClass}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-muted/50 border-b border-gray-100 dark:border-border">
              <tr>
                {["Product", "SKU", "Category", "Price", "Stock", "Status", ""].map((h) => (
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
              {filteredProducts.map((product) => {
                  const badge = stockBadge(product);
                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-gray-50/50 dark:hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => router.push(`/dashboard/hardware/products/${product.id}`)}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-foreground">
                        {product.name}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-muted-foreground font-mono text-xs">
                        {product.sku || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground">
                        {product.category_name || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-foreground tabular-nums">
                        {formatNPR(product.selling_price)}
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-foreground tabular-nums">
                        {product.total_stock || 0} {product.unit_name || "units"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/hardware/products/${product.id}`);
                          }}
                          className="text-sm text-[#22C55E] hover:text-[#16A34A] font-medium"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </HardwarePageShell>
  );
}
