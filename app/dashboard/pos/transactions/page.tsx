"use client";

import { PageLoading } from "@/components/shared/PageLoading";

import { FormattedDate } from "@/components/shared/FormattedDate";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Search, Wallet, CreditCard, Receipt, DollarSign, Calendar, Eye, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashHeader } from "@/components/dashboard/dash-header";
import posApi, { type POSTransaction, POS_PAGE_SIZE } from "@/lib/api/pos";
import toast from "react-hot-toast";
import { POS_PAYMENT_METHODS, getPosPaymentMethodLabel } from "@/lib/pos/payment-methods";
import { useDateSystem } from "@/lib/context/DateSystemContext";
import NepaliDate from "nepali-date-converter";

export default function POSTransactionsPage() {
  const router = useRouter();
  const { dateSystem } = useDateSystem();
  
  const [transactions, setTransactions] = useState<POSTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [showCustomDateDialog, setShowCustomDateDialog] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Helper function to get date range based on filter
  const getDateRange = (filter: string) => {
    const now = new Date();
    let startDate = "";
    let endDate = "";

    switch (filter) {
      case "today":
        startDate = now.toISOString().split('T')[0];
        endDate = startDate;
        break;
      case "this_week":
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        startDate = weekStart.toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
        break;
      case "this_month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
        break;
      case "this_year":
        startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
        break;
      case "custom":
        startDate = customStartDate;
        endDate = customEndDate;
        break;
      default:
        return {};
    }

    return { date_after: startDate, date_before: endDate };
  };

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page };
      if (statusFilter !== "all") params.status = statusFilter;
      if (paymentFilter !== "all") params.payment_method = paymentFilter;
      if (searchQuery) params.search = searchQuery;
      
      // Add date filters
      const dateRange = getDateRange(dateFilter);
      Object.assign(params, dateRange);
      
      console.log('Fetching with params:', params); // Debug log
      
      const response = await posApi.getTransactions(params);
      setTransactions(response.results);
      setTotalCount(response.count);
    } catch (error: any) {
      console.error('Fetch error:', error); // Debug log
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, paymentFilter, searchQuery, dateFilter, customStartDate, customEndDate]);

  // Calculate summary statistics from current transactions
  const summaryStats = useMemo(() => {
    const completedTransactions = transactions.filter(t => t.status === 'completed');
    
    const totalAmount = completedTransactions.reduce((sum, t) => sum + Number(t.total), 0);
    const totalTransactions = completedTransactions.length;
    
    // Calculate payment method breakdown
    const paymentMethodTotals: Record<string, number> = {};
    completedTransactions.forEach(t => {
      const method = t.payment_method;
      paymentMethodTotals[method] = (paymentMethodTotals[method] || 0) + Number(t.total);
    });
    
    return {
      totalAmount,
      totalTransactions,
      paymentMethodTotals,
      cashTotal: paymentMethodTotals['cash'] || 0,
      cardTotal: paymentMethodTotals['card'] || 0,
      esewaTotal: paymentMethodTotals['esewa'] || 0,
      khaltiTotal: paymentMethodTotals['khalti'] || 0,
      fonepayTotal: paymentMethodTotals['fonepay'] || 0,
      bankTransferTotal: paymentMethodTotals['bank_transfer'] || 0,
      digitalWalletTotal: paymentMethodTotals['digital_wallet'] || 0,
      creditTotal: paymentMethodTotals['credit'] || 0,
    };
  }, [transactions]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        fetchTransactions();
      } else {
        setPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleCancelTransaction = async (id: string, transactionNumber: string) => {
    // Show custom confirmation toast
    toast((t) => (
      <div className="flex flex-col gap-4 min-w-[320px] p-2">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-red-100">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-base">Cancel transaction?</p>
            <p className="text-sm text-gray-600 mt-1">
              Cancel transaction {transactionNumber}? Stock will be restored.
            </p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await posApi.cancelTransaction(id);
                toast.success("Transaction cancelled successfully");
                fetchTransactions();
              } catch (error: any) {
                toast.error(error.response?.data?.error || "Failed to cancel transaction");
              }
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Cancel Transaction
          </button>
        </div>
      </div>
    ), {
      duration: Infinity,
      position: 'top-center',
      style: {
        marginTop: '40vh',
        background: 'white',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        borderRadius: '12px',
        padding: '16px' } });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: "bg-green-100 text-green-700",
      cancelled: "bg-red-100 text-red-700",
      refunded: "bg-yellow-100 text-yellow-700"
    };
    return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-700";
  };

  const getPaymentBadge = (method: string) => {
    const styles = {
      cash: "bg-blue-100 text-blue-700",
      card: "bg-purple-100 text-purple-700",
      esewa: "bg-green-100 text-green-700",
      khalti: "bg-violet-100 text-violet-700",
      fonepay: "bg-indigo-100 text-indigo-700",
      credit: "bg-orange-100 text-orange-700"
    };
    return styles[method as keyof typeof styles] || "bg-gray-100 text-gray-700";
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="POS Transactions" subtitle="Loading..." />
        <PageLoading message="Loading…" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title="POS Transactions" subtitle="View all point of sale transactions" />

      <div className="flex-1 p-6 space-y-6">
        {/* Summary Cards */}
        <div className="space-y-4">
          {/* Total Overview Card - Full Width */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <DollarSign className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-sm text-white/80 mb-1">Total Amount Received</p>
                  <p className="text-4xl font-bold">
                    Rs. {summaryStats.totalAmount.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-white/80 mb-1">Total Transactions</p>
                <p className="text-4xl font-bold">
                  {summaryStats.totalTransactions}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Method Breakdown Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {/* Cash Card */}
            <div className="bg-white rounded-lg p-3 shadow-sm border-l-4 border-blue-500 hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-semibold text-blue-700">Cash</span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {summaryStats.cashTotal.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {summaryStats.totalAmount > 0 
                  ? Math.round((summaryStats.cashTotal / summaryStats.totalAmount) * 100)
                  : 0}%
              </p>
            </div>

            {/* Card Payment Card */}
            <div className="bg-white rounded-lg p-3 shadow-sm border-l-4 border-purple-500 hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-4 w-4 text-purple-600" />
                <span className="text-xs font-semibold text-purple-700">Card</span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {summaryStats.cardTotal.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {summaryStats.totalAmount > 0 
                  ? Math.round((summaryStats.cardTotal / summaryStats.totalAmount) * 100)
                  : 0}%
              </p>
            </div>

            {/* eSewa Card */}
            <div className="bg-white rounded-lg p-3 shadow-sm border-l-4 border-green-500 hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Receipt className="h-4 w-4 text-green-600" />
                <span className="text-xs font-semibold text-green-700">eSewa</span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {summaryStats.esewaTotal.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {summaryStats.totalAmount > 0 
                  ? Math.round((summaryStats.esewaTotal / summaryStats.totalAmount) * 100)
                  : 0}%
              </p>
            </div>

            {/* Khalti Card */}
            <div className="bg-white rounded-lg p-3 shadow-sm border-l-4 border-violet-500 hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="h-4 w-4 text-violet-600" />
                <span className="text-xs font-semibold text-violet-700">Khalti</span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {summaryStats.khaltiTotal.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {summaryStats.totalAmount > 0 
                  ? Math.round((summaryStats.khaltiTotal / summaryStats.totalAmount) * 100)
                  : 0}%
              </p>
            </div>

            {/* FonePay Card */}
            <div className="bg-white rounded-lg p-3 shadow-sm border-l-4 border-indigo-500 hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Receipt className="h-4 w-4 text-indigo-600" />
                <span className="text-xs font-semibold text-indigo-700">FonePay</span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {summaryStats.fonepayTotal.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {summaryStats.totalAmount > 0 
                  ? Math.round((summaryStats.fonepayTotal / summaryStats.totalAmount) * 100)
                  : 0}%
              </p>
            </div>

            {/* Bank Transfer Card */}
            <div className="bg-white rounded-lg p-3 shadow-sm border-l-4 border-cyan-500 hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-4 w-4 text-cyan-600" />
                <span className="text-xs font-semibold text-cyan-700">Bank</span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {summaryStats.bankTransferTotal.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {summaryStats.totalAmount > 0 
                  ? Math.round((summaryStats.bankTransferTotal / summaryStats.totalAmount) * 100)
                  : 0}%
              </p>
            </div>

            {/* Digital Wallet Card */}
            <div className="bg-white rounded-lg p-3 shadow-sm border-l-4 border-teal-500 hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="h-4 w-4 text-teal-600" />
                <span className="text-xs font-semibold text-teal-700">Digital</span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {summaryStats.digitalWalletTotal.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {summaryStats.totalAmount > 0 
                  ? Math.round((summaryStats.digitalWalletTotal / summaryStats.totalAmount) * 100)
                  : 0}%
              </p>
            </div>

            {/* Credit Card */}
            <div className="bg-white rounded-lg p-3 shadow-sm border-l-4 border-orange-500 hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Receipt className="h-4 w-4 text-orange-600" />
                <span className="text-xs font-semibold text-orange-700">Credit</span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {summaryStats.creditTotal.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {summaryStats.totalAmount > 0 
                  ? Math.round((summaryStats.creditTotal / summaryStats.totalAmount) * 100)
                  : 0}%
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 items-center flex-wrap">
          <div className="relative flex-1 max-w-md min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by transaction number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm border-gray-200"
            />
          </div>
          
          <Select value={dateFilter} onValueChange={(v) => {
            setDateFilter(v ?? "all");
            if (v === "custom") {
              setShowCustomDateDialog(true);
            }
          }}>
            <SelectTrigger className="w-[160px] h-9 border-gray-200 shrink-0">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="this_week">This Week</SelectItem>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="this_year">This Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
            <SelectTrigger className="w-[150px] h-9 border-gray-200 shrink-0">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={paymentFilter} onValueChange={(v) => setPaymentFilter(v ?? "all")}>
            <SelectTrigger className="w-[160px] h-9 border-gray-200 shrink-0">
              <SelectValue placeholder="All Payments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              {POS_PAYMENT_METHODS.map((method) => (
                <SelectItem key={method.value} value={method.value}>
                  {method.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Custom Date Range Dialog */}
        {showCustomDateDialog && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Custom Date Range</h3>
                <button
                  onClick={() => {
                    setShowCustomDateDialog(false);
                    if (!customStartDate || !customEndDate) {
                      setDateFilter("all");
                    }
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date ({dateSystem === 'BS' ? 'BS' : 'AD'})
                  </label>
                  <Input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date ({dateSystem === 'BS' ? 'BS' : 'AD'})
                  </label>
                  <Input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCustomStartDate("");
                      setCustomEndDate("");
                      setDateFilter("all");
                      setShowCustomDateDialog(false);
                    }}
                    className="flex-1"
                  >
                    Clear
                  </Button>
                  <Button
                    onClick={() => {
                      if (customStartDate && customEndDate) {
                        setShowCustomDateDialog(false);
                      } else {
                        toast.error("Please select both start and end dates");
                      }
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={!customStartDate || !customEndDate}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Transaction #</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Payment</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Cashier</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
                    <tr 
                      key={transaction.id} 
                      className="group transition-all duration-150 hover:bg-gray-50 active:bg-gray-100"
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-semibold text-gray-900 group-hover:text-[var(--color-accent-custom,#22C55E)] transition-colors">
                          {transaction.transaction_number}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          <FormattedDate value={transaction.date!} />
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">
                          {transaction.customer_display || "Walk-in"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getPaymentBadge(transaction.payment_method)}`}>
                          {getPosPaymentMethodLabel(transaction.payment_method)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-semibold text-gray-900">
                          Rs. {transaction.total.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(transaction.status!)}`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {transaction.cashier_name}
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
                              onClick={() => router.push(`/dashboard/pos/transactions/${transaction.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {transaction.status === "completed" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => router.push(`/dashboard/pos/refunds/new?pos=${transaction.transaction_number}`)}
                                >
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                  Create Refund
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleCancelTransaction(transaction.id!, transaction.transaction_number || transaction.id!)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Cancel Transaction
                                </DropdownMenuItem>
                              </>
                            )}
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
                Showing {(page - 1) * POS_PAGE_SIZE + 1} to {Math.min(page * POS_PAGE_SIZE, totalCount)} of {totalCount} transactions
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
