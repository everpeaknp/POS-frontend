"use client";

import { useState, useEffect } from "react";
import { DollarSign, ShoppingBag, Users, Package, TrendingUp, TrendingDown } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { DashHeader } from "@/components/dashboard/dash-header";
import { useApi } from "@/lib/hooks/useApi";
import { salesDashboardAPI } from "@/lib/api/sales";

const statusStyle: Record<string, string> = {
  Paid: "bg-green-100 text-green-700",
  Confirmed: "bg-green-100 text-green-700",
  Delivered: "bg-green-100 text-green-700",
  Pending: "bg-yellow-100 text-yellow-700",
  Draft: "bg-yellow-100 text-yellow-700",
  Cancelled: "bg-red-100 text-red-700",
};

type Period = "today" | "week" | "month" | "year";

export default function SalesDashboardPage() {
  const [period, setPeriod] = useState<Period>("month");
  
  // Fetch dashboard data from API
  const { data: dashboardData, loading, error, refetch } = useApi(
    () => salesDashboardAPI.get(period),
    { immediate: true }
  );

  // Refetch when period changes
  useEffect(() => {
    refetch();
  }, [period]);

  // Log error for debugging
  useEffect(() => {
    if (error) {
      console.error('[Sales Dashboard] Error:', error);
      console.error('[Sales Dashboard] Error response:', (error as any).response);
      console.error('[Sales Dashboard] Error message:', error.message);
    }
  }, [error]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Sales" subtitle="Overview & Analytics" />
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !dashboardData) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Sales" subtitle="Overview & Analytics" />
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">Failed to load dashboard data</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { stats, revenueData, recentOrders, topProducts, recentCustomers, inventorySummary } = dashboardData;

  const statCards = [
    { label: "Total Revenue", value: stats.revenue, change: stats.revenueChange, icon: DollarSign, color: "#22C55E", bg: "#F0FDF4" },
    { label: "Total Orders", value: stats.orders.toLocaleString(), change: stats.ordersChange, icon: ShoppingBag, color: "#3B82F6", bg: "#EFF6FF" },
    { label: "Total Customers", value: stats.customers.toLocaleString(), change: stats.customersChange, icon: Users, color: "#8B5CF6", bg: "#F5F3FF" },
    { label: "Total Products", value: stats.products.toLocaleString(), change: stats.productsChange, icon: Package, color: "#F59E0B", bg: "#FFFBEB" },
  ];

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Sales" subtitle="Overview & Analytics" />

      <div className="flex-1 p-6 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {statCards.map(({ label, value, change, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
                <Icon className="h-6 w-6" style={{ color }} />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold text-gray-900 truncate">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                <div className={`inline-flex items-center gap-0.5 text-xs font-medium mt-1 ${change >= 0 ? "text-green-600" : "text-red-500"}`}>
                  {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(change)}% vs last period
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Revenue chart */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Revenue Overview</h2>
              <p className="text-xs text-gray-400 mt-0.5">Track your earnings over time</p>
            </div>
            <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-0.5">
              {(["today", "week", "month", "year"] as Period[]).map((p) => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${
                    period === p ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}>
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
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "12px" }}
                formatter={(v) => [`Rs. ${Number(v).toLocaleString()}`, "Revenue"] as [string, string]}
              />
              <Area type="monotone" dataKey="value" stroke="#22C55E" strokeWidth={2.5}
                fill="url(#colorRevenue)" dot={false} activeDot={{ r: 5, fill: "#22C55E" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Orders + Products */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent Orders */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Recent Orders</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-medium text-gray-400 pb-2">Order ID</th>
                    <th className="text-left text-xs font-medium text-gray-400 pb-2">Customer</th>
                    <th className="text-left text-xs font-medium text-gray-400 pb-2">Amount</th>
                    <th className="text-left text-xs font-medium text-gray-400 pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-2.5 font-mono text-xs text-gray-500">{o.id}</td>
                      <td className="py-2.5 font-medium text-gray-800">{o.customer}</td>
                      <td className="py-2.5 text-gray-700">{o.amount}</td>
                      <td className="py-2.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle[o.status] || 'bg-gray-100 text-gray-700'}`}>
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
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Top Products</h2>
            <div className="space-y-4">
              {topProducts.map((p) => (
                <div key={p.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-700">{p.name}</span>
                    <span className="text-xs text-gray-400">{p.sales} sold</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-[#22C55E] transition-all"
                      style={{ width: `${(p.sales / p.max) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Customers + Inventory summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent Customers */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Recent Customers</h2>
            <div className="space-y-3">
              {recentCustomers.map((c) => (
                <div key={c.email} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#22C55E] text-white text-xs font-semibold flex items-center justify-center shrink-0">
                    {c.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 truncate">{c.name}</p>
                    <p className="text-xs text-gray-400 truncate">{c.email}</p>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{c.joined}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick stats */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Inventory Summary</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "In Stock", value: inventorySummary.inStock.toString(), color: "bg-green-50 text-green-700 border-green-100" },
                { label: "Low Stock", value: inventorySummary.lowStock.toString(), color: "bg-yellow-50 text-yellow-700 border-yellow-100" },
                { label: "Out of Stock", value: inventorySummary.outOfStock.toString(), color: "bg-red-50 text-red-700 border-red-100" },
                { label: "Total SKUs", value: inventorySummary.totalSKUs.toString(), color: "bg-blue-50 text-blue-700 border-blue-100" },
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
