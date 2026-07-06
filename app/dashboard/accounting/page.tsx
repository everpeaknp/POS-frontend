"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import toast from "react-hot-toast";
import { AccountingPageShell } from "@/components/dashboard/AccountingPageShell";
import { accountsAPI, journalEntriesAPI } from "@/lib/api/accounting";
import { FormattedDate } from "@/components/shared/FormattedDate";

const fmt = (n: number) => `Rs. ${n.toLocaleString("en-IN")}`;
const COLORS = ["#22C55E", "#86EFAC", "#4ADE80", "#16A34A", "#15803D", "#F59E0B", "#60A5FA"];

export default function AccountingDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<{
    totalAssets: number;
    totalLiabilities: number;
    netProfit: number;
    cashBank: number;
    ar: number;
    ap: number;
    vatPayable: number;
    recentJournalEntries: Awaited<ReturnType<typeof journalEntriesAPI.list>>;
    expenseBreakdown: { name: string; value: number }[];
    incomeTotal: number;
    expenseTotal: number;
  } | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const today = new Date();
      const fromDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
      const toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split("T")[0];

      const [accounts, journalEntries, profitLoss, balanceSheet] = await Promise.all([
        accountsAPI.list(),
        journalEntriesAPI.list({ ordering: "-date" }),
        accountsAPI.profitLoss({ from_date: fromDate, to_date: toDate }),
        accountsAPI.balanceSheet(),
      ]);

      const totalAssets = balanceSheet?.assets?.total || 0;
      const totalLiabilities = balanceSheet?.liabilities?.total || 0;
      const netProfit = profitLoss?.net_profit || 0;

      const cashAccount = accounts.find((a) => a.sub_type === "Cash");
      const bankAccounts = accounts.filter((a) => a.sub_type === "Bank");
      const cashBank =
        (cashAccount?.balance || 0) + bankAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

      const arAccount = accounts.find((a) => a.sub_type === "Receivable");
      const apAccount = accounts.find((a) => a.sub_type === "Payable");
      const taxAccount = accounts.find((a) => a.sub_type === "Tax" && a.type === "Liabilities");

      const expenseBreakdown = (profitLoss?.expenses?.accounts || [])
        .filter((a) => a.amount > 0)
        .map((a) => ({ name: a.name, value: a.amount }));

      setDashboardData({
        totalAssets,
        totalLiabilities,
        netProfit,
        cashBank,
        ar: arAccount?.balance || 0,
        ap: apAccount?.balance || 0,
        vatPayable: taxAccount?.balance || 0,
        recentJournalEntries: journalEntries.slice(0, 5),
        expenseBreakdown,
        incomeTotal: profitLoss?.income?.total || 0,
        expenseTotal: profitLoss?.expenses?.total || 0,
      });
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      setError("Failed to load dashboard data. Ensure you have selected an organization with accounting data.");
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AccountingPageShell
        title="Accounting"
        subtitle="Financial overview"
        loading
        loadingMessage="Loading dashboard…"
      />
    );
  }

  if (error || !dashboardData) {
    return (
      <AccountingPageShell
        title="Accounting"
        subtitle="Error"
        error={error || "Failed to load dashboard"}
        onRetry={fetchDashboardData}
      />
    );
  }

  const {
    totalAssets,
    totalLiabilities,
    netProfit,
    cashBank,
    ar,
    ap,
    vatPayable,
    recentJournalEntries,
    expenseBreakdown,
    incomeTotal,
    expenseTotal,
  } = dashboardData;

  const monthlyIncomeExpense = [
    { month: "This Month", income: incomeTotal, expense: expenseTotal },
  ];

  return (
    <AccountingPageShell title="Accounting" subtitle="Financial overview">
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Assets", value: fmt(totalAssets), sub: "All asset accounts" },
            { label: "Total Liabilities", value: fmt(totalLiabilities), sub: "All liability accounts" },
            {
              label: "Net Profit This Month",
              value: fmt(netProfit),
              sub: netProfit >= 0 ? "Profitable period" : "Loss this period",
              green: netProfit >= 0,
            },
            { label: "Cash & Bank Balance", value: fmt(cashBank), sub: "Cash + bank accounts" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{s.value}</p>
              <p className={`text-xs mt-0.5 ${s.green ? "text-[#22C55E]" : "text-gray-400"}`}>{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Accounts Receivable", value: fmt(ar), sub: "Outstanding from customers", href: "/dashboard/accounting/chart-of-accounts" },
            { label: "Accounts Payable", value: fmt(ap), sub: "Outstanding to suppliers", href: "/dashboard/accounting/chart-of-accounts" },
            { label: "VAT Payable", value: fmt(vatPayable), sub: "Net VAT to IRD", href: "/dashboard/accounting/tax-management" },
          ].map((s) => (
            <Link key={s.label} href={s.href} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:border-[#22C55E]/30 transition-colors">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Income vs Expense (This Month)</h3>
            {incomeTotal === 0 && expenseTotal === 0 ? (
              <p className="text-sm text-gray-400 text-center py-16">No posted transactions this month yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={monthlyIncomeExpense}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => [`Rs. ${Number(v).toLocaleString("en-IN")}`]} />
                  <Legend />
                  <Bar dataKey="income" name="Income" fill="#22C55E" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Expense" fill="#FCA5A5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Expense Breakdown (This Month)</h3>
            {expenseBreakdown.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-16">No expenses recorded this month.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={expenseBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {expenseBreakdown.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`Rs. ${Number(v).toLocaleString("en-IN")}`]} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Recent Journal Entries</h3>
            <Link href="/dashboard/accounting/journal-entries" className="text-xs text-[#22C55E] hover:underline">
              View all
            </Link>
          </div>
          {recentJournalEntries.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-gray-500">No journal entries yet</p>
              <Link href="/dashboard/accounting/journal-entries/new" className="text-xs text-[#22C55E] hover:underline mt-2 inline-block">
                Create first entry
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Entry #", "Date", "Description", "Amount", "Status"].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentJournalEntries.map((je) => (
                  <tr key={je.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-2.5">
                      <Link href={`/dashboard/accounting/journal-entries/${je.id}`} className="text-[#22C55E] font-mono text-xs hover:underline">
                        {je.entry_number}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">
                      <FormattedDate value={je.date} />
                    </td>
                    <td className="px-4 py-2.5 text-gray-700 text-xs truncate max-w-[140px]">{je.description}</td>
                    <td className="px-4 py-2.5 text-gray-800 text-xs">Rs. {je.total_debit.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                          je.status === "posted" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {je.status === "posted" ? "Posted" : je.status === "draft" ? "Draft" : "Reversed"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AccountingPageShell>
  );
}
