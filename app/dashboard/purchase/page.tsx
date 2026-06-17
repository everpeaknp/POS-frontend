"use client";

import { useRouter } from "next/navigation";
import { ShoppingCart, Users, TrendingDown, AlertCircle } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { DashHeader } from "@/components/dashboard/dash-header";
import { StatusBadge } from "@/components/purchase/StatusBadge";
import { mockPurchaseOrders, mockSuppliers, monthlyPurchases, purchaseByCategory } from "@/lib/mock-data/purchase";

const COLORS = ["#22C55E", "#86EFAC", "#4ADE80", "#16A34A", "#BBF7D0"];

const stats = [
  { label: "Total Purchases", value: "Rs. 43,50,000", change: "+9%", icon: TrendingDown, color: "text-green-600 bg-green-50" },
  { label: "Purchase Orders", value: "5", change: "+2 this month", icon: ShoppingCart, color: "text-blue-600 bg-blue-50" },
  { label: "Total Suppliers", value: "4", change: "2 active", icon: Users, color: "text-purple-600 bg-purple-50" },
  { label: "Outstanding Payables", value: "Rs. 1,95,000", change: "3 invoices", icon: AlertCircle, color: "text-red-600 bg-red-50" },
];

export default function PurchaseDashboardPage() {
  const router = useRouter();
  const recentOrders = mockPurchaseOrders.slice(0, 5);
  const topSuppliers = [...mockSuppliers].sort((a, b) => b.totalPurchased - a.totalPurchased).slice(0, 5);

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Purchase" subtitle="Purchase overview and analytics" />
      <div className="flex-1 p-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-500">{s.label}</p>
                <div className={`p-2 rounded-lg ${s.color}`}><s.icon className="h-4 w-4" /></div>
              </div>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-[#22C55E] mt-0.5">{s.change}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly Purchases</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyPurchases}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [`Rs. ${Number(v).toLocaleString()}`, "Purchases"]} />
                <Bar dataKey="purchases" fill="#22C55E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Purchases by Category</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={purchaseByCategory} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                  {purchaseByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v}%`, "Share"]} />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <h3 className="text-sm font-semibold text-gray-700">Recent Purchase Orders</h3>
              <button onClick={() => router.push("/dashboard/purchase/orders")} className="text-xs text-[#22C55E] hover:underline">View all</button>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr>
                {["PO #", "Supplier", "Total", "Status"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {recentOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50/50 cursor-pointer" onClick={() => router.push(`/dashboard/purchase/orders/${o.id}`)}>
                    <td className="px-4 py-3 font-medium text-[#22C55E]">{o.id}</td>
                    <td className="px-4 py-3 text-gray-700">{o.supplier}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">Rs. {o.total.toLocaleString()}</td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <h3 className="text-sm font-semibold text-gray-700">Top Suppliers</h3>
              <button onClick={() => router.push("/dashboard/purchase/suppliers")} className="text-xs text-[#22C55E] hover:underline">View all</button>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr>
                {["Supplier", "Orders", "Total Purchased"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {topSuppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/50 cursor-pointer" onClick={() => router.push(`/dashboard/purchase/suppliers/${s.id}`)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#22C55E]/10 flex items-center justify-center text-xs font-bold text-[#22C55E]">
                          {s.name[0]}
                        </div>
                        <span className="font-medium text-gray-800 truncate max-w-[140px]">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{s.totalOrders}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">Rs. {s.totalPurchased.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
