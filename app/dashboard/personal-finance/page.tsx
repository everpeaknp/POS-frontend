"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Wallet,
  TrendingUp,
  CreditCard,
  Bell,
  Plus,
  Building2,
  Banknote,
  ChevronRight,
  DollarSign,
  AlertCircle,
  Activity,
  ArrowUpCircle,
  ArrowDownCircle,
  FolderTree,
  Receipt,
  Clock,
  TrendingDown,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { DashHeader } from "@/components/dashboard/dash-header";
import { SkeletonCard } from "@/components/shared/Skeleton";
import { useAuth } from "@/lib/context/AuthContext";
import { useApi } from "@/lib/hooks/useApi";
import { personalFinanceDashboardAPI } from "@/lib/api/personal-finance";
import { formatNPR } from "@/lib/utils";

const quickActions = [
  {
    href: "/dashboard/personal-finance/transactions?new=1",
    label: "Add Transaction",
    sub: "Record income/expense",
    icon: Plus,
    color: "bg-gray-50 text-gray-600",
  },
  {
    href: "/dashboard/personal-finance/account?new=1",
    label: "Add Account",
    sub: "Bank/wallet/cash",
    icon: Building2,
    color: "bg-gray-50 text-gray-600",
  },
  {
    href: "/dashboard/personal-finance/account?new=1",
    label: "Add Investment",
    sub: "Track holdings",
    icon: TrendingUp,
    color: "bg-gray-50 text-gray-600",
  },
  {
    href: "/dashboard/personal-finance/bills?new=1",
    label: "Add Loan",
    sub: "Record debt",
    icon: CreditCard,
    color: "bg-gray-50 text-gray-600",
  },
];

const moduleLinks = [
  {
    href: "/dashboard/personal-finance/budget",
    label: "Budgeting & Saving",
    sub: "Track budgets & goals",
    icon: Banknote,
    color: "bg-gray-50 text-gray-600",
  },
  {
    href: "/dashboard/personal-finance/account",
    label: "Banking",
    sub: "Accounts & transactions",
    icon: Building2,
    color: "bg-gray-50 text-gray-600",
  },
  {
    href: "/dashboard/personal-finance/account",
    label: "Investing",
    sub: "Portfolio management",
    icon: TrendingUp,
    color: "bg-gray-50 text-gray-600",
  },
  {
    href: "/dashboard/personal-finance/bills",
    label: "Loans & Credit",
    sub: "Debt tracking",
    icon: CreditCard,
    color: "bg-gray-50 text-gray-600",
  },
];

