"use client";

import { useState, useEffect, useMemo } from "react";
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
import { useDateSystemStore } from "@/lib/stores/dateSystemStore";
import { 
  financeTransactionAPI, 
  financeCategoryAPI,
  financeAccountAPI,
  type FinanceTransaction,
  type FinanceCategory,
  type FinanceAccount
} from "@/lib/api/personal-finance";
import toast from "react-hot-toast";

type CategoryType = "income" | "expense";

interface Category {
  id: number;
  name: string;
  type: CategoryType;
}

interface Transaction {
  id: number;
  date: string;
  type: CategoryType;
  amount: number;
  category: number;
  account: number | null;
  description: string;
}

interface Account {
  id: number;
  name: string;
  type: string;
  balance: number;
}

const CHART_COLORS = {
  income: "#4A5D7A",
  expense: "#EF4444",
  primary: "#3B82F6",
  categories: [
    "#4A5D7A", "#3B82F6", "#F59E0B", "#8B5CF6", "#EC4899",
    "#14B8A6", "#F97316", "#06B6D4", "#84CC16", "#6366F1",
  ],
};

export default function ReportsPage() {
  const { user } = useAuth();
  const dateSystem = useDateSystemStore((state) => state.dateSystem);
  const formatDate = useDateSystemStore((state) => state.formatDate);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [txns, cats, accs] = await Promise.all([
          financeTransactionAPI.list(),
          financeCategoryAPI.list(),
          financeAccountAPI.list()
        ]);
        
        // Convert API data to local format
        setTransactions(txns.map(t => ({
          id: t.id,
          date: t.date,
          type: t.type as CategoryType,
          amount: parseFloat(t.amount),
          category: t.category,
          account: t.account,
          description: t.description
        })));
        
        setCategories(cats.map(c => ({
          id: c.id,
          name: c.name,
          type: c.type as CategoryType
        })));
        
        setAccounts(accs.map(a => ({
          id: a.id,
          name: a.name,
          type: a.type,
          balance: parseFloat(a.current_balance)
        })));
      } catch (error) {
        console.error("Error loading reports data:", error);
        toast.error("Failed to load reports data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const workspaceName = user?.tenant?.workspace_name || user?.tenant?.name || "Workspace";
  const subtitle = `${workspaceName} · Financial reports and analytics`;

  // Helper to format month/year based on date system
  const formatMonthYear = (dateString: string) => {
    // Format as YYYY-MM-01 to get the first day of the month
    const fullDate = dateString + "-01";
    // Use the store's formatDate which handles AD/BS conversion
    return formatDate(fullDate);
  };

  // Monthly Income vs Expense Trend
  const monthlyTrend = useMemo(() => {
    const months: Record<string, { income: number; expense: number }> = {};

    transactions.forEach((t) => {
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
        month: formatMonthYear(month),
        income: data.income,
        expense: data.expense,
        net: data.income - data.expense,
      }));
  }, [transactions, dateSystem]);

  // Category Spending Breakdown (Expenses only)
  const categoryBreakdown = useMemo(() => {
    const spending: Record<string, number> = {};

    transactions.filter((t) => t.type === "expense").forEach((t) => {
      spending[t.category] = (spending[t.category] || 0) + t.amount;
    });

    return Object.entries(spending)
      .map(([categoryId, amount]) => ({
        category: categories.find((c) => c.id === parseInt(categoryId))?.name || "Unknown",
        amount,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, categories]);

  // Net Worth Over Time (simplified - using current account balances as snapshot)
  const netWorthData = useMemo(() => {
    // Calculate net worth from accounts
    const assets = accounts.filter((a) => a.balance >= 0).reduce((sum, a) => sum + a.balance, 0);
    const liabilities = Math.abs(accounts.filter((a) => a.balance < 0).reduce((sum, a) => sum + a.balance, 0));
    const currentNetWorth = assets - liabilities;

    // Simulate historical data (in real app, this would come from historical snapshots)
    return [
      { month: formatMonthYear("2026-06"), netWorth: currentNetWorth - 50000 },
      { month: formatMonthYear("2026-07"), netWorth: currentNetWorth - 20000 },
      { month: formatMonthYear("2026-08"), netWorth: currentNetWorth },
    ];
  }, [transactions, dateSystem]);

  // Summary Stats
  const summary = useMemo(() => {
    const totalIncome = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
    const netSavings = totalIncome - totalExpense;
    
    const assets = accounts.filter((a) => a.balance >= 0).reduce((sum, a) => sum + a.balance, 0);
    const liabilities = Math.abs(accounts.filter((a) => a.balance < 0).reduce((sum, a) => sum + a.balance, 0));
    const netWorth = assets - liabilities;

    return { totalIncome, totalExpense, netSavings, netWorth };
  }, [transactions, accounts]);

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
                <p className="text-2xl font-bold text-[#4A5D7A]">{formatCurrency(summary.totalIncome)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-[#4A5D7A]" />
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
                <p className={`text-2xl font-bold ${summary.netSavings >= 0 ? "text-[#4A5D7A]" : "text-red-600"}`}>
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
