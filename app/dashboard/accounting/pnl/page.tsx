"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashHeader } from "@/components/dashboard/dash-header";
import { mockChartOfAccounts } from "@/lib/mock-data/accounting";

export default function ProfitLossPage() {
  const revenue = mockChartOfAccounts.filter((a) => a.type === "Income").reduce((s, a) => s + a.balance, 0);
  const cogs = mockChartOfAccounts.find((a) => a.code === "5100")?.balance ?? 0;
  const grossProfit = revenue - cogs;
  const opExpenses = mockChartOfAccounts.filter((a) => a.type === "Expense" && a.code !== "5100").reduce((s, a) => s + a.balance, 0);
  const netProfit = grossProfit - opExpenses;

  const fmt = (n: number) => `Rs. ${n.toLocaleString()}`;

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Profit & Loss" subtitle="Income statement for FY 2082" />
      <div className="flex-1 p-6 space-y-4">
        <div className="flex justify-end">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-gray-600 border-gray-200">
            <Download className="h-3.5 w-3.5" /> Export PDF
          </Button>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm max-w-2xl">
          <div className="px-6 py-5 border-b border-gray-100 text-center">
            <p className="font-bold text-gray-800">FashionNep Pvt. Ltd.</p>
            <p className="text-sm text-gray-500">Profit & Loss Statement — FY 2082</p>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Revenue</p>
              {mockChartOfAccounts.filter((a) => a.type === "Income" && a.level > 0).map((a) => (
                <div key={a.id} className="flex justify-between py-1.5 text-sm">
                  <span className="text-gray-700">{a.name}</span>
                  <span className="font-medium text-gray-800">{fmt(a.balance)}</span>
                </div>
              ))}
              <div className="flex justify-between py-2 border-t border-gray-100 font-semibold text-sm mt-1">
                <span>Total Revenue</span><span className="text-[#22C55E]">{fmt(revenue)}</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Cost of Goods Sold</p>
              <div className="flex justify-between py-1.5 text-sm">
                <span className="text-gray-700">Cost of Goods Sold</span>
                <span className="font-medium text-red-500">({fmt(cogs)})</span>
              </div>
              <div className="flex justify-between py-2 border-t border-gray-100 font-semibold text-sm mt-1">
                <span>Gross Profit</span><span className="text-[#22C55E]">{fmt(grossProfit)}</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Operating Expenses</p>
              {mockChartOfAccounts.filter((a) => a.type === "Expense" && a.code !== "5100" && a.level > 1).map((a) => (
                <div key={a.id} className="flex justify-between py-1.5 text-sm">
                  <span className="text-gray-700">{a.name}</span>
                  <span className="font-medium text-red-500">({fmt(a.balance)})</span>
                </div>
              ))}
              <div className="flex justify-between py-2 border-t border-gray-100 font-semibold text-sm mt-1">
                <span>Total Expenses</span><span className="text-red-500">({fmt(opExpenses)})</span>
              </div>
            </div>

            <div className="flex justify-between py-3 border-t-2 border-gray-200 font-bold text-base">
              <span>Net Profit</span>
              <span className={netProfit >= 0 ? "text-[#22C55E]" : "text-red-500"}>{fmt(netProfit)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
