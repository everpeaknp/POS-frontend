'use client';

import { PageLoading } from "@/components/shared/PageLoading";
import { useEffect, useState } from 'react';
import { useTenant } from '@/lib/context/TenantContext';
import { reportsAPI, type DashboardSummary } from '@/lib/api/reports';
import { journalEntriesAPI, type JournalEntry } from '@/lib/api/accounting';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Skeleton } from '@/components/shared/Skeleton';
import toast from 'react-hot-toast';

export default function TenantDashboardPage() {
  const { tenant, loading: tenantLoading, hasModule } = useTenant();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentEntries, setRecentEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantLoading && tenant) {
      fetchDashboardData();
    }
  }, [tenantLoading, tenant]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch dashboard summary
      const summaryData = await reportsAPI.dashboardSummary();
      setSummary(summaryData);

      // Fetch recent journal entries if accounting module is active
      if (hasModule('accounting')) {
        const entriesData = await journalEntriesAPI.list({ 
          ordering: '-date,-created_at',
          status: 'posted'
        });
        const entries = Array.isArray(entriesData) ? entriesData : (entriesData as any).results || [];
        setRecentEntries(entries.slice(0, 5));
      }
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (tenantLoading) {
    return (
      <PageLoading message="Loading workspace…" />
    );
  }

  if (!tenant) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900">Workspace Not Found</h2>
            <p className="text-gray-600 mt-2">The workspace you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome to {tenant.name}
        </h1>
        <p className="text-gray-600 mt-1">
          Here's what's happening with your business today
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Receivables */}
        {loading ? (
          <Skeleton className="h-32" />
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Receivables</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(summary?.financials?.total_receivables || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Amount to collect</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        )}

        {/* Total Payables */}
        {loading ? (
          <Skeleton className="h-32" />
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Payables</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(summary?.financials?.total_payables || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Amount to pay</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        )}

        {/* Net Profit */}
        {loading ? (
          <Skeleton className="h-32" />
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Net Profit</p>
                <p className={`text-2xl font-bold mt-1 ${
                  (summary?.financials?.net_profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(Math.abs(summary?.financials?.net_profit || 0))}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {(summary?.financials?.net_profit || 0) >= 0 ? 'Profit' : 'Loss'}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${
                (summary?.financials?.net_profit || 0) >= 0 ? 'bg-blue-100' : 'bg-red-100'
              }`}>
                <DollarSign className={`w-6 h-6 ${
                  (summary?.financials?.net_profit || 0) >= 0 ? 'text-blue-600' : 'text-red-600'
                }`} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Additional Metrics */}
      {!loading && summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {hasModule('sales') && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <ArrowUpRight className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Sales</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(summary.financials?.breakdown?.sales_revenue || 0)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {hasModule('purchase') && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <ArrowDownRight className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Purchases</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(summary.financials?.breakdown?.purchase_expenses || 0)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {hasModule('inventory') && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Low Stock Items</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {summary.inventory?.total_low_stock_items || 0}
                  </p>
                </div>
              </div>
            </div>
          )}

          {hasModule('sales') && summary && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Active Sites</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {summary.construction?.total_active_sites || 0}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Transactions */}
      {hasModule('accounting') && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
            <p className="text-sm text-gray-600 mt-1">Latest posted journal entries</p>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-6 space-y-3">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            ) : recentEntries.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No transactions yet</p>
                <p className="text-sm mt-1">Start by creating journal entries</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Entry #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                        {new Date(entry.date).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                        <span className="font-mono">{entry.entry_number}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {entry.description}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                          {entry.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-900 whitespace-nowrap font-medium">
                        {formatCurrency(entry.total_debit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Module Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Modules</h2>
        <div className="flex flex-wrap gap-2">
          {tenant.active_modules.length === 0 ? (
            <p className="text-gray-500 text-sm">No modules activated</p>
          ) : (
            tenant.active_modules.map((module) => (
              <span
                key={module}
                className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium capitalize"
              >
                {module}
              </span>
            ))
          )}
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Plan: <span className="font-medium capitalize">{tenant.plan_type}</span>
        </p>
      </div>
    </div>
  );
}
