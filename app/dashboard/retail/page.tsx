"use client";

import Link from "next/link";
import {
  TrendingUp,
  Plus,
  Package,
  ShoppingCart,
  AlertCircle,
  Activity,
  Clock,
  DollarSign,
  Banknote,
  ChevronRight,
  Loader2,
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
import { kiranaDashboardAPI } from "@/lib/api/kirana";
import { formatNPR } from "@/lib/utils";
import { useEnabledModuleLinks } from "@/lib/dashboard/useEnabledModuleLinks";

// Already covered by this page's own quick actions / stat cards above —
// left out of the dynamic "Explore Modules" list so they don't duplicate.
const RETAIL_COVERED_MODULE_IDS = ["pos", "inventory", "customers"];

const quickActions = [
  {
    href: "/dashboard/pos/checkout",
    label: "POS Checkout",
    sub: "Start selling now",
    icon: Plus,
    color: "bg-green-50 text-green-600",
  },
  {
    href: "/dashboard/pos/transactions",
    label: "View Transactions",
    sub: "See all sales",
    icon: TrendingUp,
    color: "bg-blue-50 text-blue-600",
  },
  {
    href: "/dashboard/inventory/products",
    label: "Manage Products",
    sub: "Add/update inventory",
    icon: Package,
    color: "bg-purple-50 text-purple-600",
  },
  {
    href: "/dashboard/pos/refunds/new",
    label: "Process Refund",
    sub: "Handle returns",
    icon: ShoppingCart,
    color: "bg-orange-50 text-orange-600",
  },
];

const moduleLinks = [
  {
    href: "/dashboard/pos/checkout",
    label: "POS Checkout",
    sub: "Make sales quickly",
    icon: DollarSign,
    color: "bg-green-50 text-green-600",
  },
  {
    href: "/dashboard/pos/transactions",
    label: "Transactions",
    sub: "View all sales",
    icon: TrendingUp,
    color: "bg-blue-50 text-blue-600",
  },
  {
    href: "/dashboard/pos/sessions",
    label: "POS Sessions",
    sub: "Manage cash sessions",
    icon: Clock,
    color: "bg-purple-50 text-purple-600",
  },
  {
    href: "/dashboard/inventory",
    label: "Inventory",
    sub: "Stock & products",
    icon: Package,
    color: "bg-orange-50 text-orange-600",
  },
  {
    href: "/dashboard/pos/reports",
    label: "POS Reports",
    sub: "Sales analytics",
    icon: Activity,
    color: "bg-indigo-50 text-indigo-600",
  },
  {
    href: "/dashboard/sales/customers",
    label: "Customers",
    sub: "Manage customers",
    icon: ShoppingCart,
    color: "bg-pink-50 text-pink-600",
  },
];

export default function KiranaOverviewPage() {
  const { user } = useAuth();
  const { data: dashboardData, loading, error } = useApi(
    () => kiranaDashboardAPI.get(),
    { immediate: true }
  );
  const enabledModuleLinks = useEnabledModuleLinks(RETAIL_COVERED_MODULE_IDS);

  const stats = [
    {
      label: "Today's Sales",
      value: dashboardData
        ? `NPR ${formatNPR(dashboardData.summary.today_sales)}`
        : "NPR 0",
      icon: TrendingUp,
    },
    {
      label: "Cash in Hand",
      value: dashboardData
        ? `NPR ${formatNPR(dashboardData.summary.cash_in_hand)}`
        : "NPR 0",
      icon: Banknote,
    },
    {
      label: "Total Stock Value",
      value: dashboardData
        ? `NPR ${formatNPR(dashboardData.summary.total_stock_value)}`
        : "NPR 0",
      icon: Package,
    },
    {
      label: "Low Stock Items",
      value: dashboardData ? dashboardData.summary.low_stock_count : 0,
      icon: AlertCircle,
    },
  ];

  const chartData =
    dashboardData?.salesTrend ||
    Array.from({ length: 7 }, (_, i) => ({
      date: new Date(new Date().setDate(new Date().getDate() - (6 - i)))
        .toISOString()
        .split("T")[0],
      sales: 0,
    }));

  const recentActivities = dashboardData?.recentActivities || [];
  const alerts = dashboardData?.alerts || [];
  const topSellingItems = dashboardData?.topSellingItems || [];

  return (
    <div className="w-full">
      <DashHeader
        title="Retail Dashboard"
        subtitle="Point of Sale & Inventory Management"
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-6 py-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                  {loading ? (
                    <div className="flex items-center gap-2 mt-2">
                      <Loader2 className="w-4 h-4 animate-spin text-green-600" />
                    </div>
                  ) : (
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {stat.value}
                    </p>
                  )}
                </div>
                <Icon className="w-5 h-5 text-green-600" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="px-6 py-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <Link key={idx} href={action.href}>
                <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer text-center">
                  <div className={`${action.color} w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2`}>
                    <Icon size={20} />
                  </div>
                  <p className="text-xs font-semibold text-gray-900">{action.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{action.sub}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Sales Trend Chart */}
      <div className="px-6 py-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Weekly Sales Trend
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-accent-custom,#22C55E)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-accent-custom,#22C55E)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: "12px" }} />
              <YAxis stroke="#9ca3af" style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "6px",
                  color: "#f3f4f6",
                }}
              />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="var(--color-accent-custom,#22C55E)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorSales)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Panels: Recent Activities, Alerts, Top Selling */}
      <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Recent Activities */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Activity size={16} className="text-green-600" />
            Recent Activities
          </h3>
          <div className="space-y-3">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-2 pb-2 border-b border-gray-100 last:border-0"
                >
                  <Clock size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-900">
                      {activity.action}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 text-center py-4">
                No recent activities
              </p>
            )}
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <AlertCircle size={16} className="text-orange-600" />
            Alerts
          </h3>
          <div className="space-y-3">
            {alerts.length > 0 ? (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`text-xs p-2 rounded ${
                    alert.type === "warning"
                      ? "bg-orange-50 text-orange-700"
                      : "bg-blue-50 text-blue-700"
                  }`}
                >
                  {alert.message}
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 text-center py-4">
                No alerts
              </p>
            )}
          </div>
        </div>

        {/* Top Selling Items */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <TrendingUp size={16} className="text-green-600" />
            Top Selling Items
          </h3>
          <div className="space-y-3">
            {topSellingItems.length > 0 ? (
              topSellingItems.map((item, idx) => (
                <div key={idx} className="pb-2 border-b border-gray-100 last:border-0">
                  <p className="text-xs font-medium text-gray-900">{item.name}</p>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-500">{item.quantity} sold</span>
                    <span className="text-xs font-semibold text-green-600">
                      NPR {formatNPR(item.sales)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 text-center py-4">
                No sales yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Module Navigation */}
      <div className="px-6 py-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Explore Modules</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...moduleLinks, ...enabledModuleLinks].map((module, idx) => {
            const Icon = module.icon;
            return (
              <Link key={idx} href={module.href}>
                <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md hover:border-green-300 transition-all cursor-pointer group">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                        {module.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{module.sub}</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-400 group-hover:text-green-600 transition-colors" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
