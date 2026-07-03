"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  TrendingUp,
  TrendingDown,
  FileText,
  ClipboardList,
  Receipt,
  CreditCard,
  ChevronRight,
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
import { salesDashboardAPI } from "@/lib/api/sales";

const statusStyle: Record<string, string> = {
  Paid: "bg-green-100 text-green-700",
  Confirmed: "bg-green-100 text-green-700",
  Delivered: "bg-green-100 text-green-700",
  Pending: "bg-yellow-100 text-yellow-700",
  Draft: "bg-yellow-100 text-yellow-700",
  Cancelled: "bg-red-100 text-red-700",
};

const quickActions = [
  {
    href: "/dashboard/sales/orders/new",
    label: "New Sales Order",
    sub: "Create order",
    icon: ShoppingBag,
    color: "bg-blue-50 text-blue-600",
  },
  {
    href: "/dashboard/sales/quotations/new",
    label: "New Quotation",
    sub: "Send quote",
    icon: ClipboardList,
    color: "bg-green-50 text-[#22C55E]",
  },
  {
    href: "/dashboard/sales/customers/new",
    label: "New Customer",
    sub: "Add client",
    icon: Users,
    color: "bg-purple-50 text-purple-600",
  },
  {
    href: "/dashboard/sales/invoices/new",
    label: "New Invoice",
    sub: "Bill customer",
    icon: Receipt,
    color: "bg-orange-50 text-orange-600",
  },
];

const moduleLinks = [
  {
    href: "/dashboard/sales/orders",
    label: "Sales Orders",
    sub: "Manage orders",
    icon: ShoppingBag,
    color: "bg-blue-50 text-blue-600",
  },
  {
    href: "/dashboard/sales/customers",
    label: "Customers",
    sub: "Client directory",
    icon: Users,
    color: "bg-purple-50 text-purple-600",
  },
  {
    href: "/dashboard/sales/payments",
    label: "Payments",
    sub: "Record collections",
    icon: CreditCard,
    color: "bg-green-50 text-[#22C55E]",
  },
  {
    href: "/dashboard/sales/reports",
    label: "Sales Reports",
    sub: "Analytics & exports",
    icon: FileText,
    color: "bg-amber-50 text-amber-600",
  },
];

type Period = "today" | "week" | "month" | "year";

export default function SalesDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>("month");

  const workspaceName =
    user?.tenant?.workspace_name || user?.tenant?.name || "Workspace";
  const subtitle = `${workspaceName} · Sales overview and analytics`;

  const { data: dashboardData, loading, error, refetch } = useApi(
    () => salesDashboardAPI.get(period),
    { immediate: true }
  );

  useEffect(() => {
    refetch();
  }, [period, refetch]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Sales" subtitle={subtitle} />
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

  if (error || !dashboardData) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Sales" subtitle={subtitle} />
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">Failed to load sales overview</p>
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

  const { stats, revenueData, recentOrders, topProducts, recentCustomers, inventorySummary } =
    dashboardData;

  const statCards = [
    {
      label: "Total Revenue",
      value: stats.revenue,
      change: stats.revenueChange,
      icon: DollarSign,
      color: "bg-green-50 text-[#22C55E]",
    },
    {
      label: "Total Orders",
      value: stats.orders.toLocaleString(),
      change: stats.ordersChange,
      icon: ShoppingBag,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Total Customers",
      value: stats.customers.toLocaleString(),
      change: stats.customersChange,
      icon: Users,
      color: "bg-purple-50 text-purple-600",
    },
    {
      label: "Total Products",
      value: stats.products.toLocaleString(),
      change: stats.productsChange,
      icon: Package,
      color: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Sales" subtitle={subtitle} />

      <div className="flex-1 p-6 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(({ label, value, change, icon: Icon, color }) => (
            <div
              key={label}
              className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-500">{label}</p>
                <div className={`p-2 rounded-lg ${color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <div
                className={`inline-flex items-center gap-0.5 text-xs font-medium mt-1 ${
                  change >= 0 ? "text-green-600" : "text-red-500"
                }`}
              >
                {change >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {Math.abs(change)}% vs last period
              </div>
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
          {/* Revenue chart */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h3 className="text-sm font-semibold text-gray-700">Revenue Overview</h3>
              <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-0.5">
                {(["today", "week", "month", "year"] as Period[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${
                      period === p
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesColorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 11, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #E5E7EB",
                    fontSize: "12px",
                  }}
                  formatter={(v) => [`Rs. ${Number(v).toLocaleString()}`, "Revenue"]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#22C55E"
                  strokeWidth={2.5}
                  fill="url(#salesColorRevenue)"
                  dot={false}
                  activeDot={{ r: 5, fill: "#22C55E" }}
                />
              </AreaChart>
            </ResponsiveContainer>
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

        {/* Orders + Products */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-gray-700">Recent Orders</h3>
              <Link
                href="/dashboard/sales/orders"
                className="text-xs text-[#22C55E] hover:text-[#16A34A] font-medium inline-flex items-center gap-1"
              >
                View all
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {["Order ID", "Customer", "Amount", "Status"].map((h) => (
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
                {recentOrders.map((o) => (
                  <tr
                    key={o.id}
                    className="hover:bg-gray-50/50 cursor-pointer"
                    onClick={() => router.push(`/dashboard/sales/orders/${o.id}`)}
                  >
                    <td className="px-4 py-2.5 font-mono text-xs text-[#22C55E]">{o.id}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-800">{o.customer}</td>
                    <td className="px-4 py-2.5 text-gray-700">{o.amount}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          statusStyle[o.status] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Top Products</h3>
            <div className="space-y-4">
              {topProducts.map((p) => (
                <div key={p.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-700">{p.name}</span>
                    <span className="text-xs text-gray-400">{p.sales} sold</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
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

        {/* Customers + Inventory */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-gray-700">Recent Customers</h3>
              <Link
                href="/dashboard/sales/customers"
                className="text-xs text-[#22C55E] hover:text-[#16A34A] font-medium inline-flex items-center gap-1"
              >
                View all
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
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

          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Inventory Summary</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "In Stock",
                  value: inventorySummary.inStock.toString(),
                  color: "bg-green-50 text-green-700 border-green-100",
                },
                {
                  label: "Low Stock",
                  value: inventorySummary.lowStock.toString(),
                  color: "bg-yellow-50 text-yellow-700 border-yellow-100",
                },
                {
                  label: "Out of Stock",
                  value: inventorySummary.outOfStock.toString(),
                  color: "bg-red-50 text-red-700 border-red-100",
                },
                {
                  label: "Total SKUs",
                  value: inventorySummary.totalSKUs.toString(),
                  color: "bg-blue-50 text-blue-700 border-blue-100",
                },
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
