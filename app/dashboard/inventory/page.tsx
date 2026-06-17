"use client";

import { useRouter } from "next/navigation";
import { Package, AlertTriangle, Warehouse, TrendingDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { DashHeader } from "@/components/dashboard/dash-header";
import { inventoryApi, Product, Category } from "@/lib/api/inventory";
import { useApi } from "@/lib/hooks/useApi";
import { EmptyState } from "@/components/shared/EmptyState";
import { SkeletonCard, SkeletonTable } from "@/components/shared/Skeleton";

export default function InventoryPage() {
  const router = useRouter();
  
  // Fetch data from API
  const { data: productsData, loading: productsLoading } = useApi(
    () => inventoryApi.products.list(),
    { immediate: true }
  );
  
  const { data: categoriesData, loading: categoriesLoading } = useApi(
    () => inventoryApi.categories.list(),
    { immediate: true }
  );
  
  const { data: warehousesData, loading: warehousesLoading } = useApi(
    () => inventoryApi.warehouses.list(),
    { immediate: true }
  );

  const loading = productsLoading || categoriesLoading || warehousesLoading;

  // Extract data from API responses
  const products = productsData?.data?.results || [];
  const categories = categoriesData?.data?.results || [];
  const warehouses = warehousesData?.data?.results || [];

  // Calculate stats
  const lowStockProducts = products.filter((p: Product) => {
    const stock = p.total_stock ?? 0;
    const reorderLevel = p.reorder_level;
    return stock > 0 && stock <= reorderLevel;
  });

  const outOfStockProducts = products.filter((p: Product) => {
    const stock = p.total_stock ?? 0;
    return stock === 0;
  });

  const activeWarehouses = warehouses.filter((w: any) => w.is_active);

  const stats = [
    { 
      label: "Total Products", 
      value: products.length.toString(), 
      sub: "Across all warehouses", 
      icon: Package, 
      color: "text-blue-600 bg-blue-50" 
    },
    { 
      label: "Low Stock Items", 
      value: lowStockProducts.length.toString(), 
      sub: "Need reorder", 
      icon: AlertTriangle, 
      color: "text-orange-600 bg-orange-50" 
    },
    { 
      label: "Out of Stock", 
      value: outOfStockProducts.length.toString(), 
      sub: "Immediate action", 
      icon: TrendingDown, 
      color: "text-red-600 bg-red-50" 
    },
    { 
      label: "Warehouses", 
      value: activeWarehouses.length.toString(), 
      sub: "Active locations", 
      icon: Warehouse, 
      color: "text-green-600 bg-green-50" 
    },
  ];

  // Prepare chart data (top 10 products by stock)
  const stockData = products
    .slice(0, 10)
    .map((p: Product) => ({
      name: p.sku,
      stock: p.total_stock ?? 0,
      reorder: p.reorder_level,
    }));

  // Calculate products per category
  const categoryStats = categories.map((c: Category) => {
    const categoryProducts = products.filter((p: Product) => p.category === c.id.toString());
    const totalStock = categoryProducts.reduce((sum: number, p: Product) => {
      return sum + (p.total_stock ?? 0);
    }, 0);
    
    return {
      ...c,
      products: categoryProducts.length,
      totalStock: totalStock.toFixed(0),
    };
  });

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Inventory" subtitle="Stock levels and warehouse overview" />
        <div className="flex-1 p-6 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <SkeletonTable rows={5} />
          <SkeletonTable rows={8} />
        </div>
      </div>
    );
  }

  // Empty state
  if (products.length === 0) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Inventory" subtitle="Stock levels and warehouse overview" />
        <div className="flex-1 p-6">
          <EmptyState
            icon={Package}
            title="No products yet"
            description="Get started by adding your first product to begin tracking inventory."
            actionLabel="Add Product"
            actionHref="/dashboard/inventory/products/new"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Inventory" subtitle="Stock levels and warehouse overview" />
      <div className="flex-1 p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-500">{s.label}</p>
                <div className={`p-2 rounded-lg ${s.color}`}><s.icon className="h-4 w-4" /></div>
              </div>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Stock Levels Chart */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Stock Levels by Product (Top 10)</h3>
            {stockData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stockData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="stock" name="Current Stock" fill="#22C55E" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="reorder" name="Reorder Level" fill="#FCA5A5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">
                No stock data available
              </div>
            )}
          </div>

          {/* Categories Table */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <h3 className="text-sm font-semibold text-gray-700">Categories</h3>
              <button onClick={() => router.push("/dashboard/inventory/categories")} className="text-xs text-[#22C55E] hover:underline">View all</button>
            </div>
            {categoryStats.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="bg-gray-50"><tr>
                  {["Category", "Products", "Total Stock"].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {categoryStats.slice(0, 5).map((c: any) => (
                    <tr key={c.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-800">{c.name}</td>
                      <td className="px-4 py-3 text-gray-600">{c.products}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{c.totalStock} units</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-gray-400 text-sm">
                No categories yet
              </div>
            )}
          </div>
        </div>

        {/* All Products Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h3 className="text-sm font-semibold text-gray-700">Recent Products</h3>
            <button onClick={() => router.push("/dashboard/inventory/products")} className="text-xs text-[#22C55E] hover:underline">View all</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr>
                {["SKU", "Product", "Category", "Stock", "Reorder Level", "Unit", "Status"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {products.slice(0, 10).map((p: Product) => {
                  const stock = p.total_stock ?? 0;
                  const reorderLevel = p.reorder_level;
                  const isLowStock = stock > 0 && stock <= reorderLevel;
                  const isOutOfStock = stock === 0;

                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50 cursor-pointer" onClick={() => router.push("/dashboard/inventory/products")}>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.sku}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                      <td className="px-4 py-3 text-gray-600">{p.category_name || "-"}</td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${
                          isOutOfStock ? "text-red-500" : 
                          isLowStock ? "text-orange-500" : 
                          "text-gray-800"
                        }`}>
                          {stock.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{reorderLevel.toFixed(2)}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{p.unit_name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          isOutOfStock ? "bg-red-100 text-red-700" :
                          isLowStock ? "bg-orange-100 text-orange-700" :
                          p.status === "active" ? "bg-green-100 text-green-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {isOutOfStock ? "Out of Stock" : isLowStock ? "Low Stock" : p.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
