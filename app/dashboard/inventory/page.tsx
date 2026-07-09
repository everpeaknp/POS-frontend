"use client";

import Link from "next/link";
import {
  Package,
  AlertTriangle,
  Warehouse,
  TrendingDown,
  Plus,
  ArrowLeftRight,
  SlidersHorizontal,
  Tags,
  BarChart3,
  ChevronRight,
  DollarSign,
  Layers,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { DashHeader } from "@/components/dashboard/dash-header";
import { SkeletonCard } from "@/components/shared/Skeleton";
import { useAuth } from "@/lib/context/AuthContext";
import { useApi } from "@/lib/hooks/useApi";
import { inventoryDashboardAPI } from "@/lib/api/inventory";
import { formatNPR } from "@/lib/utils";

const quickActions = [
  {
    href: "/dashboard/inventory/products/new",
    label: "New Product",
    sub: "Add SKU",
    icon: Plus,
    color: "bg-green-50 text-[#22C55E]",
  },
  {
    href: "/dashboard/inventory/stock-in",
    label: "Stock In",
    sub: "Receive goods",
    icon: Package,
    color: "bg-blue-50 text-blue-600",
  },
  {
    href: "/dashboard/inventory/stock-out",
    label: "Stock Out",
    sub: "Issue goods",
    icon: TrendingDown,
    color: "bg-red-50 text-red-600",
  },
  {
    href: "/dashboard/inventory/adjustment?new=1",
    label: "Stock Adjustment",
    sub: "Correct levels",
    icon: SlidersHorizontal,
    color: "bg-purple-50 text-purple-600",
  },
  {
    href: "/dashboard/inventory/transfer?new=1",
    label: "Stock Transfer",
    sub: "Move stock",
    icon: ArrowLeftRight,
    color: "bg-amber-50 text-amber-600",
  },
];

const moduleLinks = [
  {
    href: "/dashboard/inventory/products",
    label: "Products",
    sub: "Full product catalog",
    icon: Package,
    color: "bg-blue-50 text-blue-600",
  },
  {
    href: "/dashboard/inventory/categories",
    label: "Categories",
    sub: "Product groups",
    icon: Tags,
    color: "bg-green-50 text-[#22C55E]",
  },
  {
    href: "/dashboard/inventory/warehouses",
    label: "Warehouses",
    sub: "Storage locations",
    icon: Warehouse,
    color: "bg-purple-50 text-purple-600",
  },
  {
    href: "/dashboard/inventory/reports",
    label: "Inventory Reports",
    sub: "Analytics & exports",
    icon: BarChart3,
    color: "bg-amber-50 text-amber-600",
  },
];

export default function InventoryDashboardPage() {
  const { user } = useAuth();

  const workspaceName =
    user?.tenant?.workspace_name || user?.tenant?.name || "Workspace";
  const subtitle = `${workspaceName} · Inventory overview and analytics`;

  const { data, loading, error, refetch } = useApi(
    () => inventoryDashboardAPI.get(),
    { immediate: true }
  );

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Inventory" subtitle={subtitle} />
        <div className="flex-1 p-6 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Inventory" subtitle={subtitle} />
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">Failed to load inventory overview</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="px-4 py-2 bg-[#22C55E] text-white rounded-lg hover:bg-[#16A34A]"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { summary, valuation, stockData, lowStockItems, topByValue, warehouseCount, categoryCount } =
    data;

  const maxValue = topByValue[0]?.total_cost_value ?? 1;

  const statCards = [
    {
      label: "Total Products",
      value: summary.total_products.toLocaleString(),
      sub: `${summary.total_units.toLocaleString()} total units`,
      icon: Package,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Stock Value",
      value: formatNPR(valuation.total_cost_value),
      sub: `Retail: ${formatNPR(valuation.total_sale_value)}`,
      icon: DollarSign,
      color: "bg-green-50 text-[#22C55E]",
    },
    {
      label: "Low Stock",
      value: summary.low_stock.toLocaleString(),
      sub: `${summary.out_of_stock} out of stock`,
      icon: AlertTriangle,
      color: "bg-amber-50 text-amber-600",
    },
    {
      label: "Warehouses",
      value: warehouseCount.toLocaleString(),
      sub: `${categoryCount} categories`,
      icon: Warehouse,
      color: "bg-purple-50 text-purple-600",
    },
  ];

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Inventory" subtitle={subtitle} />

      <div className="flex-1 p-6 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-500">{s.label}</p>
                <div className={`p-2 rounded-lg ${s.color}`}>
                  <s.icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:border-[#22C55E]/30 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-lg ${action.color} group-hover:scale-105 transition-transform`}
                  >
                    <action.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{action.label}</p>
                    <p className="text-xs text-gray-500">{action.sub}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Stock chart */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Stock Levels Overview</h3>
            {stockData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={stockData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="inventoryStock" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22C55E" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="stock"
                    name="Stock"
                    stroke="#22C55E"
                    strokeWidth={2}
                    fill="url(#inventoryStock)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[260px] flex flex-col items-center justify-center text-gray-400 text-sm">
                <Layers className="h-10 w-10 mb-2 text-gray-300" />
                No stock data yet
                <Link
                  href="/dashboard/inventory/products/new"
                  className="text-[#22C55E] text-xs mt-2 hover:underline"
                >
                  Add your first product
                </Link>
              </div>
            )}
          </div>

          {/* Module navigation */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Module Navigation</h3>
            <div className="space-y-2">
              {moduleLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-50 hover:bg-gray-50 hover:border-gray-100 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${link.color}`}>
                      <link.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{link.label}</p>
                      <p className="text-xs text-gray-500">{link.sub}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Low stock alerts */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-gray-700">Low Stock Alerts</h3>
              <Link
                href="/dashboard/inventory/products"
                className="text-xs text-[#22C55E] hover:text-[#16A34A] font-medium inline-flex items-center gap-1"
              >
                Manage products
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {lowStockItems.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                All products are above reorder levels
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {["Product", "Stock", "Reorder", "Status"].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-2.5 text-xs font-medium text-gray-500"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {lowStockItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        <Link
                          href={`/dashboard/inventory/products/${item.id}`}
                          className="hover:text-[#22C55E]"
                        >
                          {item.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{item.current_stock}</td>
                      <td className="px-4 py-3 text-gray-600">{item.reorder_level}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            item.status === "Out of Stock"
                              ? "bg-red-100 text-red-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Top products by value */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-gray-700">Top Products by Value</h3>
              <Link
                href="/dashboard/inventory/reports"
                className="text-xs text-[#22C55E] hover:text-[#16A34A] font-medium inline-flex items-center gap-1"
              >
                View reports
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {topByValue.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">
                No valuation data yet
              </div>
            ) : (
              <div className="space-y-4">
                {topByValue.map((p) => (
                  <div key={p.sku}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-700 truncate pr-2">
                        {p.name}
                      </span>
                      <span className="text-xs text-gray-500 shrink-0">
                        {formatNPR(p.total_cost_value)}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#22C55E] transition-all"
                        style={{ width: `${(p.total_cost_value / maxValue) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Valuation summary bar */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Inventory Valuation</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Cost Value", value: formatNPR(valuation.total_cost_value), icon: Package },
              { label: "Retail Value", value: formatNPR(valuation.total_sale_value), icon: TrendingDown },
              { label: "Potential Profit", value: formatNPR(valuation.potential_profit), icon: DollarSign },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 flex items-center gap-3"
              >
                <div className="p-2 rounded-lg bg-white border border-gray-100">
                  <item.icon className="h-4 w-4 text-[#22C55E]" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className="text-lg font-bold text-gray-900">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
