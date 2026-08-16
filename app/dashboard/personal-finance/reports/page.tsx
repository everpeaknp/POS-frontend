"use client";

import { useMemo } from "react";
import { TrendingUp, TrendingDown, Wallet, BarChart3 } from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
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
import { useAuth } from "@/lib/context/AuthContext";
import { formatCurrency } from "@/lib/utils";

// MOCK DATA - Pulls from same structure as Transactions, Category, and Account pages
// TODO: Replace with real backend API calls when endpoints are ready

type CategoryType = "income" | "expense";

interface Category {
  id: string;
  name: string;
  type: CategoryType;
}

interface Transaction {
  id: string;
  date: string;
  type: CategoryType;
  amount: number;
  categoryId: string;
  accountId: string;
  description: string;
}

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
}

// Mock categories - matches Category page exactly
const MOCK_CATEGORIES: Category[] = [
  { id: "cat_1", name: "Salary", type: "income" },
  { id: "cat_2", name: "Freelance", type: "income" },
  { id: "cat_3", name: "Investment Returns", type: "income" },
  { id: "cat_4", name: "Other Income", type: "income" },
  { id: "cat_5", name: "Groceries", type: "expense" },
  { id: "cat_6", name: "Rent", type: "expense" },
  { id: "cat_7", name: "Utilities", type: "expense" },
  { id: "cat_8", name: "Dining", type: "expense" },
  { id: "cat_9", name: "Entertainment", type: "expense" },
  { id: "cat_10", name: "Transportation", type: "expense" },
  { id: "cat_11", name: "Health", type: "expense" },
  { id: "cat_12", name: "Shopping", type: "expense" },
  { id: "cat_13", name: "Education", type: "expense" },
  { id: "cat_14", name: "Other Expenses", type: "expense" },
];

// Mock transactions - matches Transactions page (extended with more data for trends)
const MOCK_TRANSACTIONS: Transaction[] = [
  // August 2026
  { id: "txn_1", date: "2026-08-01", type: "income", amount: 85000, categoryId: "cat_1", accountId: "acc_1", description: "Monthly salary" },
  { id: "txn_2", date: "2026-08-02", type: "expense", amount: 18000, categoryId: "cat_6", accountId: "acc_1", description: "Monthly rent" },
  { id: "txn_3", date: "2026-08-05", type: "expense", amount: 4500, categoryId: "cat_5", accountId: "acc_3", description: "Groceries" },
  { id: "txn_4", date: "2026-08-07", type: "expense", amount: 2200, categoryId: "cat_8", accountId: "acc_4", description: "Dining" },
  { id: "txn_5", date: "2026-08-10", type: "income", amount: 15000, categoryId: "cat_2", accountId: "acc_2", description: "Freelance" },
  { id: "txn_6", date: "2026-08-12", type: "expense", amount: 3500, categoryId: "cat_10", accountId: "acc_1", description: "Transportation" },
  { id: "txn_7", date: "2026-08-15", type: "expense", amount: 2500, categoryId: "cat_7", accountId: "acc_1", description: "Utilities" },
  { id: "txn_8", date: "2026-08-20", type: "expense", amount: 5000, categoryId: "cat_12", accountId: "acc_4", description: "Shopping" },
  
  // July 2026
  { id: "txn_9", date: "2026-07-01", type: "income", amount: 85000, categoryId: "cat_1", accountId: "acc_1", description: "Monthly salary" },
  { id: "txn_10", date: "2026-07-02", type: "expense", amount: 18000, categoryId: "cat_6", accountId: "acc_1", description: "Monthly rent" },
  { id: "txn_11", date: "2026-07-10", type: "expense", amount: 8000, categoryId: "cat_5", accountId: "acc_3", description: "Groceries" },
  { id: "txn_12", date: "2026-07-15", type: "expense", amount: 3000, categoryId: "cat_8", accountId: "acc_4", description: "Dining" },
  { id: "txn_13", date: "2026-07-20", type: "expense", amount: 4000, categoryId: "cat_10", accountId: "acc_1", description: "Transportation" },
  
  // June 2026
  { id: "txn_14", date: "2026-06-01", type: "income", amount: 85000, categoryId: "cat_1", accountId: "acc_1", description: "Monthly salary" },
  { id: "txn_15", date: "2026-06-02", type: "expense", amount: 18000, categoryId: "cat_6", accountId: "acc_1", description: "Monthly rent" },
  { id: "txn_16", date: "2026-06-05", type: "income", amount: 20000, categoryId: "cat_2", accountId: "acc_2", description: "Freelance" },
  { id: "txn_17", date: "2026-06-10", type: "expense", amount: 7000, categoryId: "cat_5", accountId: "acc_3", description: "Groceries" },
  { id: "txn_18", date: "2026-06-15", type: "expense", amount: 4000, categoryId: "cat_9", accountId: "acc_4", description: "Entertainment" },
];

// Mock accounts - matches Account page
const MOCK_ACCOUNTS: Account[] = [
  { id: "acc_1", name: "Checking Account", type: "bank", balance: 125000 },
  { id: "acc_2", name: "Savings Account", type: "bank", balance: 350000 },
  { id: "acc_3", name: "Cash Wallet", type: "cash", balance: 15000 },
  { id: "acc_4", name: "Credit Card", type: "credit_card", balance: -25000 },
  { id: "acc_5", name: "Investment Account", type: "investment", balance: 500000 },
  { id: "acc_6", name: "Personal Loan", type: "loan", balance: -180000 },
];

