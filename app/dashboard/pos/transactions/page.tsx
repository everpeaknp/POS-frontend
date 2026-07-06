"use client";

import { PageLoading } from "@/components/shared/PageLoading";

import { FormattedDate } from "@/components/shared/FormattedDate";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, X, Calendar, DollarSign, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashHeader } from "@/components/dashboard/dash-header";
import posApi, { type POSTransaction } from "@/lib/api/pos";
import toast from "react-hot-toast";

export default function POSTransactionsPage() {
  const router = useRouter();
  
  const [transactions, setTransactions] = useState<POSTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params: any = { page };
      if (statusFilter !== "all") params.status = statusFilter;
      if (paymentFilter !== "all") params.payment_method = paymentFilter;
      if (searchQuery) params.search = searchQuery;
      
      const response = await posApi.getTransactions(params);
      setTransactions(response.results);
      setTotalCount(response.count);
    } catch (error: any) {
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, statusFilter, paymentFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        fetchTransactions();
      } else {
        setPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
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
      upi: "bg-indigo-100 text-indigo-700",
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
      
      <div className="flex-1 p-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          {/* Filters */}
          <div className="p-4 border-b border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Input
                placeholder="Search by transaction number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="md:col-span-2"
              />
              
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={paymentFilter} onValueChange={(v) => setPaymentFilter(v ?? "all")}>
                <SelectTrigger>
                  <SelectValue placeholder="Payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="upi">UPI/Digital</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Transaction #</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Payment</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Total</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Cashier</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="font-medium text-sm">{transaction.transaction_number}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <FormattedDate value={transaction.date!} />
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {transaction.customer_display || "Walk-in"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPaymentBadge(transaction.payment_method)}`}>
                          {transaction.payment_method.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-sm">
                        Rs. {transaction.total.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(transaction.status!)}`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {transaction.cashier_name}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => router.push(`/dashboard/pos/transactions/${transaction.id}`)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {transaction.status === "completed" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCancelTransaction(transaction.id!, transaction.transaction_number || transaction.id!)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalCount > 20 && (
            <div className="p-4 border-t border-gray-100 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, totalCount)} of {totalCount} transactions
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page * 20 >= totalCount}
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
