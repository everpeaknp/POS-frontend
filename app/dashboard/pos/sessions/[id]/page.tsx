"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashHeader } from "@/components/dashboard/dash-header";
import { PosStatusBadge } from "@/components/pos/PosStatusBadge";
import posApi, { POSSession } from "@/lib/api/pos";
import { toast } from "sonner";

export default function PosSessionDetailPage({ params }: { params: { id: string } }) {
  const [session, setSession] = useState<POSSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        setLoading(true);
        const data = await posApi.getSession(params.id);
        setSession(data);
      } catch (error: any) {
        console.error("Failed to fetch session:", error);
        toast.error(error.message || "Failed to load session details");
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Loading..." />
        <div className="flex-1 p-6">
          <p className="text-gray-600">Loading session details...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="Session Not Found" />
        <div className="flex-1 p-6">
          <p className="text-gray-600">The requested session could not be found.</p>
        </div>
      </div>
    );
  }

  const digitalSales = session.card_sales + session.upi_sales;

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title={`Session ${session.session_number}`} subtitle={`Opened by ${session.cashier_name}`} />
      <div className="flex-1 p-6 space-y-6">
        <Link href="/dashboard/pos/sessions" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" /> Back to Sessions
        </Link>

        {/* Session Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Session Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Session Number</span>
                <span className="text-sm font-medium text-gray-900">{session.session_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Cashier</span>
                <span className="text-sm font-medium text-gray-900">{session.cashier_name}</span>
              </div>
              {session.warehouse_name && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Warehouse</span>
                  <span className="text-sm font-medium text-gray-900">{session.warehouse_name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <PosStatusBadge status={session.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Opened At</span>
                <span className="text-sm font-medium text-gray-900">
                  {new Date(session.opened_at).toLocaleString()}
                </span>
              </div>
              {session.closed_at && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Closed At</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(session.closed_at).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Financial Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Opening Cash</span>
                <span className="text-sm font-medium text-gray-900">
                  Rs. {session.opening_cash.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Sales</span>
                <span className="text-sm font-medium text-green-600">
                  Rs. {session.total_sales.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Cash Sales</span>
                <span className="text-sm font-medium text-gray-900">
                  Rs. {session.cash_sales.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Digital Sales</span>
                <span className="text-sm font-medium text-gray-900">
                  Rs. {digitalSales.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Transactions</span>
                <span className="text-sm font-medium text-gray-900">{session.total_transactions}</span>
              </div>
              {session.closing_cash !== null && session.closing_cash !== undefined && (
                <>
                  <div className="flex justify-between pt-2 border-t border-gray-100">
                    <span className="text-sm font-medium text-gray-900">Expected Cash</span>
                    <span className="text-sm font-medium text-gray-900">
                      Rs. {session.expected_cash.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-900">Closing Cash</span>
                    <span className="text-sm font-bold text-gray-900">
                      Rs. {session.closing_cash.toLocaleString()}
                    </span>
                  </div>
                  {session.cash_variance !== 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Cash Variance</span>
                      <span className={`text-sm font-medium ${session.cash_variance > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {session.cash_variance > 0 ? '+' : ''}
                        Rs. {session.cash_variance.toLocaleString()}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Transactions - Coming Soon */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Transactions ({session.total_transactions})</h3>
          </div>
          <div className="p-6 text-center text-gray-500">
            <p className="text-sm">Transaction details will be available once POS transactions are linked to sessions.</p>
          </div>
        </div>

        {/* Actions */}
        {session.status === "open" && (
          <div className="flex gap-3">
            <Link href={`/dashboard/pos/sessions/${session.id}/close`}>
              <Button className="bg-[#22C55E] hover:bg-[#16A34A] text-white">Close Session</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
