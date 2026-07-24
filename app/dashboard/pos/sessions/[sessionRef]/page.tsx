"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft, Clock, User, Warehouse, Banknote,
  ArrowDownCircle, ArrowUpCircle, Trash2, Printer, Download,
} from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { ZReport } from "@/lib/api/pos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PosPageShell, posCardClass } from "@/components/dashboard/PosPageShell";
import { PosStatusBadge } from "@/components/pos/PosStatusBadge";
import { NotFoundView } from "@/components/shared/NotFoundView";
import posApi, { POSSession, POSCashMovement } from "@/lib/api/pos";
import { isValidPosSessionRef } from "@/lib/pos/session-ref";
import { formatNPR } from "@/lib/utils";
import { sumDigitalWalletSales } from "@/lib/pos/payment-methods";
import { toast } from "sonner";

function useSessionRef(): string | undefined {
  const params = useParams();
  const raw = params.sessionRef;
  const fromParams = Array.isArray(raw) ? raw[0] : raw;
  return isValidPosSessionRef(fromParams) ? fromParams : undefined;
}

export default function PosSessionDetailPage() {
  const sessionRef = useSessionRef();
  const [session, setSession] = useState<POSSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Cash movement dialog state
  const [showCashDialog, setShowCashDialog] = useState<"in" | "out" | null>(null);
  const [cashAmount, setCashAmount] = useState("");
  const [cashReason, setCashReason] = useState("");
  const [submittingCash, setSubmittingCash] = useState(false);

  const [zReportData, setZReportData] = useState<ZReport | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrintZReport = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Z-Report-${session?.session_number || "Session"}`,
  });

  const handleDownloadZReport = () => {
    if (!zReportData) {
      toast.error("Z-Report data is not loaded yet");
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(zReportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Z-Report-${zReportData.session_number}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  useEffect(() => {
    if (session && session.status === "closed") {
      const fetchZReport = async () => {
        try {
          const data = await posApi.generateZReport(String(session.id));
          setZReportData(data);
        } catch (error) {
          console.error("Failed to load Z-Report data:", error);
        }
      };
      fetchZReport();
    }
  }, [session]);

  const fetchSession = async () => {
    if (!sessionRef) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    try {
      setLoading(true);
      setNotFound(false);
      const data = await posApi.getSession(sessionRef);
      setSession(data);
    } catch (error: unknown) {
      console.error("Failed to fetch session:", error);
      const err = error as { response?: { status?: number; data?: { detail?: string } } };
      if (err.response?.status === 404) {
        setNotFound(true);
        setSession(null);
      } else {
        toast.error(err.response?.data?.detail || "Failed to load session details");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, [sessionRef]);

  const handleCashMovement = async () => {
    if (!session || !showCashDialog) return;
    const amount = parseFloat(cashAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!cashReason.trim()) {
      toast.error("Enter a reason");
      return;
    }

    setSubmittingCash(true);
    try {
      await posApi.createCashMovement({
        session: session.id,
        movement_type: showCashDialog,
        amount,
        reason: cashReason.trim(),
      });
      toast.success(`Cash ${showCashDialog === "in" ? "In" : "Out"} recorded`);
      setShowCashDialog(null);
      setCashAmount("");
      setCashReason("");
      fetchSession(); // Refresh to show updated movements
    } catch (error: unknown) {
      const err = error as { response?: { data?: { session?: string; detail?: string } } };
      toast.error(
        err.response?.data?.session ||
        err.response?.data?.detail ||
        "Failed to record cash movement"
      );
    } finally {
      setSubmittingCash(false);
    }
  };

  const handleDeleteMovement = async (id: string) => {
    try {
      await posApi.deleteCashMovement(id);
      toast.success("Cash movement deleted");
      fetchSession();
    } catch {
      toast.error("Failed to delete movement");
    }
  };

  if (loading) {
    return (
      <PosPageShell title="Session Details" subtitle="Loading..." variant="fullscreen" loading />
    );
  }

  if (notFound || !session) {
    return (
      <PosPageShell title="POS Sessions" variant="fullscreen">
        <NotFoundView
          variant="embedded"
          title="Session not found"
          description="This session does not exist or the link is invalid."
          primaryHref="/dashboard/pos/sessions"
          primaryLabel="Back to Sessions"
        />
      </PosPageShell>
    );
  }

  const digitalSales = session.card_sales + sumDigitalWalletSales(session);
  const closeHref = `/dashboard/pos/sessions/${sessionRef}/close`;
  const movements: POSCashMovement[] = session.cash_movements ?? [];
  const totalCashIn = Number(session.total_cash_in ?? 0);
  const totalCashOut = Number(session.total_cash_out ?? 0);

  return (
    <PosPageShell
      title={`Session ${session.session_number}`}
      subtitle={`Opened by ${session.cashier_name}`}
      variant="fullscreen"
    >
      <div className="w-full min-h-full space-y-6">
        <div className="flex flex-wrap items-center gap-2 sticky top-0 z-10 bg-[#F3F4F6] dark:bg-background py-2 -mx-1 px-1">
          <Link href="/dashboard/pos/sessions">
            <Button variant="outline" size="sm" className="gap-1.5 h-8">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Button>
          </Link>
          <PosStatusBadge status={session.status} />
          <div className="flex-1" />
          {session.status === "open" && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 h-8 text-green-700 border-green-200 hover:bg-green-50"
                onClick={() => setShowCashDialog("in")}
              >
                <ArrowDownCircle className="h-3.5 w-3.5" />
                Cash In
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 h-8 text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => setShowCashDialog("out")}
              >
                <ArrowUpCircle className="h-3.5 w-3.5" />
                Cash Out
              </Button>
              <Link href={closeHref}>
                <Button size="sm" className="bg-[#22C55E] hover:bg-[#16A34A] text-white h-8">
                  Close Session
                </Button>
              </Link>
            </>
          )}
          {session.status === "closed" && (
            <>
              <Button
                size="sm"
                onClick={handlePrintZReport}
                className="bg-[#22C55E] hover:bg-[#16A34A] text-white gap-1.5 h-8 font-medium"
              >
                <Printer className="h-3.5 w-3.5" />
                Print Z-Report
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownloadZReport}
                className="gap-1.5 h-8 border-gray-200"
              >
                <Download className="h-3.5 w-3.5" />
                Download Z-Report
              </Button>
            </>
          )}
        </div>

        {/* Cash In/Out Dialog */}
        {showCashDialog && (
          <div className={`${posCardClass} p-5 border-2 ${showCashDialog === "in" ? "border-green-200" : "border-red-200"}`}>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              {showCashDialog === "in" ? (
                <>
                  <ArrowDownCircle className="h-4 w-4 text-green-600" />
                  <span className="text-green-700">Cash In</span>
                </>
              ) : (
                <>
                  <ArrowUpCircle className="h-4 w-4 text-red-600" />
                  <span className="text-red-700">Cash Out</span>
                </>
              )}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Amount *</Label>
                <Input
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  placeholder="0.00"
                  className="mt-1"
                  autoFocus
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs">Reason *</Label>
                <Input
                  value={cashReason}
                  onChange={(e) => setCashReason(e.target.value)}
                  placeholder={showCashDialog === "in" ? "e.g. Change from bank" : "e.g. Petty cash expense"}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-3 justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowCashDialog(null);
                  setCashAmount("");
                  setCashReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCashMovement}
                disabled={submittingCash}
                className={showCashDialog === "in" ? "bg-green-600 hover:bg-green-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}
              >
                {submittingCash ? "Saving..." : `Record Cash ${showCashDialog === "in" ? "In" : "Out"}`}
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Sales", value: formatNPR(session.total_sales), accent: "text-[#22C55E]" },
            { label: "Transactions", value: String(session.total_transactions), accent: "text-gray-900 dark:text-foreground" },
            { label: "Cash Sales", value: formatNPR(session.cash_sales), accent: "text-gray-900 dark:text-foreground" },
            { label: "Digital Sales", value: formatNPR(digitalSales), accent: "text-gray-900 dark:text-foreground" },
          ].map((stat) => (
            <div key={stat.label} className={`${posCardClass} p-4`}>
              <p className="text-xs text-gray-500 dark:text-muted-foreground">{stat.label}</p>
              <p className={`text-xl font-bold mt-1 ${stat.accent}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`${posCardClass} p-6`}>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-foreground mb-4">
              Session Information
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 dark:text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Session #
                </span>
                <span className="font-medium text-gray-900 dark:text-foreground">
                  {session.session_number}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 dark:text-muted-foreground flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  Cashier
                </span>
                <span className="font-medium text-gray-900 dark:text-foreground">
                  {session.cashier_name}
                </span>
              </div>
              {session.warehouse_name && (
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500 dark:text-muted-foreground flex items-center gap-1.5">
                    <Warehouse className="h-3.5 w-3.5" />
                    Warehouse
                  </span>
                  <span className="font-medium text-gray-900 dark:text-foreground">
                    {session.warehouse_name}
                  </span>
                </div>
              )}
              <div className="flex justify-between gap-4 items-center">
                <span className="text-gray-500 dark:text-muted-foreground">Status</span>
                <PosStatusBadge status={session.status} />
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 dark:text-muted-foreground">Opened At</span>
                <span className="font-medium text-gray-900 dark:text-foreground">
                  {new Date(session.opened_at).toLocaleString("en-GB")}
                </span>
              </div>
              {session.closed_at && (
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500 dark:text-muted-foreground">Closed At</span>
                  <span className="font-medium text-gray-900 dark:text-foreground">
                    {new Date(session.closed_at).toLocaleString("en-GB")}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className={`${posCardClass} p-6`}>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-foreground mb-4 flex items-center gap-2">
              <Banknote className="h-4 w-4 text-[#22C55E]" />
              Cash Reconciliation
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-muted-foreground">Opening Cash</span>
                <span className="font-medium">{formatNPR(session.opening_cash)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-muted-foreground">Cash Sales</span>
                <span className="font-medium text-green-600">{formatNPR(session.cash_sales)}</span>
              </div>
              {totalCashIn > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-muted-foreground flex items-center gap-1">
                    <ArrowDownCircle className="h-3 w-3 text-green-500" />
                    Cash In
                  </span>
                  <span className="font-medium text-green-600">+{formatNPR(totalCashIn)}</span>
                </div>
              )}
              {totalCashOut > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-muted-foreground flex items-center gap-1">
                    <ArrowUpCircle className="h-3 w-3 text-red-500" />
                    Cash Out
                  </span>
                  <span className="font-medium text-red-600">-{formatNPR(totalCashOut)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-muted-foreground">Card Sales</span>
                <span className="font-medium">{formatNPR(session.card_sales)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-muted-foreground">eSewa Sales</span>
                <span className="font-medium">{formatNPR(session.esewa_sales)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-muted-foreground">Khalti Sales</span>
                <span className="font-medium">{formatNPR(session.khalti_sales)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-muted-foreground">Fonepay Sales</span>
                <span className="font-medium">{formatNPR(session.fonepay_sales)}</span>
              </div>
              {session.closing_cash != null && (
                <>
                  <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-border">
                    <span className="font-medium text-gray-900 dark:text-foreground">Expected Cash</span>
                    <span className="font-medium">{formatNPR(session.expected_cash)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-900 dark:text-foreground">Closing Cash</span>
                    <span className="font-bold">{formatNPR(session.closing_cash)}</span>
                  </div>
                  {session.cash_variance !== 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-muted-foreground">Variance</span>
                      <span
                        className={`font-medium ${
                          session.cash_variance > 0 ? "text-blue-600" : "text-red-600"
                        }`}
                      >
                        {session.cash_variance > 0 ? "+" : ""}
                        {formatNPR(session.cash_variance)}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Cash Movements Log */}
        {movements.length > 0 && (
          <div className={`${posCardClass} p-6`}>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-foreground mb-4 flex items-center gap-2">
              <Banknote className="h-4 w-4 text-[#22C55E]" />
              Cash Movements ({movements.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-border">
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Reason</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">By</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Time</th>
                    {session.status === "open" && (
                      <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 uppercase w-10"></th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-border">
                  {movements.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50/50 dark:hover:bg-muted/30">
                      <td className="py-2 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                            m.movement_type === "in"
                              ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                              : "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                          }`}
                        >
                          {m.movement_type === "in" ? (
                            <ArrowDownCircle className="h-3 w-3" />
                          ) : (
                            <ArrowUpCircle className="h-3 w-3" />
                          )}
                          {m.movement_type === "in" ? "Cash In" : "Cash Out"}
                        </span>
                      </td>
                      <td className={`py-2 px-3 text-right font-medium ${m.movement_type === "in" ? "text-green-600" : "text-red-600"}`}>
                        {m.movement_type === "in" ? "+" : "-"}{formatNPR(m.amount)}
                      </td>
                      <td className="py-2 px-3 text-gray-700 dark:text-foreground">{m.reason}</td>
                      <td className="py-2 px-3 text-gray-500 dark:text-muted-foreground">{m.performed_by_name || "—"}</td>
                      <td className="py-2 px-3 text-gray-500 dark:text-muted-foreground text-xs">
                        {new Date(m.performed_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      {session.status === "open" && (
                        <td className="py-2 px-3 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-red-400 hover:text-red-600"
                            onClick={() => handleDeleteMovement(m.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className={`${posCardClass} p-6`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-foreground">
              Transactions ({session.total_transactions})
            </h3>
            <Link
              href="/dashboard/pos/transactions"
              className="text-xs text-[#22C55E] hover:underline"
            >
              View all transactions
            </Link>
          </div>
          <p className="text-sm text-gray-500 dark:text-muted-foreground">
            Open the transactions list to review sales recorded during this session.
          </p>
        </div>
      </div>

      {/* Hidden Z-Report Print Template */}
      <div className="hidden">
        <div ref={printRef} className="p-8 space-y-6 text-black bg-white font-mono text-sm max-w-[800px] mx-auto">
          <div className="text-center space-y-1 border-b pb-4">
            <h1 className="text-xl font-bold uppercase">Z-Report (End of Day)</h1>
            <p className="text-xs text-gray-500">Session Number: {zReportData?.session_number}</p>
            <p className="text-xs text-gray-500">Generated: {zReportData ? new Date(zReportData.report_generated_at).toLocaleString() : ""}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div><strong>Cashier:</strong> {zReportData?.cashier}</div>
            <div><strong>Warehouse:</strong> {zReportData?.warehouse || "N/A"}</div>
            <div><strong>Opened At:</strong> {zReportData?.opened_at ? new Date(zReportData.opened_at).toLocaleString() : ""}</div>
            <div><strong>Closed At:</strong> {zReportData?.closed_at ? new Date(zReportData.closed_at).toLocaleString() : ""}</div>
          </div>
          
          <div className="border-t pt-4">
            <h2 className="font-bold mb-2 uppercase text-xs">Sales Summary</h2>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between"><span>Gross Sales:</span> <span>Rs. {zReportData?.gross_sales.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Total Discounts:</span> <span>Rs. {zReportData?.total_discounts.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Tax Collected:</span> <span>Rs. {zReportData?.tax_collected.toLocaleString()}</span></div>
              <div className="flex justify-between font-bold border-t pt-1"><span>Net Sales:</span> <span>Rs. {zReportData?.net_sales.toLocaleString()}</span></div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h2 className="font-bold mb-2 uppercase text-xs">Payment Method Summary</h2>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between"><span>Cash Sales:</span> <span>Rs. {zReportData?.cash_sales.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Card Sales:</span> <span>Rs. {zReportData?.card_sales.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Credit Sales:</span> <span>Rs. {zReportData?.credit_sales.toLocaleString()}</span></div>
              <div className="flex justify-between font-bold border-t pt-1"><span>Digital Wallets (Total):</span> <span>Rs. {zReportData?.digital_wallet_sales.toLocaleString()}</span></div>
              <div className="pl-4 space-y-1 text-[11px] text-gray-500">
                <div className="flex justify-between"><span>eSewa:</span> <span>Rs. {zReportData?.esewa_sales.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Khalti:</span> <span>Rs. {zReportData?.khalti_sales.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Fonepay:</span> <span>Rs. {zReportData?.fonepay_sales.toLocaleString()}</span></div>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h2 className="font-bold mb-2 uppercase text-xs">Cash Reconciliation</h2>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between"><span>Opening Cash:</span> <span>Rs. {zReportData?.opening_cash.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Cash In:</span> <span>Rs. {zReportData?.cash_in.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Cash Out:</span> <span>Rs. {zReportData?.cash_out.toLocaleString()}</span></div>
              <div className="flex justify-between font-bold border-t pt-1"><span>Expected Closing Cash:</span> <span>Rs. {zReportData?.expected_cash.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Actual Closing Cash:</span> <span>Rs. {zReportData?.closing_cash?.toLocaleString() ?? "—"}</span></div>
              <div className="flex justify-between font-bold border-t pt-1">
                <span>Variance:</span> 
                <span>Rs. {zReportData?.cash_variance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span> 
                <span>
                  {zReportData && zReportData.cash_variance === 0 
                    ? "Balanced" 
                    : zReportData && zReportData.cash_variance < 0 
                    ? "Cash Short" 
                    : "Cash Over"}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h2 className="font-bold mb-2 uppercase text-xs">Transaction Summary</h2>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between"><span>Total Transactions:</span> <span>{zReportData?.total_transactions}</span></div>
              <div className="flex justify-between"><span>Total Items Sold:</span> <span>{zReportData?.total_items_sold}</span></div>
              <div className="flex justify-between"><span>Refunded Transactions:</span> <span>{zReportData?.refunded_transactions}</span></div>
              <div className="flex justify-between"><span>Refunded Amount:</span> <span>Rs. {zReportData?.refunded_amount.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Cancelled Transactions:</span> <span>{zReportData?.cancelled_transactions}</span></div>
            </div>
          </div>
          
          <div className="text-center pt-8 border-t text-[10px] text-gray-400">
            End of Z-Report
          </div>
        </div>
      </div>
    </PosPageShell>
  );
}
