"use client";

import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, ShoppingCart, Package, DollarSign, FileText, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashHeader } from "@/components/dashboard/dash-header";
import { SummaryCards } from "@/components/reports/SummaryCards";
import { monthlyRevenueExpense, businessKPIs } from "@/lib/mock-data/reports";

export default function ReportsPage() {
  const stats = [
    { label: "Total Revenue", value: "Rs. 24,85,200", change: 12 },
    { label: "Total Expenses", value: "Rs. 13,10,000", change: 8 },
    { label: "Net Profit", value: "Rs. 11,75,200", change: 15, color: "green" as const },
    { label: "Tax Liability", value: "Rs. 1,30,000", change: -5, color: "red" as const },
  ];

  const reportCards = [
    { icon: TrendingUp, title: "Sales Report", desc: "Sales performance and trends", href: "/dashboard/reports/sales" },
    { icon: ShoppingCart, title: "Purchase Report", desc: "Purchase history and analysis", href: "/dashboard/reports/purchase" },
    { icon: Package, title: "Inventory Report", desc: "Stock levels and valuation", href: "/dashboard/reports/inventory" },
    { icon: DollarSign, title: "Financial Report", desc: "P&L, Balance Sheet, Trial Balance", href: "/dashboard/reports/financial" },
    { icon: FileText, title: "Tax Report", desc: "VAT, TDS and tax summaries", href: "/dashboard/reports/tax" },
    { icon: Settings, title: "Custom Reports", desc: "Build your own report", href: "/dashboard/reports/custom" },
  ];

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Reports" subtitle="Business analytics and insights" />
      <div className="flex-1 p-6 space-y-6">
        {/* Stats */}
        <SummaryCards cards={stats} />

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportCards.map((card) => (
            <Link key={card.title} href={card.href}>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer h-full">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <card.icon className="h-6 w-6 text-[#22C55E]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{card.title}</h3>
                    <p className="text-sm text-gray-600">{card.desc}</p>
                  </div>
                </div>
                <Button className="w-full bg-[#22C55E] hover:bg-[#16A34A] text-white h-8 text-sm">
                  View Report
                </Button>
              </div>
            </Link>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Revenue vs Expense (Last 6 Months)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyRevenueExpense}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: any) => `Rs. ${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="revenue" fill="#22C55E" radius={[8, 8, 0, 0]} />
                <Bar dataKey="expense" fill="#EF4444" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Business KPIs</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-gray-600">Gross Profit Margin</span>
                  <span className="text-sm font-bold text-gray-900">{businessKPIs.grossProfitMargin}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-[#22C55E] h-2 rounded-full" style={{ width: `${businessKPIs.grossProfitMargin}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-gray-600">Net Profit Margin</span>
                  <span className="text-sm font-bold text-gray-900">{businessKPIs.netProfitMargin}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-[#22C55E] h-2 rounded-full" style={{ width: `${businessKPIs.netProfitMargin}%` }} />
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-600 mb-1">Current Ratio</p>
                <p className="text-2xl font-bold text-gray-900">{businessKPIs.currentRatio}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Inventory Turnover</p>
                <p className="text-2xl font-bold text-gray-900">{businessKPIs.inventoryTurnover}x</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Downloads */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Recent Report Downloads</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Report Name", "Generated By", "Date", "Action"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[
                { name: "Sales Report - Poush 2081", by: "Admin", date: "2082-01-10" },
                { name: "Purchase Report - Mangsir 2081", by: "Manager", date: "2082-01-08" },
                { name: "Inventory Report - Jan 2082", by: "Admin", date: "2082-01-05" },
              ].map((item) => (
                <tr key={item.name} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                  <td className="px-4 py-3 text-gray-600">{item.by}</td>
                  <td className="px-4 py-3 text-gray-600">{item.date}</td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm" className="text-[#22C55E] hover:bg-green-50">
                      Download
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
