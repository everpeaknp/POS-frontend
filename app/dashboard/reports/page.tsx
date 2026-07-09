"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  ShoppingCart,
  Package,
  DollarSign,
  FileText,
  Settings,
  ChevronRight,
  AlertTriangle,
  HardHat,
  BarChart3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { SkeletonCard } from "@/components/shared/Skeleton";
import {
  ReportsPageShell,
  reportsCardClass,
  reportsTableWrapClass,
} from "@/components/reports/ReportsPageShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/context/AuthContext";
import { reportsAPI, type DashboardSummary } from "@/lib/api/reports";
import { tenantApi } from "@/lib/api/tenant";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { formatNPR } from "@/lib/utils";
import toast from "react-hot-toast";

const COLORS = ["#22C55E", "#3B82F6", "#F59E0B", "#8B5CF6", "#EF4444"];

const ALL_REPORT_CARDS = [
  {
    module: "sales" as const,
    icon: TrendingUp,
    title: "Sales Report",
    desc: "Sales performance and trends",
    href: "/dashboard/reports/sales",
    color: "bg-green-50 text-[#22C55E]",
  },
  {
    module: "purchase" as const,
    icon: ShoppingCart,
    title: "Purchase Report",
    desc: "Purchase history and analysis",
    href: "/dashboard/reports/purchase",
    color: "bg-blue-50 text-blue-600",
  },
  {
    module: "inventory" as const,
    icon: Package,
    title: "Inventory Report",
    desc: "Stock levels and valuation",
    href: "/dashboard/reports/inventory",
    color: "bg-amber-50 text-amber-600",
  },
  {
    module: "accounting" as const,
    icon: DollarSign,
    title: "Financial Report",
    desc: "P&L, Balance Sheet, Trial Balance",
    href: "/dashboard/reports/financial",
    color: "bg-purple-50 text-purple-600",
  },
  {
    module: "accounting" as const,
    icon: FileText,
    title: "Tax Report",
    desc: "VAT, TDS and tax summaries",
    href: "/dashboard/reports/tax",
    color: "bg-red-50 text-red-600",
  },
  {
    module: "reports" as const,
    icon: Settings,
    title: "Custom Reports",
    desc: "Build your own report",
    href: "/dashboard/reports/custom",
    color: "bg-gray-50 text-gray-600",
  },
];

