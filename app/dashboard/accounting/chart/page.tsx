"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashHeader } from "@/components/dashboard/dash-header";
import { mockChartOfAccounts } from "@/lib/mock-data/accounting";

const TYPES = ["All", "Assets", "Liabilities", "Equity", "Income", "Expense"];
const typeColors: Record<string, string> = {
  Assets: "bg-blue-100 text-blue-700",
  Liabilities: "bg-red-100 text-red-700",
  Equity: "bg-purple-100 text-purple-700",
  Income: "bg-green-100 text-green-700",
  Expense: "bg-orange-100 text-orange-700",
};

export default function ChartOfAccountsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  const filtered = mockChartOfAccounts.filter((a) =>
    (typeFilter === "All" || a.type === typeFilter) &&
    (a.name.toLowerCase().includes(search.toLowerCase()) || a.code.includes(search))
  );

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Chart of Accounts" subtitle="Manage your account structure" />
      <div className="flex-1 p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm border-gray-200" placeholder="Search accounts..." />
          </div>
          <div className="flex gap-1 flex-wrap">
            {TYPES.map((t) => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${typeFilter === t ? "bg-[#22C55E] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                {t}
              </button>
            ))}
          </div>
          <Button size="sm" className="h-9 bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5">
            <Plus className="h-4 w-4" /> Add Account
          </Button>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{["Code", "Account Name", "Type", "Normal Balance", "Balance"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50/50 cursor-pointer">
                  <td className="px-4 py-3 font-mono text-sm text-gray-500">{a.code}</td>
                  <td className="px-4 py-3 font-medium text-gray-800" style={{ paddingLeft: `${a.level * 20 + 16}px` }}>{a.name}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[a.type] || 'bg-gray-100 text-gray-700'}`}>{a.type}</span></td>
                  <td className="px-4 py-3 text-gray-600">{a.subType}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">Rs. {a.balance.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
