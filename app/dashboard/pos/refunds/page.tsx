"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Filter, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashHeader } from "@/components/dashboard/dash-header";
import posApi, { type POSRefund } from "@/lib/api/pos";
import toast from "react-hot-toast";
import { PageLoading } from "@/components/shared/PageLoading";

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<POSRefund[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchRefunds();
  }, []);

  const fetchRefunds = async () => {
    try {
      const data = await posApi.getRefunds();
      setRefunds(data);
    } catch (error) {
      toast.error("Failed to load refunds");
    } finally {
      setLoading(false);
    }
  };

  const filteredRefunds = refunds.filter((refund) => {
    const query = searchQuery.toLowerCase();
    return (
      refund.refund_number.toLowerCase().includes(query) ||
      refund.original_transaction_number?.toLowerCase().includes(query) ||
      refund.reason.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Refunds" subtitle="Loading..." />
        <PageLoading message="Loading refunds..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      <DashHeader 
        title="Refunds" 
        subtitle="View and manage product returns"
        actions={
          <Link href="/dashboard/pos/refunds/new">
            <Button className="bg-[#22C55E] hover:bg-[#16A34A] gap-2">
              <Plus className="h-4 w-4" />
              New Refund
            </Button>
          </Link>
        }
      />

      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Search and Filters */}
          <div className="mb-6 flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by refund number, transaction, or reason..."
                className="pl-10"
              />
            </div>
          </div>

          {/* Refunds List */}
          {filteredRefunds.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
              <RotateCcw className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchQuery ? "No refunds found" : "No refunds yet"}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchQuery 
                  ? "Try adjusting your search terms" 
                  : "Process your first refund to see it here"}
              </p>
              {!searchQuery && (
                <Link href="/dashboard/pos/refunds/new">
                  <Button className="bg-[#22C55E] hover:bg-[#16A34A]">
                    <Plus className="h-4 w-4 mr-2" />
                    New Refund
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Refund #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transaction
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Items
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredRefunds.map((refund) => (
                      <tr key={refund.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {refund.refund_number}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {refund.original_transaction_number || "—"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {new Date(refund.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(refund.created_at).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {refund.reason.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {refund.lines?.length || 0} items
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-semibold text-gray-900">
                            Rs. {refund.total_refund_amount?.toLocaleString() || "0"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            refund.status === 'completed' 
                              ? 'bg-green-100 text-green-800'
                              : refund.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {refund.status?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) || "Completed"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Summary Cards */}
          {refunds.length > 0 && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4">
                <div className="text-sm text-gray-600 mb-1">Total Refunds</div>
                <div className="text-2xl font-bold text-gray-900">{refunds.length}</div>
              </div>
              <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4">
                <div className="text-sm text-gray-600 mb-1">Total Items Refunded</div>
                <div className="text-2xl font-bold text-gray-900">
                  {refunds.reduce((sum, r) => sum + (r.lines?.length || 0), 0)}
                </div>
              </div>
              <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4">
                <div className="text-sm text-gray-600 mb-1">Total Refund Amount</div>
                <div className="text-2xl font-bold text-red-600">
                  Rs. {refunds.reduce((sum, r) => sum + (r.total_refund_amount || 0), 0).toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