export default function ReportsPage() {
  const { user, refreshUser } = useAuth();
  const { hasModuleAccess } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [enablingModule, setEnablingModule] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  const reportsModuleActive = hasModuleAccess("reports");
  const canEnableReports = user?.role === "admin" && !!user?.tenant?.slug;

  const workspaceName =
    user?.tenant?.workspace_name || user?.tenant?.name || "Workspace";
  const subtitle = `${workspaceName} · Business analytics and insights`;

  const visibleReportCards = useMemo(
    () =>
      ALL_REPORT_CARDS.filter((card) => {
        if (card.module === "reports") return true;
        return hasModuleAccess(card.module);
      }),
    [hasModuleAccess, user?.tenant?.active_modules]
  );

  useEffect(() => {
    if (!reportsModuleActive) {
      setLoading(false);
      return;
    }
    fetchData();
  }, [reportsModuleActive]);

  const handleEnableReportsModule = async () => {
    if (!user?.tenant?.slug) return;
    try {
      setEnablingModule(true);
      await tenantApi.activateModule(user.tenant.slug, "reports");
      await refreshUser();
      toast.success("Reports module enabled");
    } catch (err) {
      console.error("Failed to enable reports module:", err);
      toast.error("Failed to enable reports module");
    } finally {
      setEnablingModule(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await reportsAPI.dashboardSummary();
      setSummary(data);
    } catch (error) {
      console.error("Failed to fetch reports overview:", error);
      toast.error("Failed to load reports overview");
    } finally {
      setLoading(false);
    }
  };

  const financials = summary?.financials;
  const showInventoryAlerts = hasModuleAccess("inventory");
  const showConstructionAlerts = hasModuleAccess("construction");

  const statCards = financials
    ? [
        {
          label: "Total Revenue",
          value: formatNPR(financials.total_revenue),
          sub: "Invoices + unbilled sales",
          icon: TrendingUp,
          color: "bg-green-50 text-[#22C55E]",
        },
        {
          label: "Total Expenses",
          value: formatNPR(financials.total_expenses),
          sub: "Purchases, materials, labor",
          icon: ShoppingCart,
          color: "bg-red-50 text-red-600",
        },
        {
          label: "Net Profit",
          value: formatNPR(financials.net_profit),
          sub: `${financials.profit_margin_percentage.toFixed(1)}% margin`,
          icon: DollarSign,
          color: "bg-blue-50 text-blue-600",
        },
        {
          label: "Receivables",
          value: formatNPR(financials.total_receivables),
          sub: `Payables: ${formatNPR(financials.total_payables)}`,
          icon: FileText,
          color: "bg-purple-50 text-purple-600",
        },
      ]
    : [];

  const revenueExpenseChart = financials
    ? [
        { name: "Revenue", amount: financials.total_revenue },
        { name: "Expenses", amount: financials.total_expenses },
        { name: "Net Profit", amount: financials.net_profit },
      ]
    : [];

  const breakdownChart = useMemo(() => {
    if (!financials?.breakdown) return [];
    const b = financials.breakdown;
    return [
      { name: "Sales", value: b.sales_revenue },
      { name: "Invoices", value: b.invoice_revenue },
      { name: "Purchases", value: b.purchase_expenses },
      { name: "Materials", value: b.material_expenses },
      { name: "Labor", value: b.labor_expenses },
    ].filter((item) => item.value > 0);
  }, [financials]);

  const lowStockItems = summary?.inventory.low_stock_items ?? [];
  const budgetAlerts = summary?.construction.budget_alert_sites ?? [];

  if (!reportsModuleActive) {
    return (
      <ReportsPageShell title="Reports" subtitle={subtitle} showBack={false}>
        <div className={`${reportsCardClass} p-8 text-center max-w-lg mx-auto`}>
          <BarChart3 className="h-10 w-10 text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Reports module is not enabled</h2>
          <p className="text-sm text-gray-500 mb-6">
            Enable the reports module to access business analytics, financial summaries, and custom
            reports.
          </p>
          {canEnableReports ? (
            <Button onClick={handleEnableReportsModule} disabled={enablingModule}>
              {enablingModule ? "Enabling…" : "Enable Reports Module"}
            </Button>
          ) : (
            <p className="text-sm text-gray-500">Contact your administrator to enable this module.</p>
          )}
        </div>
      </ReportsPageShell>
    );
  }

  if (loading) {
    return (
      <ReportsPageShell title="Reports" subtitle={subtitle} showBack={false}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </ReportsPageShell>
    );
  }

  return (
    <ReportsPageShell title="Reports" subtitle={subtitle} showBack={false}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className={`${reportsCardClass} p-4`}>
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

      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">All Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleReportCards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:border-[#22C55E]/30 hover:shadow-md transition-all group"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-lg ${card.color} group-hover:scale-105 transition-transform`}
                >
                  <card.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm">{card.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{card.desc}</p>
                  <span className="inline-flex items-center gap-1 text-xs text-[#22C55E] font-medium mt-2 group-hover:gap-1.5 transition-all">
                    View report
                    <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={`${reportsCardClass} p-5`}>
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Revenue vs Expenses</h3>
          {revenueExpenseChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={revenueExpenseChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => formatNPR(Number(v ?? 0))} />
                <Bar dataKey="amount" fill="#22C55E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-gray-400 text-sm">
              No financial data yet
            </div>
          )}
        </div>

        <div className={`${reportsCardClass} p-5`}>
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Revenue & Expense Breakdown</h3>
          {breakdownChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={breakdownChart}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  dataKey="value"
                  paddingAngle={3}
                >
                  {breakdownChart.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatNPR(Number(v ?? 0))} />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-gray-400 text-sm">
              No breakdown data yet
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {showInventoryAlerts && (
          <div className={reportsTableWrapClass}>
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Low Stock Alerts
              </h3>
              <Link
                href="/dashboard/reports/inventory"
                className="text-xs text-[#22C55E] hover:text-[#16A34A] font-medium inline-flex items-center gap-1"
              >
                View report
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {lowStockItems.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">
                All products are adequately stocked
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {["Product", "Stock", "Reorder Level", "Status"].map((h) => (
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
                  {lowStockItems.slice(0, 5).map((item) => (
                    <tr key={item.product_id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-900">{item.product_name}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {item.current_stock} {item.unit}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{item.reorder_level}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            item.urgency === "critical"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {item.urgency === "critical" ? "Critical" : "Low"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {showConstructionAlerts && (
          <div className={reportsTableWrapClass}>
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <HardHat className="h-4 w-4 text-orange-500" />
                Construction Budget Alerts
              </h3>
              <Link
                href="/dashboard/construction/reports"
                className="text-xs text-[#22C55E] hover:text-[#16A34A] font-medium inline-flex items-center gap-1"
              >
                View report
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {budgetAlerts.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">
                No budget alerts at this time
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {["Site", "Budget Used", "Remaining", "Alert"].map((h) => (
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
                  {budgetAlerts.slice(0, 5).map((site) => (
                    <tr key={site.site_id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-900">{site.site_name}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {site.budget_utilization_percentage.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {formatNPR(site.remaining_budget)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            site.alert_level === "critical"
                              ? "bg-red-100 text-red-700"
                              : site.alert_level === "high"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {site.alert_level.charAt(0).toUpperCase() + site.alert_level.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </ReportsPageShell>
  );
}