export default function PersonalFinanceDashboardPage() {
  const { user } = useAuth();
  const [transactionTab, setTransactionTab] = useState<"income" | "expense">("expense");

  const workspaceName =
    user?.tenant?.workspace_name || user?.tenant?.name || "Workspace";
  const subtitle = `${workspaceName} · Personal Finance overview and analytics`;

  const { data, loading, error, refetch } = useApi(
    () => personalFinanceDashboardAPI.get(),
    { immediate: true }
  );

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Personal Finance" subtitle={subtitle} />
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

  if (error || !data) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Personal Finance" subtitle={subtitle} />
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">Failed to load personal finance overview</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="px-4 py-2 bg-[#22C55E] text-white rounded-lg hover:bg-[#16A34A]"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { summary, netWorthTrend, alerts, activities, topAccounts } = data;

  // Helper function to format relative time
  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInMs = now.getTime() - past.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    } else {
      return past.toLocaleDateString();
    }
  };

  // Helper function to get activity icon
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'transaction':
        return ArrowUpCircle;
      case 'account':
        return Building2;
      case 'budget':
        return Wallet;
      case 'bill':
        return Receipt;
      case 'category':
        return FolderTree;
      default:
        return Activity;
    }
  };

  // Helper function to get activity color
  const getActivityColor = (type: string, action: string) => {
    if (action === 'deleted') return 'text-red-500';
    return 'text-gray-600';
  };

  const statCards = [
    {
      label: "Total Balance",
      value: formatNPR(summary.total_balance),
      sub: "Banking accounts",
      icon: Wallet,
      color: "bg-gray-50 text-gray-600",
    },
    {
      label: "Total Investments",
      value: formatNPR(summary.total_investments),
      sub: "Current value",
      icon: TrendingUp,
      color: "bg-gray-50 text-gray-600",
    },
    {
      label: "Total Debt",
      value: formatNPR(summary.total_debt),
      sub: "Loans & credit due",
      icon: CreditCard,
      color: "bg-gray-50 text-gray-600",
    },
    {
      label: "Upcoming Renewals",
      value: summary.upcoming_renewals.toLocaleString(),
      sub: "Insurance & tax",
      icon: Bell,
      color: "bg-gray-50 text-gray-600",
    },
  ];

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="Personal Finance" subtitle={subtitle} />

      <div className="flex-1 p-6 space-y-6">
        {/* Stat cards */}
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
              <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.label}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Net Worth Trend Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Net Worth Trend</h3>
            {netWorthTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={netWorthTrend} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22C55E" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="#e5e7eb" 
                    vertical={true} 
                    horizontal={false} 
                  />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    name="Net Worth"
                    stroke="#22C55E"
                    strokeWidth={2.5}
                    fill="url(#netWorthGradient)"
                    dot={{ 
                      fill: "#22C55E", 
                      stroke: "#fff", 
                      strokeWidth: 2, 
                      r: 5 
                    }}
                    activeDot={{ 
                      r: 7, 
                      stroke: "#fff", 
                      strokeWidth: 2, 
                      fill: "#22C55E" 
                    }}
                    connectNulls={true}
                    isAnimationActive={true}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[260px] flex flex-col items-center justify-center text-gray-400 text-sm">
                <DollarSign className="h-10 w-10 mb-2 text-gray-300" />
                No trend data yet
              </div>
            )}
          </div>

          {/* Module navigation */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Module Navigation</h3>
            <div className="space-y-2">
              {moduleLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-50 hover:bg-gray-50 hover:border-gray-100 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${link.color}`}>
                      <link.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{link.label}</p>
                      <p className="text-xs text-gray-500">{link.sub}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Recent Activities */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-gray-700">Recent Activities</h3>
              <Link
                href="/dashboard/personal-finance/activities"
                className="text-xs text-[#22C55E] hover:text-[#16A34A] font-medium inline-flex items-center gap-1"
              >
                View all
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {activities.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                No recent activities
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {activities.slice(0, 5).map((activity, idx) => {
                  const IconComponent = getActivityIcon(activity.type);
                  const iconColor = getActivityColor(activity.type, activity.action);
                  
                  return (
                    <div key={idx} className="px-5 py-3 hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg bg-gray-50 ${iconColor}`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 line-clamp-2">{activity.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center text-xs text-gray-500">
                              <Clock className="h-3 w-3 mr-1" />
                              {getRelativeTime(activity.timestamp)}
                            </span>
                            {activity.amount && (
                              <span className={`text-xs font-medium ${
                                activity.type === 'transaction' && activity.description.toLowerCase().includes('expense')
                                  ? 'text-red-600'
                                  : 'text-[#22C55E]'
                              }`}>
                                {formatNPR(activity.amount)}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                          activity.action === 'created' 
                            ? 'bg-green-50 text-green-600' 
                            : activity.action === 'updated'
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-red-50 text-red-600'
                        }`}>
                          {activity.action}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Alerts */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-gray-700">Alerts</h3>
            </div>
            {alerts.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                No alerts at this time
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {alerts.map((alert, idx) => (
                  <div key={idx} className="px-5 py-3 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <AlertCircle 
                        className="h-5 w-5 mt-0.5 shrink-0 text-gray-600" 
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                        {alert.amount && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            Amount: {formatNPR(alert.amount)}
                          </p>
                        )}
                        {alert.date && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            Date: {new Date(alert.date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Accounts by Balance */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-gray-700">Top Accounts by Balance</h3>
              <Link
                href="/dashboard/personal-finance/account"
                className="text-xs text-[#22C55E] hover:text-[#16A34A] font-medium inline-flex items-center gap-1"
              >
                View all
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {topAccounts.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">
                No accounts yet
              </div>
            ) : (
              <div className="space-y-4">
                {topAccounts.map((account, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-700 truncate pr-2">
                        {account.name}
                      </span>
                      <span className="text-xs text-gray-500 shrink-0">
                        {formatNPR(account.balance)}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#22C55E] transition-all"
                        style={{ 
                          width: `${(account.balance / topAccounts[0].balance) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
