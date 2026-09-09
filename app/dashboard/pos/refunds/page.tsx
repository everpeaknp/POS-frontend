"use client";

import { PageLoading } from "@/components/shared/PageLoading";
import { FormattedDate } from "@/components/shared/FormattedDate";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Search, RotateCcw, DollarSign, Calendar, Eye, X, Plus, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashHeader } from "@/components/dashboard/dash-header";
import posApi, { type POSRefund, POS_PAGE_SIZE } from "@/lib/api/pos";
import toast from "react-hot-toast";
import { useDateSystem } from "@/lib/context/DateSystemContext";
import { formatDisplayDate as formatDate } from "@/lib/dates";
import Link from "next/link";

export default function POSRefundsPage() {
  const router = useRouter();
  const { dateSystem } = useDateSystem();
  
  const [refunds, setRefunds] = useState<POSRefund[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [reasonFilter, setReasonFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Date filter options
  const getDateRange = (filter: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch(filter) {
      case 'today':
        return { start: today, end: new Date() };
      case 'yesterday': {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return { start: yesterday, end: today };
      }
      case 'this_week': {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        return { start: weekStart, end: new Date() };
      }
      case 'this_month': {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        return { start: monthStart, end: new Date() };
      }
      case 'last_month': {
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        return { start: lastMonthStart, end: lastMonthEnd };
      }
      case 'custom':
        if (customStartDate && customEndDate) {
          return { 
            start: new Date(customStartDate), 
            end: new Date(customEndDate) 
          };
        }
        return null;
      default:
        return null;
    }
  };

  const fetchRefunds = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        page_size: POS_PAGE_SIZE,
      };

      if (searchQuery) params.search = searchQuery;
      if (reasonFilter && reasonFilter !== "all") params.reason = reasonFilter;

      const dateRange = getDateRange(dateFilter);
      if (dateRange) {
        params.start_date = dateRange.start.toISOString().split('T')[0];
        params.end_date = dateRange.end.toISOString().split('T')[0];
      }

      console.log('Fetching refunds with params:', params);
      
      const response = await posApi.getRefunds(params);
      setRefunds(response.results || response);
      setTotalCount(response.count || (Array.isArray(response) ? response.length : 0));
    } catch (error: any) {
      console.error('Fetch error:', error);
      toast.error("Failed to load refunds");
    } finally {
      setLoading(false);
    }
  }, [page, reasonFilter, searchQuery, dateFilter, customStartDate, customEndDate]);

  // Calculate summary statistics from current refunds
  // (POSRefund has no status/cancellation workflow — every refund that exists is final)
  const summaryStats = useMemo(() => {
    const totalAmount = refunds.reduce((sum, r) => sum + Number(r.total_amount || 0), 0);
    const totalRefunds = refunds.length;
    const totalItems = refunds.reduce((sum, r) => sum + (r.lines?.length || 0), 0);

    // Calculate reason breakdown
    const reasonTotals: Record<string, number> = {};
    refunds.forEach(r => {
      const reason = r.reason || 'other';
      reasonTotals[reason] = (reasonTotals[reason] || 0) + Number(r.total_amount || 0);
    });

    return {
      totalAmount,
      totalRefunds,
      totalItems,
      reasonTotals,
      damagedTotal: reasonTotals['damaged_product'] || 0,
      wrongTotal: reasonTotals['wrong_product'] || 0,
      defectiveTotal: reasonTotals['defective'] || 0,
      customerTotal: reasonTotals['customer_request'] || 0,
      otherTotal: reasonTotals['other'] || 0,
    };
  }, [refunds]);

  useEffect(() => {
    fetchRefunds();
  }, [fetchRefunds]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        fetchRefunds();
      } else {
        setPage(1);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const formatDisplayTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && refunds.length === 0) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="POS Refunds" subtitle="Loading..." />
        <PageLoading message="Loading…" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader 
        title="POS Refunds" 
        subtitle="View and manage product returns"
        actions={
          <Link href="/dashboard/pos/refunds/new">
            <Button className="bg-[#4A5D7A] hover:bg-[#2E3E52] gap-2">
              <Plus className="h-4 w-4" />
              New Refund
            </Button>
          </Link>
        }
      />

      <div className="flex-1 p-6 space-y-6">
        {/* Summary Cards Section */}
        <div className="space-y-4">
          {/* Main Summary Card with gradient */}
          <div className="bg-gradient-to-br from-red-500 via-red-600 to-orange-600 rounded-2xl p-6 shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80 mb-1">Total Refund Amount</p>
                <p className="text-5xl font-bold mb-2">
                  Rs. {summaryStats.totalAmount.toLocaleString()}
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <p className="text-white/90">
                    <span className="font-semibold">{summaryStats.totalItems}</span> items
                  </p>
                  <span className="text-white/60">•</span>
                  <p className="text-white/90">
                    <span className="font-semibold">{summaryStats.totalRefunds}</span> refunds
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-white/80 mb-1">Total Refunds</p>
                <p className="text-4xl font-bold">
                  {summaryStats.totalRefunds}
                </p>
              </div>
            </div>
          </div>

          {/* Reason Breakdown Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {/* Damaged Product Card */}
            <div className="bg-white rounded-lg p-3 shadow-sm border-l-4 border-red-500 hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="text-xs font-semibold text-red-700">Damaged</span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {summaryStats.damagedTotal.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {summaryStats.totalAmount > 0 
                  ? Math.round((summaryStats.damagedTotal / summaryStats.totalAmount) * 100)
                  : 0}%
              </p>
            </div>

            {/* Wrong Product Card */}
            <div className="bg-white rounded-lg p-3 shadow-sm border-l-4 border-orange-500 hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-2">
                <X className="h-4 w-4 text-orange-600" />
                <span className="text-xs font-semibold text-orange-700">Wrong Item</span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {summaryStats.wrongTotal.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {summaryStats.totalAmount > 0 
                  ? Math.round((summaryStats.wrongTotal / summaryStats.totalAmount) * 100)
                  : 0}%
              </p>
            </div>

            {/* Defective Card */}
            <div className="bg-white rounded-lg p-3 shadow-sm border-l-4 border-yellow-500 hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-2">
                <RotateCcw className="h-4 w-4 text-yellow-600" />
                <span className="text-xs font-semibold text-yellow-700">Defective</span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {summaryStats.defectiveTotal.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {summaryStats.totalAmount > 0 
                  ? Math.round((summaryStats.defectiveTotal / summaryStats.totalAmount) * 100)
                  : 0}%
              </p>
            </div>

            {/* Customer Request Card */}
            <div className="bg-white rounded-lg p-3 shadow-sm border-l-4 border-blue-500 hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-semibold text-blue-700">Customer</span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {summaryStats.customerTotal.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {summaryStats.totalAmount > 0 
                  ? Math.round((summaryStats.customerTotal / summaryStats.totalAmount) * 100)
                  : 0}%
              </p>
            </div>

            {/* Other Card */}
            <div className="bg-white rounded-lg p-3 shadow-sm border-l-4 border-gray-500 hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-2">
                <MoreVertical className="h-4 w-4 text-gray-600" />
                <span className="text-xs font-semibold text-gray-700">Other</span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {summaryStats.otherTotal.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {summaryStats.totalAmount > 0 
                  ? Math.round((summaryStats.otherTotal / summaryStats.totalAmount) * 100)
                  : 0}%
              </p>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search refunds..."
                className="pl-10 h-10"
              />
            </div>

            {/* Reason Filter */}
            <Select value={reasonFilter} onValueChange={(v) => setReasonFilter(v ?? "all")}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="All Reasons" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reasons</SelectItem>
                <SelectItem value="damaged_product">Damaged Product</SelectItem>
                <SelectItem value="wrong_product">Wrong Product</SelectItem>
                <SelectItem value="defective">Defective</SelectItem>
                <SelectItem value="customer_request">Customer Request</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Filter */}
            <Select value={dateFilter} onValueChange={(v) => setDateFilter(v ?? "all")}>
              <SelectTrigger className="h-10">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="this_week">This Week</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="last_month">Last Month</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Date Range */}
          {dateFilter === "custom" && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Start Date</label>
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="h-9"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">End Date</label>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
          )}

          {/* Active Filters Display */}
          {(searchQuery || reasonFilter !== "all" || dateFilter !== "all") && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="text-gray-600">Active filters:</span>
              {searchQuery && (
                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">
                  Search: {searchQuery}
                </span>
              )}
              {reasonFilter !== "all" && (
                <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded">
                  Reason: {reasonFilter.replace(/_/g, ' ')}
                </span>
              )}
              {dateFilter !== "all" && (
                <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded">
                  Date: {dateFilter.replace(/_/g, ' ')}
                </span>
              )}
              <button
                onClick={() => {
                  setSearchQuery("");
                  setReasonFilter("all");
                  setDateFilter("all");
                  setCustomStartDate("");
                  setCustomEndDate("");
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* Refunds Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Refund #</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Transaction</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Reason</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Items</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {refunds.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                      No refunds found
                    </td>
                  </tr>
                ) : (
                  refunds.map((refund) => (
                    <tr 
                      key={refund.id} 
                      className="group transition-all duration-150 hover:bg-gray-50 active:bg-gray-100"
                    >
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-gray-900">
                          {refund.refund_number}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {refund.original_transaction_number || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {formatDate(refund.created_at, dateSystem)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDisplayTime(refund.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 capitalize">
                          {refund.reason?.replace(/_/g, ' ') || 'Other'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {refund.lines?.length || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-red-600">
                          Rs. {Number(refund.total_amount || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                          COMPLETED
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-gray-100 transition-colors"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem
                              onClick={() => router.push(`/dashboard/pos/refunds/${refund.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalCount > POS_PAGE_SIZE && (
            <div className="p-4 border-t border-gray-100 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {(page - 1) * POS_PAGE_SIZE + 1} to {Math.min(page * POS_PAGE_SIZE, totalCount)} of {totalCount} refunds
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * POS_PAGE_SIZE >= totalCount}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
