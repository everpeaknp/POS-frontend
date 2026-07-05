"use client";

import { useState, useEffect } from "react";
import { DollarSign, ShoppingBag, Users, Package, TrendingUp, TrendingDown } from "lucide-react";
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
import { useApi } from "@/lib/hooks/useApi";
import { salesDashboardAPI } from "@/lib/api/sales";
import { useAppearance } from "@/lib/context/AppearanceContext";

const statCards = [
  { key: "revenue", label: "Total Revenue", icon: DollarSign, iconClass: "text-emerald-500", wrapClass: "bg-emerald-500/15" },
  { key: "orders", label: "Total Orders", icon: ShoppingBag, iconClass: "text-blue-500", wrapClass: "bg-blue-500/15" },
  { key: "customers", label: "Total Customers", icon: Users, iconClass: "text-violet-500", wrapClass: "bg-violet-500/15" },
  { key: "products", label: "Total Products", icon: Package, iconClass: "text-amber-500", wrapClass: "bg-amber-500/15" },
];

const statusStyle: Record<string, string> = {
  Paid: "bg-green-100 text-green-700",
  Pending: "bg-yellow-100 text-yellow-700",
  Cancelled: "bg-red-100 text-red-700",
  Draft: "bg-gray-100 text-gray-700",
  Confirmed: "bg-blue-100 text-blue-700",
  Delivered: "bg-green-100 text-green-700",
};

type Period = "today" | "week" | "month" | "year";

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>("month");
  const { isDark } = useAppearance();
  
  const { data, loading, error, refetch } = useApi(
    () => salesDashboardAPI.get(period),
    { immediate: true }
  );

  useEffect(() => {
    refetch();
  }, [period, refetch]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Dashboard" subtitle="FashionNep · Overview" />
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22C55E] mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Dashboard" subtitle="FashionNep · Overview" />
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-4">Failed to load dashboard data</p>
            <p className="text-sm text-gray-500 mb-4">{error?.message || 'Please try again'}</p>
            <button
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

  const { stats, revenueData, recentOrders, topProducts, recentCustomers, inventorySummary } = data;

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Dashboard" subtitle="FashionNep · Overview" />
      <div className="flex-1 p-6 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {statCards.map(({ key, label, icon: Icon, iconClass, wrapClass }) => {
            const value = key === "revenue" ? stats.revenue : 
                         key === "orders" ? stats.orders.toLocaleString() :
                         key === "customers" ? stats.customers.toLocaleString() :
                         stats.products.toLocaleString();
            const change = key === "revenue" ? stats.revenueChange :
                          key === "orders" ? stats.ordersChange :
                          key === "customers" ? stats.customersChange :
                          stats.productsChange;
            
            return (
              <div key={key} className="bg-card rounded-xl border border-border p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${wrapClass}`}>
                  <Icon className={`h-6 w-6 ${iconClass}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold text-foreground truncate">{value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                  <div className={`inline-flex items-center gap-0.5 text-xs font-medium mt-1 ${change >= 0 ? "text-green-600" : "text-red-500"}`}>
                    {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(change)}% vs last period
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Revenue chart */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-base font-semibold text-foreground">Revenue Overview</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Track your earnings over time</p>
            </div>
            <div className="flex items-center bg-muted rounded-lg p-1 gap-0.5">
              {(["today", "week", "month", "year"] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${
                    period === p ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22C55E" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "oklch(1 0 0 / 8%)" : "#F3F4F6"} />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: isDark ? "#9CA3AF" : "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: isDark ? "#9CA3AF" : "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: isDark ? "1px solid oklch(1 0 0 / 12%)" : "1px solid #E5E7EB",
                  background: isDark ? "oklch(0.205 0 0)" : "#ffffff",
                  color: isDark ? "oklch(0.985 0 0)" : "#111827",
                  fontSize: "12px",
                }}
                formatter={(v) => [`Rs. ${Number(v).toLocaleString()}`, "Revenue"] as [string, string]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#22C55E"
                strokeWidth={2.5}
                fill="url(#colorRevenue)"
                dot={false}
                activeDot={{ r: 5, fill: "#22C55E" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Orders + Products */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent Orders */}
          <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
            <h2 className="text-base font-semibold text-foreground mb-4">Recent Orders</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-medium text-muted-foreground pb-2">Order ID</th>
                    <th className="text-left text-xs font-medium text-muted-foreground pb-2">Customer</th>
                    <th className="text-left text-xs font-medium text-muted-foreground pb-2">Amount</th>
                    <th className="text-left text-xs font-medium text-muted-foreground pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-accent/50 transition-colors">
                      <td className="py-2.5 font-mono text-xs text-muted-foreground">{o.id}</td>
                      <td className="py-2.5 font-medium text-foreground">{o.customer}</td>
                      <td className="py-2.5 text-foreground">{o.amount}</td>
                      <td className="py-2.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle[o.status]}`}>
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
            <h2 className="text-base font-semibold text-foreground mb-4">Top Products</h2>
            <div className="space-y-4">
              {topProducts.map((p) => (
                <div key={p.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-foreground">{p.name}</span>
                    <span className="text-xs text-muted-foreground">{p.sales} sold</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#22C55E] transition-all"
                      style={{ width: `${(p.sales / p.max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Customers + Inventory summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent Customers */}
          <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
            <h2 className="text-base font-semibold text-foreground mb-4">Recent Customers</h2>
            <div className="space-y-3">
              {recentCustomers.map((c, index) => (
                <div key={`${c.name}-${c.joined}-${index}`} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#22C55E] text-white text-xs font-semibold flex items-center justify-center shrink-0">
                    {c.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{c.joined}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick stats */}
          <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
            <h2 className="text-base font-semibold text-foreground mb-4">Inventory Summary</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "In Stock", value: inventorySummary.inStock.toString(), color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/20" },
                { label: "Low Stock", value: inventorySummary.lowStock.toString(), color: "bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/20" },
                { label: "Out of Stock", value: inventorySummary.outOfStock.toString(), color: "bg-red-500/15 text-red-600 dark:text-red-300 border-red-500/20" },
                { label: "Total SKUs", value: inventorySummary.totalSKUs.toString(), color: "bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/20" },
              ].map((item) => (
                <div key={item.label} className={`rounded-xl border p-4 ${item.color}`}>
                  <p className="text-2xl font-bold">{item.value}</p>
                  <p className="text-xs font-medium mt-0.5 opacity-80">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
