"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DashHeader } from "@/components/dashboard/dash-header";
import { NotFoundView } from "@/components/shared/NotFoundView";
import posApi, { POSSession, ZReport } from "@/lib/api/pos";
import { isValidPosSessionRef } from "@/lib/pos/session-ref";
import { toast } from "sonner";

function useSessionRef(): string | undefined {
  const params = useParams();
  const raw = params.sessionRef;
  const fromParams = Array.isArray(raw) ? raw[0] : raw;
  return isValidPosSessionRef(fromParams) ? fromParams : undefined;
}

export default function CloseSessionPage() {
  const router = useRouter();
  const sessionRef = useSessionRef();
  const [session, setSession] = useState<POSSession | null>(null);
  const [zReportData, setZReportData] = useState<ZReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [closingCash, setClosingCash] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!sessionRef) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    const fetchSessionAndZReport = async () => {
      try {
        setLoading(true);
        setNotFound(false);
        const data = await posApi.getSession(sessionRef);

        if (data.status === "closed") {
          toast.error("This session is already closed");
          router.push(`/dashboard/pos/sessions/${data.id}`);
          return;
        }

        setSession(data);
        
        try {
          const zData = await posApi.generateZReport(String(data.id));
          setZReportData(zData);
        } catch (zError) {
          console.error("Failed to pre-fetch Z-Report preview:", zError);
        }
      } catch (error: unknown) {
        console.error("Failed to fetch session:", error);
        const err = error as { response?: { status?: number } };
        if (err.response?.status === 404) {
          setNotFound(true);
        } else {
          toast.error("Failed to load session details");
          router.push("/dashboard/pos/sessions");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSessionAndZReport();
  }, [sessionRef, router]);

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

  if (notFound || !session) {
    return (
      <div className="flex flex-col min-h-full">
        <DashHeader title="POS Sessions" />
        <NotFoundView
          variant="embedded"
          title="Session not found"
          description="This session does not exist or the link is invalid."
          primaryHref="/dashboard/pos/sessions"
          primaryLabel="Back to Sessions"
        />
      </div>
    );
  }

  const expectedCash = session.expected_cash;
  const variance = closingCash ? parseFloat(closingCash) - expectedCash : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!closingCash || parseFloat(closingCash) < 0) {
      toast.error("Please enter a valid closing cash amount");
      return;
    }

    try {
      setSubmitting(true);
      await posApi.closeSession(String(session.id), parseFloat(closingCash), notes.trim() || undefined);

      toast.success("Session closed successfully");
      router.push(`/dashboard/pos/sessions/${session.id}`);
    } catch (error: unknown) {
      console.error("Failed to close session:", error);
      toast.error("Failed to close session");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <DashHeader title={`Close Session ${session.session_number}`} subtitle="Complete the session and reconcile cash" />
      <div className="flex-1 p-6 space-y-6">
        <Link href={`/dashboard/pos/sessions/${session.id}`} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" /> Back to Session
        </Link>
 
        <div className="max-w-3xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Expanded Z-Report preview confirmation block */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
              <h3 className="font-semibold text-gray-900 text-lg border-b pb-3">Z-Report Shift Summary</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Session info */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Session Number</span>
                    <span className="font-mono font-medium text-gray-900">{session.session_number}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Cashier</span>
                    <span className="font-medium text-gray-900">{session.cashier_name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Transactions</span>
                    <span className="font-medium text-gray-900">{zReportData?.total_transactions ?? session.total_transactions}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Items Sold</span>
                    <span className="font-medium text-gray-900">{zReportData?.total_items_sold ?? "—"}</span>
                  </div>
                </div>

                {/* Sales info */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Gross Sales</span>
                    <span className="font-medium text-gray-900">
                      Rs. {(zReportData?.gross_sales ?? session.total_sales).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total Discounts</span>
                    <span className="font-medium text-red-600">
                      Rs. {(zReportData?.total_discounts ?? 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Refunds</span>
                    <span className="font-medium text-red-600">
                      Rs. {(zReportData?.refunded_amount ?? 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm border-t pt-2">
                    <span className="font-medium text-gray-800">Net Sales</span>
                    <span className="font-bold text-[#22C55E]">
                      Rs. {(zReportData?.net_sales ?? session.total_sales).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wider text-xs">Payment Method Breakdown</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <span className="text-xs text-gray-400 block">Opening Cash</span>
                    <span className="font-bold text-gray-800">Rs. {session.opening_cash.toLocaleString()}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <span className="text-xs text-gray-400 block">Cash Sales</span>
                    <span className="font-bold text-gray-800">Rs. {session.cash_sales.toLocaleString()}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <span className="text-xs text-gray-400 block">Card/Digital Sales</span>
                    <span className="font-bold text-gray-800">
                      Rs. {(zReportData ? zReportData.card_sales + zReportData.digital_wallet_sales : session.card_sales).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-[#F8FAFC] p-4 rounded-xl flex justify-between items-center border border-gray-100">
                <span className="font-bold text-gray-800">Expected Closing Cash</span>
                <span className="text-lg font-extrabold text-gray-900">
                  Rs. {expectedCash.toLocaleString()}
                </span>
              </div>
            </div>
 
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div>
                <Label htmlFor="closingCash" className="text-sm font-semibold text-gray-850">
                  Actual Closing Cash (Rs.) *
                </Label>
                <Input
                  id="closingCash"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Enter actual closing cash"
                  value={closingCash}
                  onChange={(e) => setClosingCash(e.target.value)}
                  className="mt-2 h-10 border-gray-250 font-semibold"
                  required
                  disabled={submitting}
                />
                {closingCash && (
                  <div className={`mt-4 p-4 rounded-lg border ${
                    variance === 0 
                      ? "bg-green-50 text-green-700 border-green-200" 
                      : variance > 0 
                      ? "bg-blue-50 text-blue-700 border-blue-200" 
                      : "bg-red-50 text-red-700 border-red-200"
                  }`}>
                    <p className="text-xs uppercase font-bold tracking-wider mb-1">Reconciliation Status</p>
                    <p className="text-base font-extrabold">
                      {variance === 0
                        ? "Balanced (✓ Cash matches expected)"
                        : variance > 0
                        ? `Cash Over (+ Rs. ${variance.toLocaleString()})`
                        : `Cash Short (- Rs. ${Math.abs(variance).toLocaleString()})`}
                    </p>
                  </div>
                )}
              </div>
 
              <div>
                <Label htmlFor="notes" className="text-sm font-semibold text-gray-850">
                  Closing Notes (Optional)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this session closure..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-2 border-gray-200 min-h-[80px]"
                  disabled={submitting}
                />
              </div>
            </div>
 
            <div className="flex gap-3">
              <Button
                type="submit"
                className="bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold h-10 px-6"
                disabled={submitting}
              >
                {submitting ? "Closing..." : "Close Session & Generate Z-Report"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="h-10 px-6 border-gray-200"
                disabled={submitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