const CHART_COLORS = {
  income: "#22C55E",
  expense: "#EF4444",
  primary: "#3B82F6",
  categories: [
    "#22C55E", "#3B82F6", "#F59E0B", "#8B5CF6", "#EC4899",
    "#14B8A6", "#F97316", "#06B6D4", "#84CC16", "#6366F1",
  ],
};

export default function ReportsPage() {
  const { user } = useAuth();

  const workspaceName = user?.tenant?.workspace_name || user?.tenant?.name || "Workspace";
  const subtitle = `${workspaceName} · Financial reports and analytics`;

  // Monthly Income vs Expense Trend
  const monthlyTrend = useMemo(() => {
    const months: Record<string, { income: number; expense: number }> = {};

    MOCK_TRANSACTIONS.forEach((t) => {
      const month = t.date.substring(0, 7); // YYYY-MM
      if (!months[month]) {
        months[month] = { income: 0, expense: 0 };
      }
      if (t.type === "income") {
        months[month].income += t.amount;
      } else {
        months[month].expense += t.amount;
      }
    });

    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        income: data.income,
        expense: data.expense,
        net: data.income - data.expense,
      }));
  }, []);

  // Category Spending Breakdown (Expenses only)
  const categoryBreakdown = useMemo(() => {
    const spending: Record<string, number> = {};

    MOCK_TRANSACTIONS.filter((t) => t.type === "expense").forEach((t) => {
      spending[t.categoryId] = (spending[t.categoryId] || 0) + t.amount;
    });

    return Object.entries(spending)
      .map(([categoryId, amount]) => ({
        category: MOCK_CATEGORIES.find((c) => c.id === categoryId)?.name || "Unknown",
        amount,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, []);

  // Net Worth Over Time (simplified - using current account balances as snapshot)
  const netWorthData = useMemo(() => {
    // Calculate net worth from accounts
    const assets = MOCK_ACCOUNTS.filter((a) => a.balance >= 0).reduce((sum, a) => sum + a.balance, 0);
    const liabilities = Math.abs(MOCK_ACCOUNTS.filter((a) => a.balance < 0).reduce((sum, a) => sum + a.balance, 0));
    const currentNetWorth = assets - liabilities;

    // Simulate historical data (in real app, this would come from historical snapshots)
    return [
      { month: "Jun 2026", netWorth: currentNetWorth - 50000 },
      { month: "Jul 2026", netWorth: currentNetWorth - 20000 },
      { month: "Aug 2026", netWorth: currentNetWorth },
    ];
  }, []);

  // Summary Stats
  const summary = useMemo(() => {
    const totalIncome = MOCK_TRANSACTIONS.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = MOCK_TRANSACTIONS.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
    const netSavings = totalIncome - totalExpense;
    
    const assets = MOCK_ACCOUNTS.filter((a) => a.balance >= 0).reduce((sum, a) => sum + a.balance, 0);
    const liabilities = Math.abs(MOCK_ACCOUNTS.filter((a) => a.balance < 0).reduce((sum, a) => sum + a.balance, 0));
    const netWorth = assets - liabilities;

    return { totalIncome, totalExpense, netSavings, netWorth };
  }, []);

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Reports & Analytics" subtitle={subtitle} />

      <div className="flex-1 p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Income</p>
                <p className="text-2xl font-bold text-[#22C55E]">{formatCurrency(summary.totalIncome)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-[#22C55E]" />
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Expense</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalExpense)}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Net Savings</p>
                <p className={`text-2xl font-bold ${summary.netSavings >= 0 ? "text-[#22C55E]" : "text-red-600"}`}>
                  {formatCurrency(summary.netSavings)}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Net Worth</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary.netWorth)}</p>
              </div>
              <Wallet className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Income vs Expense Trend */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Income vs Expense Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyTrend}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.income} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS.income} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.expense} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS.expense} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} iconType="circle" />
              <Area type="monotone" dataKey="income" stroke={CHART_COLORS.income} fillOpacity={1} fill="url(#colorIncome)" name="Income" />
              <Area type="monotone" dataKey="expense" stroke={CHART_COLORS.expense} fillOpacity={1} fill="url(#colorExpense)" name="Expense" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Spending Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Spending by Category</h2>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percent }) => `${category} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS.categories[index % CHART_COLORS.categories.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Expense Categories</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryBreakdown.slice(0, 5)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
                <YAxis dataKey="category" type="category" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} width={100} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Bar dataKey="amount" fill={CHART_COLORS.expense} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Net Worth Over Time */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Net Worth Over Time</h2>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={netWorthData}>
              <defs>
                <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Area type="monotone" dataKey="netWorth" stroke={CHART_COLORS.primary} fillOpacity={1} fill="url(#colorNetWorth)" name="Net Worth" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Info Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Reports are calculated from your transactions and account balances. All charts use mock data for demonstration. When connected to the backend, reports will update automatically based on your actual financial data.
          </p>
        </div>
      </div>
    </div>
  );
}
