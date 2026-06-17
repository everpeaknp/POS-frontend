"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Loader2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { DashHeader } from "@/components/dashboard/dash-header";
import { accountsAPI, journalEntriesAPI } from "@/lib/api/accounting";

const fmt = (n: number) => `Rs. ${n.toLocaleString("en-IN")}`;
const COLORS = ["#22C55E", "#86EFAC", "#4ADE80", "#16A34A", "#15803D"];

export default function AccountingDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch data from multiple endpoints
      const [accounts, journalEntries, profitLoss, balanceSheet] = await Promise.all([
        accountsAPI.list().catch(() => []),
        journalEntriesAPI.list({ ordering: '-date' }).catch(() => []),
        accountsAPI.profitLoss().catch(() => null),
        accountsAPI.balanceSheet().catch(() => null),
      ]);

      const accountsData = Array.isArray(accounts) ? accounts : (accounts as any).results || [];
      const journalData = Array.isArray(journalEntries) ? journalEntries : (journalEntries as any).results || [];

      // Calculate totals
      const totalAssets = balanceSheet?.assets?.total || 0;
      const totalLiabilities = balanceSheet?.liabilities?.total || 0;
      const netProfit = profitLoss?.net_profit || 0;

      // Find specific accounts
      const cashAccount = accountsData.find((a: any) => a.sub_type === 'Cash');
      const bankAccounts = accountsData.filter((a: any) => a.sub_type === 'Bank');
      const cashBank = (cashAccount?.balance || 0) + bankAccounts.reduce((sum: number, acc: any) => sum + (acc.balance || 0), 0);

      const arAccount = accountsData.find((a: any) => a.sub_type === 'Receivable');
      const apAccount = accountsData.find((a: any) => a.sub_type === 'Payable');
      const taxAccount = accountsData.find((a: any) => a.sub_type === 'Tax' && a.type === 'Liabilities');

      setDashboardData({
        totalAssets,
        totalLiabilities,
        netProfit,
        cashBank,
        ar: arAccount?.balance || 0,
        ap: apAccount?.balance || 0,
        vatPayable: taxAccount?.balance || 0,
        recentJournalEntries: journalData.slice(0, 5),
        profitLoss,
      });
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error);
      setError('Failed to load dashboard data');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Accounting" subtitle="Loading..." />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#22C55E] mx-auto mb-2" />
            <p className="text-sm text-gray-500">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Accounting" subtitle="Error" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-4">{error || 'Failed to load dashboard'}</p>
            <Button onClick={fetchDashboardData} size="sm" className="bg-[#22C55E] hover:bg-[#16A34A] text-white">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { totalAssets, totalLiabilities, netProfit, cashBank, ar, ap, vatPayable, recentJournalEntries } = dashboardData;

  // Mock data for charts (will be replaced with real data later)
  const monthlyIncomeExpense = [
    { month: "Shrawan", income: 450000, expense: 280000 },
    { month: "Bhadra", income: 520000, expense: 310000 },
    { month: "Ashwin", income: 480000, expense: 295000 },
    { month: "Kartik", income: 550000, expense: 320000 },
    { month: "Mangsir", income: 590000, expense: 340000 },
    { month: "Poush", income: 620000, expense: 350000 },
  ];

  const expenseBreakdown = [
    { name: "Salaries", value: 120000 },
    { name: "Rent", value: 45000 },
    { name: "Utilities", value: 25000 },
    { name: "Marketing", value: 35000 },
    { name: "Others", value: 55000 },
  ];

  const upcomingPayments = [
    { id: "INV-0002", customer: "Sita Thapa", amount: 18000, due: "2082-01-24", type: "Receivable" },
    { id: "PINV-0003", supplier: "XYZ Traders", amount: 45000, due: "2082-01-25", type: "Payable" },
    { id: "INV-0004", customer: "Gita Rai", amount: 9600, due: "2082-01-22", type: "Receivable" },
  ];

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Accounting" subtitle="Financial overview" />
      <div className="flex-1 p-6 space-y-5">

        {/* Top stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Assets", value: fmt(totalAssets), sub: "All asset accounts" },
            { label: "Total Liabilities", value: fmt(totalLiabilities), sub: "All liability accounts" },
            { label: "Net Profit This Month", value: fmt(netProfit), sub: "+12% vs last month", green: true },
            { label: "Cash & Bank Balance", value: fmt(cashBank), sub: "Cash + bank accounts" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{s.value}</p>
              <p className={`text-xs mt-0.5 ${s.green ? "text-[#22C55E]" : "text-gray-400"}`}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* AR / AP / VAT */}
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

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Income vs Expense (Last 6 Months)</h3>
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
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Expense Breakdown</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={expenseBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`} labelLine={false}>
                  {expenseBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => [`Rs. ${Number(v).toLocaleString("en-IN")}`]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent JEs + Upcoming payments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Recent Journal Entries</h3>
              <Link href="/dashboard/accounting/journal-entries" className="text-xs text-[#22C55E] hover:underline">View all</Link>
            </div>
            {recentJournalEntries.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-gray-500">No journal entries yet</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["Entry #", "Date", "Description", "Amount", "Status"].map((h) => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentJournalEntries.map((je: any) => (
                    <tr key={je.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-2.5">
                        <Link href={`/dashboard/accounting/journal-entries/${je.id}`} className="text-[#22C55E] font-mono text-xs hover:underline">{je.entry_number}</Link>
                      </td>
                      <td className="px-4 py-2.5 text-gray-500 text-xs">{new Date(je.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td className="px-4 py-2.5 text-gray-700 text-xs truncate max-w-[140px]">{je.description}</td>
                      <td className="px-4 py-2.5 text-gray-800 text-xs">Rs. {je.total_debit.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-2.5">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${je.status === "posted" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                          {je.status === "posted" ? "Posted" : je.status === "draft" ? "Draft" : "Reversed"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">Upcoming Payments (Next 7 Days)</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {upcomingPayments.map((p) => (
                <div key={p.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{p.id}</p>
                    <p className="text-xs text-gray-500">{p.type === "Receivable" ? p.customer : p.supplier} · Due {p.due}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${p.type === "Receivable" ? "text-[#22C55E]" : "text-red-500"}`}>
                      {p.type === "Receivable" ? "+" : "-"} Rs. {p.amount.toLocaleString("en-IN")}
                    </p>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${p.type === "Receivable" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>{p.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
