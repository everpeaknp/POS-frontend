"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, RotateCcw, Calendar, User, Package, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashHeader } from "@/components/dashboard/dash-header";
import posApi, { type POSRefund, type POSRefundLine } from "@/lib/api/pos";
import { formatNPR } from "@/lib/utils";
import toast from "react-hot-toast";
import { PageLoading } from "@/components/shared/PageLoading";

export default function RefundDetailPage() {
  const router = useRouter();
  const params = useParams();
  const refundId = params.id as string;

  const [refund, setRefund] = useState<POSRefund | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (refundId) {
      loadRefund();
    }
  }, [refundId]);

  const loadRefund = async () => {
    try {
      const response = await posApi.getRefund(refundId);
      setRefund(response);
    } catch (error) {
      console.error("Error loading refund:", error);
      toast.error("Failed to load refund details");
      router.push("/dashboard/pos/refunds");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Refund Details" subtitle="Loading..." />
        <PageLoading message="Loading…" />
      </div>
    );
  }

  if (!refund) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Refund Not Found" subtitle="The refund could not be found" />
        <div className="flex flex-col items-center justify-center gap-4 py-16 px-6">
          <p className="text-gray-500">
            This refund does not exist or was removed.
          </p>
          <Link href="/dashboard/pos/refunds">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Refunds
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader
        title={refund.refund_number}
        subtitle={`POS Refund · ${new Date(refund.created_at).toLocaleDateString("en-GB")}`}
        actions={
          <Link href="/dashboard/pos/refunds">
            <Button variant="outline" size="sm" className="gap-1.5 h-8">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Button>
          </Link>
        }
      />

      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Left - refund meta */}
            <div className="xl:col-span-4 space-y-4">
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Refund
                    </p>
                    <h2 className="text-lg font-bold text-gray-900 mt-1">
                      {refund.refund_number}
                    </h2>
                  </div>
                  <div className="p-2 rounded-lg bg-red-50">
                    <RotateCcw className="h-5 w-5 text-red-600" />
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Date
                    </span>
                    <span className="font-medium text-gray-900 text-right">
                      {new Date(refund.created_at).toLocaleString("en-GB")}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500">Original Transaction</span>
                    <span className="font-medium text-gray-900 text-right">
                      {refund.original_transaction_number || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500">Reason</span>
                    <span className="font-medium text-gray-900 text-right capitalize">
                      {refund.reason?.replace(/_/g, ' ') || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500">Refund Method</span>
                    <span className="font-medium text-gray-900 text-right capitalize">
                      {refund.refund_method || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4 items-center">
                    <span className="text-gray-500">Status</span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                      COMPLETED
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-3">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Refund Summary
                </h3>
                <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Total Refund</span>
                  <span className="text-xl font-bold text-red-600">
                    {formatNPR(refund.total_amount || 0)}
                  </span>
                </div>
              </div>

              {refund.notes && (
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Notes
                  </h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {refund.notes}
                  </p>
                </div>
              )}

              <div className="text-xs text-gray-500 px-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span>Refund ID:</span>
                  <span className="font-mono font-semibold text-gray-700">{refund.id}</span>
                </div>
                {refund.created_at && (
                  <div className="flex items-center justify-between">
                    <span>Created:</span>
                    <span>{new Date(refund.created_at).toLocaleString("en-GB")}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right - line items */}
            <div className="xl:col-span-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                  <Package className="h-4 w-4 text-red-600" />
                  <h3 className="text-sm font-semibold text-gray-900">
                    Items Refunded ({refund.lines?.length || 0})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {["Product", "Quantity", "Refund Amount"].map((h) => (
                          <th
                            key={h}
                            className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${
                              h === "Product" ? "text-left" : "text-right"
                            }`}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {refund.lines && refund.lines.length > 0 ? (
                        refund.lines.map((line: POSRefundLine, index: number) => (
                          <tr
                            key={line.id || index}
                            className="hover:bg-gray-50/50"
                          >
                            <td className="px-4 py-3 font-medium text-gray-900">
                              {line.product_name || "Unknown Product"}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-900">
                              {line.quantity}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-gray-900">
                              {formatNPR(line.refund_amount || 0)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                            No items in this refund
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t border-gray-100">
                      <tr>
                        <td
                          colSpan={2}
                          className="px-4 py-3 text-right text-sm font-medium text-gray-600"
                        >
                          Total Refund
                        </td>
                        <td className="px-4 py-3 text-right text-base font-bold text-red-600">
                          {formatNPR(refund.total_amount || 0)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
