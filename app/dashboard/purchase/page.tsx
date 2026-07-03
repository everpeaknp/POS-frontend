"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShoppingCart,
  Users,
  AlertCircle,
  FileText,
  ClipboardList,
  Receipt,
  ChevronRight,
  TrendingDown,
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
import { DashHeader } from "@/components/dashboard/dash-header";
import { StatusBadge } from "@/components/purchase/StatusBadge";
import { SkeletonCard } from "@/components/shared/Skeleton";
import { useAuth } from "@/lib/context/AuthContext";
import {
  purchaseOrdersAPI,
  purchaseInvoicesAPI,
  suppliersAPI,
  PurchaseOrder,
  PurchaseInvoice,
  Supplier,
} from "@/lib/api/purchase";
import { formatNPR } from "@/lib/utils";
import toast from "react-hot-toast";

const COLORS = ["#22C55E", "#3B82F6", "#F59E0B", "#8B5CF6", "#EF4444", "#6B7280"];

const quickActions = [
  {
    href: "/dashboard/purchase/orders/new",
    label: "New Purchase Order",
    sub: "Create PO",
    icon: ShoppingCart,
    color: "bg-blue-50 text-blue-600",
  },
  {
    href: "/dashboard/purchase/requests/new",
    label: "New Request",
    sub: "Request materials",
    icon: ClipboardList,
    color: "bg-green-50 text-[#22C55E]",
  },
  {
    href: "/dashboard/purchase/suppliers/new",
    label: "New Supplier",
    sub: "Add vendor",
    icon: Users,
    color: "bg-purple-50 text-purple-600",
  },
  {
    href: "/dashboard/purchase/invoices/new",
    label: "New Invoice",
    sub: "Record bill",
    icon: Receipt,
    color: "bg-orange-50 text-orange-600",
  },
];

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parseAmount(value: string | number | undefined): number {
  if (value === undefined || value === null) return 0;
  const n = typeof value === "string" ? parseFloat(value) : value;
  return Number.isFinite(n) ? n : 0;
}

export default function PurchaseDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  const workspaceName =
    user?.tenant?.workspace_name || user?.tenant?.name || "Workspace";
  const subtitle = `${workspaceName} · Purchase overview and analytics`;

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [ordersData, invoicesData, suppliersData] = await Promise.all([
        purchaseOrdersAPI.list(),
        purchaseInvoicesAPI.list(),
        suppliersAPI.list(),
      ]);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setInvoices(Array.isArray(invoicesData) ? invoicesData : []);
      setSuppliers(Array.isArray(suppliersData) ? suppliersData : []);
    } catch (error) {
      console.error("Failed to fetch purchase dashboard data:", error);
      toast.error("Failed to load purchase overview");
    } finally {
      setLoading(false);
    }
  };

  const totalPurchases = useMemo(
    () => invoices.reduce((sum, inv) => sum + (inv.total_amount ?? 0), 0),
    [invoices]
  );

  const outstandingPayables = useMemo(
    () => invoices.reduce((sum, inv) => sum + (inv.balance ?? 0), 0),
    [invoices]
  );

  const overdueInvoices = useMemo(
    () => invoices.filter((inv) => inv.status === "Overdue").length,
    [invoices]
  );

  const activeSuppliers = useMemo(
    () => suppliers.filter((s) => s.status === "active").length,
    [suppliers]
  );

  const monthlyPurchases = useMemo(() => {
    const buckets = MONTH_LABELS.map((month) => ({ month, purchases: 0 }));
    const year = new Date().getFullYear();
    invoices.forEach((inv) => {
      const d = new Date(inv.date);
      if (d.getFullYear() === year) {
        buckets[d.getMonth()].purchases += inv.total_amount ?? 0;
      }
    });
    return buckets;
  }, [invoices]);

  const ordersByStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach((o) => {
      counts[o.status] = (counts[o.status] ?? 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [orders]);

  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5),
    [orders]
  );

  const topSuppliers = useMemo(
    () =>
      [...suppliers]
        .sort((a, b) => (b.total_purchases ?? 0) - (a.total_purchases ?? 0))
        .slice(0, 5),
    [suppliers]
  );

  const statCards = [
    {
      label: "Total Purchases",
      value: formatNPR(totalPurchases),
      sub: `${invoices.length} invoice${invoices.length !== 1 ? "s" : ""}`,
      icon: TrendingDown,
      color: "text-green-600 bg-green-50",
    },
    {
      label: "Purchase Orders",
      value: orders.length.toString(),
      sub: `${orders.filter((o) => o.status !== "Cancelled").length} active`,
      icon: ShoppingCart,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Total Suppliers",
      value: suppliers.length.toString(),
      sub: `${activeSuppliers} active`,
      icon: Users,
      color: "text-purple-600 bg-purple-50",
    },
    {
      label: "Outstanding Payables",
      value: formatNPR(outstandingPayables),
      sub:
        overdueInvoices > 0
          ? `${overdueInvoices} overdue`
          : `${invoices.filter((i) => (i.balance ?? 0) > 0).length} unpaid`,
      icon: AlertCircle,
      color: "text-red-600 bg-red-50",
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Purchase" subtitle={subtitle} />
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

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Purchase" subtitle={subtitle} />
      <div className="flex-1 p-6 space-y-6">
        {/* Stats */}
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
              <p
                className={`text-xs mt-0.5 ${
                  s.label === "Outstanding Payables" && overdueInvoices > 0
                    ? "text-red-500"
                    : "text-gray-400"
                }`}
              >
                {s.sub}
              </p>
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

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly Purchases</h3>
            {invoices.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyPurchases}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip formatter={(v) => formatNPR(Number(v ?? 0))} />
                  <Bar dataKey="purchases" name="Purchases" fill="#22C55E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">
                No purchase invoices yet
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Orders by Status</h3>
            {ordersByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={ordersByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {ordersByStatus.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">
                No purchase orders yet
              </div>
            )}
          </div>
        </div>

        {/* Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">Recent Purchase Orders</h3>
              <Link
                href="/dashboard/purchase/orders"
                className="text-xs text-[#22C55E] hover:text-[#16A34A] font-medium inline-flex items-center gap-1"
              >
                View all
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">
                <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                No purchase orders yet
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {["PO #", "Supplier", "Total", "Status"].map((h) => (
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
                      onClick={() => router.push(`/dashboard/purchase/orders/${o.id}`)}
                    >
                      <td className="px-4 py-3 font-medium text-[#22C55E]">{o.po_number}</td>
                      <td className="px-4 py-3 text-gray-700">{o.supplier_name}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {formatNPR(parseAmount(o.total))}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={o.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">Top Suppliers</h3>
              <Link
                href="/dashboard/purchase/suppliers"
                className="text-xs text-[#22C55E] hover:text-[#16A34A] font-medium inline-flex items-center gap-1"
              >
                View all
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {topSuppliers.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">
                <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                No suppliers yet
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {["Supplier", "Outstanding", "Total Purchased"].map((h) => (
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
                  {topSuppliers.map((s) => (
                    <tr
                      key={s.id}
                      className="hover:bg-gray-50/50 cursor-pointer"
                      onClick={() => router.push(`/dashboard/purchase/suppliers/${s.id}`)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#22C55E]/10 flex items-center justify-center text-xs font-bold text-[#22C55E]">
                            {s.name[0]}
                          </div>
                          <span className="font-medium text-gray-800 truncate max-w-[140px]">
                            {s.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {formatNPR(s.outstanding_balance ?? 0)}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {formatNPR(s.total_purchases ?? 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
